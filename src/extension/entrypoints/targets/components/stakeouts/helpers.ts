import type { StakeoutData, StoredStakeouts } from "@common/utils/data/default-database";
import type { StakeoutAlerts, StakeoutRow } from "./columns";

export function getStakeoutRows(source: StoredStakeouts | undefined): StakeoutRow[] {
	return [...(source?.list ?? [])].sort((a, b) => a.order - b.order).map((entry) => getStakeoutRow(entry.id, entry, false));
}

export function getStakeoutRow(id: number, stakeout: StakeoutData | null, isNew: boolean): StakeoutRow {
	return {
		id,
		info: stakeout?.info ?? null,
		label: stakeout?.label ?? "",
		alerts: getAlerts(stakeout?.alerts),
		isNew,
	};
}

export function getStoredStakeouts(sourceRows: StakeoutRow[], currentDate = 0): StoredStakeouts {
	return {
		date: currentDate,
		list: sourceRows.map((row) => ({
			id: row.id,
			order: Date.now(),
			info: row.info,
			alerts: row.alerts,
			label: row.label,
		})),
	};
}

export function getAlerts(alerts?: Partial<StakeoutAlerts>): StakeoutAlerts {
	return {
		okay: alerts?.okay ?? false,
		hospital: alerts?.hospital ?? false,
		flying: alerts?.flying ?? false,
		landing: alerts?.landing ?? false,
		online: alerts?.online ?? false,
		idle: alerts?.idle ?? false,
		goesOffline: alerts?.goesOffline ?? false,
		life: alerts?.life ?? false,
		offline: typeof alerts?.offline === "number" ? alerts.offline : false,
		revivable: alerts?.revivable ?? false,
	};
}
