import type { StoredFactionStakeouts } from "@common/utils/data/default-database";
import type { FactionStakeoutAlerts, FactionStakeoutRow } from "./columns";

export function getFactionStakeoutRows(source: StoredFactionStakeouts | undefined): FactionStakeoutRow[] {
	if (!source) return [];

	return Object.entries(source)
		.filter(([id]) => id !== "date")
		.map(([id, stakeout]) => getFactionStakeoutRow(id, stakeout, false));
}

export function getFactionStakeoutRow(id: string, source: unknown, isNew: boolean): FactionStakeoutRow {
	if (source && typeof source === "object" && !Array.isArray(source)) {
		const stakeout = source as { info?: FactionStakeoutRow["info"]; alerts?: Partial<FactionStakeoutAlerts> };

		return {
			id,
			info: stakeout.info ?? null,
			alerts: getAlerts(stakeout.alerts),
			isNew,
		};
	}

	return {
		id,
		info: null,
		alerts: getAlerts(),
		isNew,
	};
}

export function getStoredFactionStakeouts(sourceRows: FactionStakeoutRow[], currentDate = 0): StoredFactionStakeouts {
	const nextStakeouts: StoredFactionStakeouts = {
		date: currentDate,
	};

	for (const row of sourceRows) {
		nextStakeouts[row.id] = {
			info: row.info,
			alerts: row.alerts,
		};
	}

	return nextStakeouts;
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
