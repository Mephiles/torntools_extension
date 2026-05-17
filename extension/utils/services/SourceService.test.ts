import { describe, expect, it } from "bun:test";
import { SourceService } from "./SourceService";

const location = {
	rawPath: "../extension/features/example.ts",
	path: "/extension/features/example.ts",
	file: "example.ts",
	line: 12,
	column: 34,
};

describe("SourceService", () => {
	describe("parseGeneratedSourceStackFrame", () => {
		it("should parse Chrome stack frames with methods", () => {
			expect(
				SourceService.parseGeneratedSourceStackFrame("    at runFeature (chrome-extension://<torntools-uuid>/content-scripts/extension.js:123:45)"),
			).toEqual({
				method: "runFeature",
				line: 123,
				column: 45,
			});
		});

		it("should parse Chrome stack frames without methods", () => {
			expect(SourceService.parseGeneratedSourceStackFrame("    at chrome-extension://<torntools-uuid>/content-scripts/extension.js:123:45")).toEqual({
				method: null,
				line: 123,
				column: 45,
			});
		});

		it("should parse Firefox stack frames with methods", () => {
			expect(SourceService.parseGeneratedSourceStackFrame("runFeature@moz-extension://<torntools-uuid>/content-scripts/extension.js:123:45")).toEqual({
				method: "runFeature",
				line: 123,
				column: 45,
			});
		});

		it("should parse Firefox stack frames without methods", () => {
			expect(SourceService.parseGeneratedSourceStackFrame("@moz-extension://<torntools-uuid>/content-scripts/extension.js:123:45")).toEqual({
				method: null,
				line: 123,
				column: 45,
			});
		});

		it("should ignore non-extension stack frames", () => {
			expect(SourceService.parseGeneratedSourceStackFrame("    at runFeature (https://example.com/script.js:123:45)")).toBeNull();
		});
	});

	describe("formatMappedStackFrame", () => {
		it("should format frames with methods", () => {
			expect(SourceService.formatMappedStackFrame({ method: "runFeature" }, location)).toBe("    at runFeature (/extension/features/example.ts:12:34)");
		});

		it("should format frames without methods", () => {
			expect(SourceService.formatMappedStackFrame({ method: null }, location)).toBe("    at /extension/features/example.ts:12:34");
		});
	});

	describe("convertSourceLocation", () => {
		it("should convert source-map positions to source locations", () => {
			expect(
				SourceService.convertSourceLocation({
					source: "../extension/features/example.ts",
					line: 12,
					column: 34,
					name: null,
				}),
			).toEqual(location);
		});

		it("should return null for unmapped positions", () => {
			expect(
				SourceService.convertSourceLocation({
					source: null,
					line: null,
					column: null,
					name: null,
				}),
			).toBeNull();
		});
	});
});
