import { api, factiondata, userdata } from "@common/utils/data/database";
import type { ApiError } from "tornapi-typescript";

export const FACTION_ACCESS = {
	none: "none",
	basic: "basic",
	full_access: "full_access",
} as const;

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
