import type { FactionStakeoutEntry, StoredFactionStakeouts } from "@common/utils/data/default-database";
import type { FactionStakeoutAlerts, FactionStakeoutRow } from "./columns";

export function getFactionStakeoutRows(source: StoredFactionStakeouts | undefined): FactionStakeoutRow[] {
	return (source?.list ?? []).toSorted((a, b) => a.order - b.order).map((entry) => getFactionStakeoutRow(entry.id, entry, false));
}

export function getFactionStakeoutRow(id: number, entry: FactionStakeoutEntry, isNew: boolean): FactionStakeoutRow {
	return {
		id: id,
		info: entry.info ?? null,
		alerts: getAlerts(entry.alerts),
		isNew,
	};
}

export function getStoredFactionStakeouts(sourceRows: FactionStakeoutRow[], currentDate = 0): StoredFactionStakeouts {
	const now = Date.now();
	return {
		date: currentDate,
		list: sourceRows.map((row) => ({
			id: row.id,
			order: now,
			info: row.info,
			alerts: row.alerts,
		})),
	};
}

export function getAlerts(alerts?: Partial<FactionStakeoutAlerts>): FactionStakeoutAlerts {
	return {
		chainReaches: typeof alerts?.chainReaches === "number" ? alerts.chainReaches : false,
		memberCountDrops: typeof alerts?.memberCountDrops === "number" ? alerts.memberCountDrops : false,
		rankedWarStarts: Boolean(alerts?.rankedWarStarts),
		inRaid: Boolean(alerts?.inRaid),
		inTerritoryWar: Boolean(alerts?.inTerritoryWar),
	};
}
