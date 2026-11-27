import { parse } from "bowser";
import type { ClientHints } from "bowser";

export type DeviceType = "desktop" | "mobile" | "tablet" | "tv" | "bot";

export interface DeviceInfo {
	browser: { name: string; version: string | null; major: string | null };
	os: { name: string; version: string | null };
	device: { type: DeviceType; mobile: boolean; family: string | null; model: string | null };
}

export interface DeviceSource {
	userAgent: string;
	brands?: readonly { brand: string; version: string }[];
	mobile?: boolean;
	maxTouchPoints?: number;
}

const DEVICE_TYPES = new Set<DeviceType>(["desktop", "mobile", "tablet", "tv", "bot"]);

function toOsVersion(version: string | undefined, versionName: string | undefined): string | null {
	return versionName ?? version?.replace(/^NT\s+/i, "") ?? null;
}

export function parseDeviceInfo({ userAgent, brands, mobile, maxTouchPoints }: DeviceSource): DeviceInfo {
	try {
		const hints: ClientHints | undefined = brands?.length ? { brands: [...brands], mobile } : undefined;
		const result = parse(userAgent, hints);

		const browserVersion = result.browser.version || null;
		const osVersion = toOsVersion(result.os.version, result.os.versionName);
		const platformType = result.platform.type as DeviceType | undefined;
		let type: DeviceType = platformType && DEVICE_TYPES.has(platformType) ? platformType : "desktop";

		// iPadOS reports a Macintosh user agent, so touch support is the only hint left.
		if (type === "desktop" && !mobile && (maxTouchPoints ?? 0) > 1 && result.os.name === "macOS") type = "tablet";

		return {
			browser: { name: result.browser.name || "unknown", version: browserVersion, major: browserVersion?.split(".")[0] ?? null },
			os: { name: result.os.name || "unknown", version: osVersion },
			device: {
				type,
				mobile: mobile ?? (type === "mobile" || type === "tablet"),
				family: result.platform.vendor || null,
				model: result.platform.model || null,
			},
		};
	} catch {
		return {
			browser: { name: "unknown", version: null, major: null },
			os: { name: "unknown", version: null },
			device: { type: "desktop", mobile: false, family: null, model: null },
		};
	}
}

let cachedDeviceInfo: DeviceInfo | undefined;

export function getDeviceInfo(): DeviceInfo {
	cachedDeviceInfo ??= parseDeviceInfo({
		userAgent: navigator.userAgent,
		brands: navigator.userAgentData?.brands,
		mobile: navigator.userAgentData?.mobile,
		maxTouchPoints: navigator.maxTouchPoints,
	});

	return cachedDeviceInfo;
}
