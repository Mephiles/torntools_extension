import type { DataTableFeatures } from "@svelte/components/ui/data-table";
import { createColumnHelper } from "@tanstack/svelte-table";

export type FactionStakeoutAlerts = {
	chainReaches: number | false;
	memberCountDrops: number | false;
	rankedWarStarts: boolean;
	inRaid: boolean;
	inTerritoryWar: boolean;
};

export type FactionStakeoutInfo = {
	name: string;
	chain: number;
	respect: number;
	members: {
		current: number;
		maximum: number;
	};
	rankedWar: boolean;
	raid: boolean;
	territoryWar: boolean;
} | null;

export type BooleanAlertKey = "rankedWarStarts" | "inRaid" | "inTerritoryWar";
export type NumberAlertKey = "chainReaches" | "memberCountDrops";

export type FactionStakeoutRow = {
	id: number;
	info: FactionStakeoutInfo;
	alerts: FactionStakeoutAlerts;
	isNew: boolean;
};

const columnHelper = createColumnHelper<DataTableFeatures, FactionStakeoutRow>();

export const columns = columnHelper.columns([
	columnHelper.display({ id: "id", header: "ID" }),
	columnHelper.display({ id: "name", header: "Name" }),
	columnHelper.display({ id: "chain", header: "Chain" }),
	columnHelper.display({ id: "members", header: "Members" }),
	columnHelper.display({ id: "respect", header: "Respect" }),
	columnHelper.display({ id: "remove", header: "Remove" }),
	columnHelper.display({ id: "notifications", header: "Notifications" }),
]);
