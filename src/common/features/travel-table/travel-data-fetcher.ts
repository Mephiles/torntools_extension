import { settings } from "@common/utils/data/database";
import type { PrometheusTravelResponse, TornIntelTravelResponse, YATATravelResponse } from "@common/utils/functions/api.types";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { executePriorityServices, type PriorityService } from "@common/utils/functions/priority-services";

export type TravelStock = Record<
	string,
	{
		update: number;
		stocks: {
			id: number;
			name: string;
			quantity: number;
			cost: number;
		}[];
	}
>;

export interface TravelData {
	stocks: TravelStock | null;
}

interface TravelDataFetchResult {
	stocks: TravelStock;
	timestamp: number;
}

export async function fetchTravelData(): Promise<TravelData> {
	const services: PriorityService<TravelDataFetchResult>[] = [
		new PrometheusTravelDataFetcher(),
		new TornIntelTravelDataFetcher(),
		new YATATravelDataFetcher(),
	];

	const outcome = await executePriorityServices(services);

	return {
		stocks: outcome.result?.stocks ?? null,
	};
}

class PrometheusTravelDataFetcher implements PriorityService<TravelDataFetchResult> {
	readonly name = "Prometheus";

	enabled(): boolean {
		return settings.external.prometheus && settings.servicePreferences.travelData.prometheus.enabled;
	}

	priority(): number {
		return settings.servicePreferences.travelData.prometheus.priority;
	}

	async execute(): Promise<TravelDataFetchResult> {
		let result: PrometheusTravelResponse;

		try {
			result = await fetchData<PrometheusTravelResponse>("prometheus", { section: "travel", relay: true });
		} catch (error: any) {
			throw { service: "Prometheus", message: `Unknown - ${JSON.stringify(error)}` };
		}

		return result;
	}
}

class TornIntelTravelDataFetcher implements PriorityService<TravelDataFetchResult> {
	readonly name = "Torn Intel";

	enabled(): boolean {
		return settings.external.tornintel && settings.servicePreferences.travelData.tornintel.enabled;
	}

	priority(): number {
		return settings.servicePreferences.travelData.tornintel.priority;
	}

	async execute(): Promise<TravelDataFetchResult> {
		let result: TornIntelTravelResponse;

		try {
			result = await fetchData<TornIntelTravelResponse>("tornintel", {
				section: "foreign-stock/travel-table",
				relay: true,
			});
		} catch (error: any) {
			throw { service: "Torn Intel", message: `Unknown - ${JSON.stringify(error)}` };
		}

		return result;
	}
}

class YATATravelDataFetcher implements PriorityService<TravelDataFetchResult> {
	readonly name = "YATA";

	enabled(): boolean {
		return settings.external.yata && settings.servicePreferences.travelData.yata.enabled;
	}

	priority(): number {
		return settings.servicePreferences.travelData.yata.priority;
	}

	async execute(): Promise<TravelDataFetchResult> {
		let result: YATATravelResponse;

		try {
			result = await fetchData<YATATravelResponse>("yata", { section: "travel/export/", relay: true });
		} catch (error: any) {
			throw { service: "YATA", message: `Unknown - ${JSON.stringify(error)}` };
		}

		if (!("stocks" in result))
			throw {
				service: "YATA",
				message: `Unexpected response from YATA: ${JSON.stringify(result)}`,
			};

		return result;
	}
}
