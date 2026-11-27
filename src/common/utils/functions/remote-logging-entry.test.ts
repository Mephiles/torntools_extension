import { describe, expect, it } from "bun:test";
import { ElementNotFoundError } from "./find-elements";
import { mapStackInLogEntry, redactRemoteLogEntry, sanitizePageUrl, serializeLogEntry } from "./remote-logging-entry";

describe("remote logging entries", () => {
	it("should serialize messages, errors, data and sanitized page urls", () => {
		const entry = serializeLogEntry(
			{
				level: "error",
				section: "Feature",
				timestamp: 12_345,
				args: ["Failed", new Error("boom"), { foo: "bar" }],
			},
			[],
			"https://www.torn.com/profiles.php?XID=1&key=secret",
		);

		expect(entry.message).toBe("Failed Error: boom");
		expect(entry.data).toContain('"foo": "bar"');
		expect(entry.stack).toContain("Error: boom");
		expect(entry.url).toBe("https://www.torn.com/profiles.php?XID=1&key=[redacted]");
	});

	it("should serialize element lookup context", () => {
		const entry = serializeLogEntry(
			{
				level: "error",
				section: "Feature",
				timestamp: 1,
				args: [new ElementNotFoundError(".missing", "<body><div id='x'></div></body>")],
			},
			[],
		);

		expect(entry.extraData).toEqual({
			name: "ElementNotFoundError",
			selector: ".missing",
			parent: "<body><div id='x'></div></body>",
		});
	});

	it("should cap the element parent context", () => {
		const entry = serializeLogEntry(
			{
				level: "error",
				section: "Feature",
				timestamp: 1,
				args: [new ElementNotFoundError(".missing", "x".repeat(5_000))],
			},
			[],
		);

		expect(entry.extraData.parent).toHaveLength(2_000);
	});

	it("should redact a secret that would straddle a truncation limit", () => {
		const secret = "a".repeat(40);
		const entry = serializeLogEntry({ level: "error", section: null, timestamp: 1, args: [`${"x".repeat(3_980)}${secret}`] }, [secret]);

		expect(entry.message).toBe(`${`x`.repeat(3_980)}[redacted]`);
		expect(entry.message).not.toContain(secret.slice(0, 5));
	});

	it("should map the stack while keeping the rest of the entry", () => {
		const entry = {
			level: "error" as const,
			section: null,
			timestamp: 1,
			message: "Failed",
			stack: "    at run (chrome-extension://id/content-scripts/extension.js:1:2)",
			extraData: {},
		};

		const mapped = mapStackInLogEntry(entry, () => "    at run (/extension/features/example.ts:3:4)");

		expect(mapped).toEqual({ ...entry, stack: "    at run (/extension/features/example.ts:3:4)" });
		expect(entry.stack).toContain("chrome-extension://");
	});

	it("should leave the entry untouched without a stack or a mapping", () => {
		const withStack = { level: "error" as const, section: null, timestamp: 1, message: "Failed", stack: "raw", extraData: {} };
		const withoutStack = { level: "error" as const, section: null, timestamp: 1, message: "Failed", extraData: {} };

		expect(mapStackInLogEntry(withStack, () => "")).toBe(withStack);
		expect(mapStackInLogEntry(withoutStack, () => "mapped")).toBe(withoutStack);
		expect(
			mapStackInLogEntry(withStack, () => {
				throw new Error("mapping failed");
			}),
		).toBe(withStack);
	});

	it("should redact stored API keys and sensitive query parameters", () => {
		const entry = redactRemoteLogEntry(
			{
				level: "error",
				section: null,
				timestamp: 1,
				message: "Request failed for key=SECRET and key=full-api-key",
				data: '{"key":"full-api-key"}',
				stack: "Error: full-api-key",
				url: "https://www.torn.com/profiles.php?key=full-api-key",
				extraData: { parent: "<a href='https://www.torn.com/page.php?key=full-api-key'>x</a>" },
			},
			["full-api-key"],
		);

		expect(entry.message).not.toContain("full-api-key");
		expect(entry.message).toContain("key=[redacted]");
		expect(entry.data).not.toContain("full-api-key");
		expect(entry.stack).not.toContain("full-api-key");
		expect(entry.url).toBe("https://www.torn.com/profiles.php?key=[redacted]");
		expect(entry.extraData.parent).not.toContain("full-api-key");
	});

	it("should keep url query and hash while redacting tokens in text", () => {
		const entry = redactRemoteLogEntry(
			{
				level: "error",
				section: null,
				timestamp: 1,
				message: "Failed at https://www.torn.com/page.php?XID=1&key=secret and key=SECRET",
				data: '["https://api.torn.com/user/?key=secret&rfcv=abc"]',
				stack: "Error\n    at https://www.torn.com/js/main.js:1:2?rfcv=abc",
				url: "https://www.torn.com/page.php?XID=1&key=secret",
				extraData: {},
			},
			["SECRET"],
		);

		expect(entry.message).toBe("Failed at https://www.torn.com/page.php?XID=1&key=[redacted] and key=[redacted]");
		expect(entry.data).toBe('["https://api.torn.com/user/?key=[redacted]&rfcv=[redacted]"]');
		expect(entry.stack).toBe("Error\n    at https://www.torn.com/js/main.js:1:2?rfcv=[redacted]");
		expect(entry.url).toBe("https://www.torn.com/page.php?XID=1&key=[redacted]");
	});

	it("should ignore empty secrets instead of shredding the text", () => {
		const entry = redactRemoteLogEntry({ level: "error", section: null, timestamp: 1, message: "Failed for real-key", extraData: {} }, ["", "real-key"]);

		expect(entry.message).toBe("Failed for [redacted]");
	});

	it("should keep navigation parameters and redact sensitive ones", () => {
		expect(sanitizePageUrl("https://www.torn.com/factions.php?step=profile&ID=1")).toBe("https://www.torn.com/factions.php?step=profile&ID=1");
		expect(sanitizePageUrl("https://www.torn.com/forums.php#/p=threads&f=67&t=123")).toBe("https://www.torn.com/forums.php#/p=threads&f=67&t=123");
		expect(sanitizePageUrl("https://www.torn.com/page.php?sid=123&rfcv=abc&key=secret#/p=threads&token=xyz")).toBe(
			"https://www.torn.com/page.php?sid=123&rfcv=[redacted]&key=[redacted]#/p=threads&token=[redacted]",
		);
		expect(sanitizePageUrl("moz-extension://random-id/options.html?section=advanced")).toBe("/options.html?section=advanced");
		expect(sanitizePageUrl("not a url?key=secret")).toBe("not a url?key=[redacted]");
	});
});
