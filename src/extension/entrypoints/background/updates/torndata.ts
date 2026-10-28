import { ttStorage } from "@common/utils/context";
import { setTorndata } from "@common/utils/data/database";
import type { StoredTorndata } from "@common/utils/data/default-database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type {
	TornCalendarResponse,
	TornCityStatsResponse,
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
	TornCityStatsResponse;

export async function updateTorndata() {
	const data = await fetchData<FetchedTorndata>("tornv2", {
		section: "torn",
		selections: ["education", "calendar", "properties", "honors", "medals", "items", "stats"],
	});
	if (data.stats.currency.points_average_cost === null || data.stats.currency.points_average_cost <= 0) {
		throw new Error("Aborted updating due to an unexpected/corrupted response.");
	}

	const newData: StoredTorndata = {
		...data,
		itemsMap: data.items.reduce<StoredTorndata["itemsMap"]>((map, item) => {
			map[item.id] = item;
			return map;
		}, {}),
		date: Date.now(),
	};

	setTorndata(newData);
	await ttStorage.set({ torndata: newData });
}
