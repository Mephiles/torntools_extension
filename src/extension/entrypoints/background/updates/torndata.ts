import { FALLBACK_STATS } from "@common/constants/fallback/fallback-city-stats.ts";
import { ttStorage } from "@common/utils/context";
import { setTorndata, torndata } from "@common/utils/data/database";
import type { StoredTorndata } from "@common/utils/data/default-database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { isSameUTCDay } from "@common/utils/functions/utilities";
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

const NON_STATS_SELECTIONS = ["education", "calendar", "properties", "honors", "medals", "items"];
const STATS_SELECTION = "stats";

// Expected duration of the daily cron for updating the stats is about 35 minutes. During this time the API will give an error when trying to fetch it.
const STATS_BLACKOUT_MINUTES = 40;

export type TorndataUpdateMode = "none" | "partial" | "stats-only" | "full";

export function isStatsBlackout(now = new Date()): boolean {
	return now.getUTCHours() === 0 && now.getUTCMinutes() < STATS_BLACKOUT_MINUTES;
}

export function getTorndataUpdateMode(previous: StoredTorndata | undefined, now = new Date()): TorndataUpdateMode {
	if (!previous || !isSameUTCDay(previous.date, now)) {
		return isStatsBlackout(now) ? "partial" : "full";
	}

	if (!previous.statsStale) return "none";

	return isStatsBlackout(now) ? "none" : "stats-only";
}

function hasUsableStats(data: { stats?: TornCityStatsResponse["stats"] } | undefined): data is { stats: TornCityStatsResponse["stats"] } {
	return !!data?.stats && data.stats.currency.points_average_cost > 0;
}

export async function updateTorndata(force = false, previous: StoredTorndata = torndata, now = new Date()): Promise<TorndataUpdateMode> {
	const mode = force ? (isStatsBlackout(now) ? "partial" : "full") : getTorndataUpdateMode(previous, now);
	if (mode === "none") return mode;

	let selections = NON_STATS_SELECTIONS;
	if (mode === "full") selections = [...NON_STATS_SELECTIONS, STATS_SELECTION];
	else if (mode === "stats-only") selections = [STATS_SELECTION];

	const data = await fetchData<Partial<FetchedTorndata>>("tornv2", { section: "torn", selections });

	const statsStale = !hasUsableStats(data);
	const stats = statsStale ? (hasUsableStats(previous) ? previous.stats : FALLBACK_STATS) : data.stats;

	const newData: StoredTorndata = {
		...previous,
		...data,
		stats,
		statsStale,
		itemsMap: data.items
			? data.items.reduce<StoredTorndata["itemsMap"]>((map, item) => {
					map[item.id] = item;
					return map;
				}, {})
			: previous.itemsMap,
		date: Date.now(),
	};

	setTorndata(newData);
	await ttStorage.set({ torndata: newData });

	return mode;
}
