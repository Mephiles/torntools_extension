import { ttStorage } from "@common/utils/context";
import { setTorndata } from "@common/utils/data/database";
import type { StoredTorndata } from "@common/utils/data/default-database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { TornV1PawnshopResponse, TornV1StatsResponse } from "@common/utils/functions/api-v1.types";
import type {
	TornCalendarResponse,
	TornEducationResponse,
	TornHonorsResponse,
	TornItemsResponse,
	TornMedalsResponse,
	TornProperties,
} from "tornapi-typescript";

export type FetchedTorndata = TornEducationResponse &
	TornCalendarResponse &
	TornProperties &
	TornHonorsResponse &
	TornMedalsResponse &
	TornItemsResponse &
	TornV1PawnshopResponse &
	TornV1StatsResponse;

export async function updateTorndata() {
	// TODO - Migrate to V2 (torn/pawnshop).
	// TODO - Migrate to V2 (torn/stats).
	const data = await fetchData<FetchedTorndata>("tornv2", {
		section: "torn",
		selections: ["education", "calendar", "properties", "honors", "medals", "items"],
		legacySelections: ["pawnshop", "stats"],
	});
	if (data.stats.points_averagecost === null || data.stats.points_averagecost <= 0) {
		throw new Error("Aborted updating due to an unexpected/corrupted response.");
	}

	const newData: StoredTorndata = {
		...data,
		itemsMap: data.items.reduce((map, item) => {
			map[item.id] = item;
			return map;
		}, {}),
		date: Date.now(),
	};

	setTorndata(newData);
	await ttStorage.set({ torndata: newData });
}
