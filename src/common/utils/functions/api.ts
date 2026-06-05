import { api, factiondata, userdata } from "@common/utils/data/database";
import { ttStorage } from "@common/utils/data/storage";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { ApiError } from "tornapi-typescript";
import { BACKGROUND_SERVICE } from "@/services/proxy-services";

export const FACTION_ACCESS = {
	none: "none",
	basic: "basic",
	full_access: "full_access",
} as const;

export async function checkAPIPermission(key: string) {
	try {
		const response = await fetchData("tornv2", { section: "key", selections: ["info"], key, silent: true });
		const { type, faction, company } = response.info.access;

		if (type === "Limited Access" || type === "Full Access") {
			return { access: true, faction, company };
		} else {
			return { access: false };
		}
	} catch (error) {
		throw error.error;
	}
}

export async function changeAPIKey(key: string): Promise<void> {
	try {
		await fetchData("tornv2", { section: "user", selections: ["basic"], key, silent: true });
		await ttStorage.change({ api: { torn: { key } } });

		await BACKGROUND_SERVICE.initialize();
	} catch (error) {
		throw error.error;
	}
}

export function hasAPIData(): boolean {
	const hasKey = !!api?.torn?.key;
	const hasError = !!api?.torn?.error && !api.torn.error.includes("Backend error") && api.torn.error !== "Network issues";
	const hasUserdata = !!(userdata && Object.keys(userdata).length);

	return hasKey && !hasError && hasUserdata;
}

export function hasFactionAPIAccess(): boolean {
	if (!hasAPIData()) return false;

	return userdata.faction && factiondata?.access === FACTION_ACCESS.full_access;
}

export function hasOC2Data(): boolean {
	if (!hasAPIData() || !("organizedCrime" in userdata)) return false;

	return userdata.organizedCrime === null || !("error" in userdata.organizedCrime);
}

export function hasOC1Data(): boolean {
	if (!hasAPIData() || !("organizedCrime" in userdata)) return false;

	// 27: "Must be migrated to organized crimes 2.0"
	return userdata.organizedCrime !== null && "code" in userdata.organizedCrime && userdata.organizedCrime.code === 27;
}

export function isTornApiError(response: any): response is ApiError {
	return !!response && typeof response === "object" && "error" in response && "code" in response;
}
