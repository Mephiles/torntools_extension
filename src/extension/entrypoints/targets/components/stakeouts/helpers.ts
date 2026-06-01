import type { StakeoutData, StoredStakeouts } from "@utils/data/default-database";
import type { StakeoutAlerts, StakeoutRow } from "./columns";

export function getStakeoutRows(source: StoredStakeouts | undefined): StakeoutRow[] {
	return (source?.order ?? []).map((id) => getStakeoutRow(id, source?.[id], false));
}

export function getStakeoutRow(id: string, source: StakeoutData | unknown, isNew: boolean): StakeoutRow {
	if (source && typeof source === "object" && !Array.isArray(source)) {
		const stakeout = source as StakeoutData;

		return {
			id,
			info: stakeout.info ?? null,
			label: stakeout.label ?? "",
			alerts: getAlerts(stakeout.alerts),
			isNew,
		};
	}

	return {
		id,
		info: null,
		label: "",
		alerts: getAlerts(),
		isNew,
	};
}

export function getStoredStakeouts(sourceRows: StakeoutRow[], currentDate = 0): StoredStakeouts {
	const nextStakeouts: StoredStakeouts = {
		order: sourceRows.map((row) => row.id),
		date: currentDate,
	};

	for (const row of sourceRows) {
		nextStakeouts[row.id] = {
			info: row.info,
			alerts: row.alerts,
			label: row.label,
		};
	}

	return nextStakeouts;
}

export function getAlerts(alerts?: Partial<StakeoutAlerts>): StakeoutAlerts {
	return {
		okay: alerts?.okay,
		hospital: alerts?.hospital,
		landing: alerts?.landing,
		online: alerts?.online,
		life: alerts?.life,
		offline: typeof alerts?.offline === "number" ? alerts.offline : false,
		revivable: Boolean(alerts?.revivable),
	};
}
