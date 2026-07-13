import type { DatabaseFactiondata, DatabaseStockdata, DatabaseTorndata, DatabaseUserdata } from "@common/utils/data/database";

export type HealthStatus = "checking" | "healthy" | "corrupted";

export function getHealthStatus<T>(value: T | undefined, isHealthy: (value: T) => boolean): HealthStatus {
	if (value === undefined) return "checking";

	return isHealthy(value) ? "healthy" : "corrupted";
}

export function isUserdataHealthy(value: DatabaseUserdata) {
	return typeof value === "object" && value !== null && Object.keys(value).length > 5;
}

export function isTorndataHealthy(value: DatabaseTorndata) {
	return typeof value === "object" && value !== null && "items" in value && Array.isArray(value.items) && value.items.length > 5;
}

export function isStockdataHealthy(value: DatabaseStockdata) {
	return typeof value === "object" && value !== null && "stocks" in value && Array.isArray(value.stocks) && value.stocks.length > 5;
}

export function isFactiondataHealthy(value: DatabaseFactiondata) {
	return typeof value === "object" && value !== null && "access" in value && typeof value.access === "string";
}
