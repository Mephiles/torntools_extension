import { ttCache } from "@common/utils/data/cache";
import { settings } from "@common/utils/data/database";
import type { TornstatsSpy, YATASpyResponse } from "@common/utils/functions/api.types";
import { CUSTOM_API_ERROR, fetchData } from "@common/utils/functions/api-fetcher";
import { formatTime } from "@common/utils/functions/formatting";
import { executePriorityServices, PriorityService, type ServiceError } from "@common/utils/functions/priority-services";
import { TO_MILLIS } from "@common/utils/functions/utilities";

export interface SpyResult {
	defense: number;
	dexterity: number;
	speed: number;
	strength: number;
	total: number;
	type: string | false;
	timestamp: number;
	updated: string;
	source: string;
}

export interface SpyOutcome {
	result: SpyResult | null;
	isCached: boolean;
	errors: ServiceError[];
}

interface SpyFetchResult {
	spy: SpyResult;
	cached: boolean;
}

export async function performSpy(id: number, ignoreCache: boolean): Promise<SpyOutcome> {
	const services: PriorityService<SpyFetchResult>[] = [new YATASpyPerformer(id, ignoreCache), new TornStatsSpyPerformer(id, ignoreCache)];

	const outcome = await executePriorityServices(services, (a, b) => (a.spy.timestamp > b.spy.timestamp ? a : b));

	return {
		result: outcome.result?.spy ?? null,
		isCached: outcome.result?.cached ?? false,
		errors: outcome.errors,
	};
}

abstract class SpyPerformer extends PriorityService<SpyFetchResult> {
	protected id: number;
	protected ignoreCache: boolean;

	constructor(id: number, ignoreCache: boolean) {
		super();
		this.id = id;
		this.ignoreCache = ignoreCache;
	}
}

class YATASpyPerformer extends SpyPerformer {
	readonly name = "YATA";

	enabled(): boolean {
		return settings.external.yata && settings.servicePreferences.spies.yata.enabled;
	}

	priority(): number {
		return settings.servicePreferences.spies.yata.priority;
	}

	async execute(): Promise<SpyFetchResult> {
		let result: YATASpyResponse["spies"][string];
		let isCached = false;

		try {
			if (!this.ignoreCache && ttCache.hasValue("yata-spy", this.id)) {
				result = ttCache.get("yata-spy", this.id);
				isCached = true;
			} else {
				const yataResult = await fetchData<YATASpyResponse>("yata", { relay: true, section: "spy", id: this.id, includeKey: true, silent: true });

				if (!("error" in yataResult) && yataResult.spies[this.id]) {
					result = {
						...yataResult.spies[this.id],
						update: yataResult.spies[this.id].update * 1000,
					};
				}

				ttCache.set({ [this.id]: result || false }, getCacheTime(!result, result?.update ? result.update * 1000 : 0), "yata-spy");
				isCached = false;
			}
		} catch (error: any) {
			throw mapYataError(error);
		}

		if (!result) throw { service: "YATA", message: "No spy data available." };

		return {
			spy: {
				defense: result.defense,
				dexterity: result.dexterity,
				speed: result.speed,
				strength: result.strength,
				total: result.total,
				type: false,
				timestamp: result.update,
				updated: formatTime(result.update, { type: "ago" }),
				source: "YATA",
			},
			cached: isCached,
		};
	}
}

class TornStatsSpyPerformer extends SpyPerformer {
	readonly name = "TornStats";

	enabled(): boolean {
		return settings.external.tornstats && settings.servicePreferences.spies.tornstats.enabled;
	}

	priority(): number {
		return settings.servicePreferences.spies.tornstats.priority;
	}

	async execute(): Promise<SpyFetchResult> {
		let result: { status: boolean; message: string; spy: undefined | TornstatsSpy["spy"] };
		let isCached = false;

		try {
			if (!this.ignoreCache && ttCache.hasValue("tornstats-spy", this.id)) {
				result = ttCache.get("tornstats-spy", this.id);
				isCached = true;
			} else {
				const tsResult = await fetchData<TornstatsSpy>("tornstats", { section: "spy/user", id: this.id, silent: true, relay: true });

				result = {
					status: tsResult.status,
					message: tsResult.message,
					spy: tsResult.spy,
				};

				ttCache.set(
					{ [this.id]: result },
					getCacheTime(result.spy?.status, result.spy && "timestamp" in result.spy ? result.spy.timestamp * 1000 : 0),
					"tornstats-spy",
				);
				isCached = false;
			}
		} catch (error: any) {
			throw mapTornStatsError(error);
		}

		if (!result.spy?.status) {
			if (!result.status && result.message) {
				throw { service: "TornStats", message: result.message.includes("User not found.") ? "You don't have an account." : result.message };
			}
			throw { service: "TornStats", message: "No spy found." };
		}

		const timestamp = result.spy.timestamp * 1000;

		return {
			spy: {
				defense: result.spy.defense,
				dexterity: result.spy.dexterity,
				speed: result.spy.speed,
				strength: result.spy.strength,
				total: result.spy.total,
				type: result.spy.type,
				timestamp,
				updated: result.spy.difference,
				source: "TornStats",
			},
			cached: isCached,
		};
	}
}

function getCacheTime(hasSpy: boolean, timestamp: number) {
	// If no spy was found, cache for an hour.
	if (!hasSpy) return TO_MILLIS.HOURS;

	// If the spy is older than 31 days, cache it for 6 hours. Newer spies are cached for a day.
	return timestamp / TO_MILLIS.DAYS > 31 ? TO_MILLIS.HOURS * 6 : TO_MILLIS.DAYS;
}

function mapYataError(error: any): ServiceError {
	if (error.error && typeof error.error === "object") {
		const { code, error: message } = error.error;

		if (code === 2 && message === "Player not found") return { service: "YATA", message: "You don't have an account." };
		else if (code === 429) return { service: "YATA", message: "Due to server overload, YATA is imposing a rate limit." };
		else if (code === 502) return { service: "YATA", message: "YATA appears to be down." };
		else return { service: "YATA", message: `Unknown (${code}) - ${message}` };
	}

	const code = error.code;
	if (code === 502) return { service: "YATA", message: "YATA appears to be down." };
	else if (code === CUSTOM_API_ERROR.CANCELLED) return { service: "YATA", message: "Request took too long, YATA is probably taking too long to respond." };
	else if (code === CUSTOM_API_ERROR.NO_NETWORK) return { service: "YATA", message: "Network issues. You likely have no internet at this moment." };
	else if (code === CUSTOM_API_ERROR.NO_PERMISSION)
		return { service: "YATA", message: "Permission not granted. Please make sure YATA has permission to run." };
	else return { service: "YATA", message: `Unknown - ${JSON.stringify(error)}` };
}

function mapTornStatsError(error: any): ServiceError {
	if (error.error && typeof error.error === "object") {
		const { code, error: message } = error.error;

		if (code === 429) return { service: "TornStats", message: "You've exceeded your API limit. Try again in a minute." };
		else return { service: "TornStats", message: `Unknown (${code}) - ${message}` };
	}

	const code = error.code;
	if (code === 502) return { service: "TornStats", message: "TornStats appears to be down." };
	else if (code === CUSTOM_API_ERROR.NO_NETWORK || code === CUSTOM_API_ERROR.CANCELLED)
		return { service: "TornStats", message: "Network issues. You likely have no internet at this moment." };
	else if (code === CUSTOM_API_ERROR.NO_PERMISSION)
		return { service: "TornStats", message: "Permission not granted. Please make sure TornStats has permission to run." };
	else return { service: "TornStats", message: `Unknown - ${JSON.stringify(error)}` };
}
