import { describe, expect, it } from "bun:test";
import { getDeviceInfo, parseDeviceInfo } from "./device";

const UAS = {
	chromeDesktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Safari/537.36",
	firefoxDesktop: "Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0",
	edgeDesktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
	operaGx: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/120.0.0.0",
	vivaldi: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
	samsungInternet:
		"Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
	firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:141.0) Gecko/141.0 Firefox/141.0",
	yandex: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 YaBrowser/24.10.0.0 Safari/537.36",
	safariIpad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
	ipad: "Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
	unknown: "totally-not-a-browser",
};

describe("device info", () => {
	it("reads the browser, version and OS of a desktop Chrome", () => {
		expect(parseDeviceInfo({ userAgent: UAS.chromeDesktop })).toEqual({
			browser: { name: "Chrome", version: "141.0.7390.122", major: "141" },
			os: { name: "Windows", version: "10" },
			device: { type: "desktop", mobile: false, family: null, model: null },
		});
	});

	it("names the long tail of Chromium browsers from the user agent alone", () => {
		expect(parseDeviceInfo({ userAgent: UAS.edgeDesktop }).browser.name).toBe("Microsoft Edge");
		expect(parseDeviceInfo({ userAgent: UAS.operaGx }).browser.name).toBe("Opera");
		expect(parseDeviceInfo({ userAgent: UAS.yandex }).browser.name).toBe("Yandex Browser");
		expect(parseDeviceInfo({ userAgent: UAS.samsungInternet }).browser).toEqual({ name: "Samsung Internet for Android", version: "27.0", major: "27" });
	});

	it("uses client hint brands for browsers that hide behind the Chrome user agent", () => {
		const brands = [
			{ brand: "Vivaldi", version: "7" },
			{ brand: "Chromium", version: "141" },
		];

		expect(parseDeviceInfo({ userAgent: UAS.vivaldi }).browser.name).toBe("Chrome");
		expect(parseDeviceInfo({ userAgent: UAS.vivaldi, brands, mobile: false }).browser).toEqual({ name: "Vivaldi", version: "7", major: "7" });
	});

	it("detects mobile devices and their OS", () => {
		expect(parseDeviceInfo({ userAgent: UAS.firefoxAndroid })).toMatchObject({
			browser: { name: "Firefox", version: "141.0" },
			os: { name: "Android", version: "14" },
			device: { type: "mobile", mobile: true },
		});
		expect(parseDeviceInfo({ userAgent: UAS.samsungInternet }).device).toMatchObject({ type: "mobile", mobile: true, family: null });
	});

	it("treats an iPad in desktop mode as a tablet", () => {
		expect(parseDeviceInfo({ userAgent: UAS.safariIpad, maxTouchPoints: 5 })).toMatchObject({
			os: { name: "macOS" },
			device: { type: "tablet", mobile: true, family: "Apple" },
		});
		expect(parseDeviceInfo({ userAgent: UAS.safariIpad, maxTouchPoints: 0 }).device.type).toBe("desktop");
		expect(parseDeviceInfo({ userAgent: UAS.ipad })).toMatchObject({
			os: { name: "iOS", version: "12.2" },
			device: { type: "tablet", mobile: true, family: "Apple", model: "iPad" },
		});
	});

	it("never throws on a user agent it cannot read", () => {
		expect(parseDeviceInfo({ userAgent: UAS.unknown })).toMatchObject({
			browser: { name: "unknown", version: null, major: null },
			os: { name: "unknown", version: null },
			device: { type: "desktop" },
		});
		expect(parseDeviceInfo({ userAgent: "" }).browser.name).toBe("unknown");
	});

	it("reads the current navigator once and caches it", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: { userAgent: UAS.firefoxAndroid, maxTouchPoints: 5, userAgentData: { brands: [{ brand: "Firefox", version: "141" }], mobile: true } },
			configurable: true,
		});

		expect(getDeviceInfo()).toMatchObject({
			browser: { name: "Firefox", version: "141.0" },
			os: { name: "Android", version: "14" },
			device: { type: "mobile" },
		});
		expect(getDeviceInfo()).toBe(getDeviceInfo());
	});
});
