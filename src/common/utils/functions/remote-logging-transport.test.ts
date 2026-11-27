import { describe, expect, it } from "bun:test";
import { REMOTE_LOGGING_DSN } from "./remote-logging";
import { createRemoteLoggingEnvelope, createRemoteLoggingEvent, getRemoteLoggingEnvelopeUrl } from "./remote-logging-transport";

const environment = {
	release: "torntools@9.3.4",
	environment: "production",
	device: {
		browser: { name: "Chrome", version: "141.0.7390.122", major: "141" },
		os: { name: "Windows", version: "10" },
		device: { type: "desktop" as const, mobile: false, family: null, model: null },
	},
};

describe("remote logging transport", () => {
	it("should build the GlitchTip envelope endpoint from the DSN", () => {
		expect(getRemoteLoggingEnvelopeUrl(REMOTE_LOGGING_DSN)).toBe(
			"https://logs.torntools.tornplayground.eu/api/1/envelope/?sentry_key=47b6494935134cc2af81581d3778610b&sentry_version=7",
		);
	});

	it("should build an issue event with grouping for message-only logs", () => {
		const state = { enabled: true, installId: "install", sessionId: "session", sessionExpiresAt: 100_000 };
		const event = createRemoteLoggingEvent(
			{
				level: "warn",
				section: "Feature",
				timestamp: 12_345,
				message: "Something went wrong",
				extraData: {},
			},
			state,
			environment,
			"event-id",
		);

		expect(event.event_id).toBe("event-id");
		expect(event.level).toBe("warning");
		expect(event.user).toEqual({ id: "install" });
		expect(event.tags).toMatchObject({
			install_id: "install",
			session_id: "session",
			section: "Feature",
			browser: "Chrome",
			browser_version: "141",
			os: "Windows",
			os_version: "10",
			device: "desktop",
		});
		expect(event.contexts).toEqual({
			browser: { name: "Chrome", version: "141.0.7390.122" },
			os: { name: "Windows", version: "10" },
			device: { type: "desktop" },
		});
		expect(event.extra).not.toHaveProperty("user_agent");
		expect(event.fingerprint).toEqual(["{{ default }}", "Feature", "Something went wrong"]);
	});

	it("should not set a message fingerprint when a stack is present", () => {
		const state = { enabled: true, installId: "install", sessionId: "session", sessionExpiresAt: 100_000 };
		const event = createRemoteLoggingEvent(
			{
				level: "error",
				section: "Feature",
				timestamp: 12_345,
				message: "Failed Error: boom",
				stack: "Error: boom\n    at run",
				extraData: {},
			},
			state,
			environment,
			"event-id",
		);

		expect("fingerprint" in event).toBe(false);
	});

	it("should build an envelope with byte lengths", () => {
		const event = {
			event_id: "event-id",
			level: "error",
			message: { formatted: "Failed" },
		};
		const envelope = createRemoteLoggingEnvelope([event], REMOTE_LOGGING_DSN, "2026-01-01T00:00:00.000Z");
		const [header, item, payload] = envelope.split("\n");

		expect(JSON.parse(header)).toMatchObject({ dsn: REMOTE_LOGGING_DSN, sent_at: "2026-01-01T00:00:00.000Z" });
		expect(JSON.parse(item)).toEqual({ type: "event", length: new TextEncoder().encode(payload).length });
		expect(JSON.parse(payload)).toEqual(event);
	});
});
