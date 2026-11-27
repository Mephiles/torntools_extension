import { afterEach, describe, expect, it } from "bun:test";
import { usingFirefox } from "./browser";

const realNavigator = globalThis.navigator;

function withUserAgent(userAgent: string) {
	Object.defineProperty(globalThis, "navigator", { value: { userAgent }, configurable: true });
}

afterEach(() => {
	Object.defineProperty(globalThis, "navigator", { value: realNavigator, configurable: true });
});

describe("browser detection", () => {
	it("detects Firefox", () => {
		withUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0");

		expect(usingFirefox()).toBe(true);
	});

	it("does not treat other browsers as Firefox", () => {
		withUserAgent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0");

		expect(usingFirefox()).toBe(false);
	});
});
