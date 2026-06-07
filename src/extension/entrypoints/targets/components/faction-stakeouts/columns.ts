import type { ColumnDef } from "@tanstack/table-core";

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
export type FactionStakeoutColumnId = "id" | "name" | "chain" | "members" | "respect" | "remove" | "notifications";

export type FactionStakeoutRow = {
	id: number;
	info: FactionStakeoutInfo;
	alerts: FactionStakeoutAlerts;
	isNew: boolean;
};

export const columns: ColumnDef<FactionStakeoutRow>[] = [
	createColumn("id", "ID"),
	createColumn("name", "Name"),
	createColumn("chain", "Chain"),
	createColumn("members", "Members"),
	createColumn("respect", "Respect"),
	createColumn("remove", "Remove"),
	createColumn("notifications", "Notifications"),
];

function createColumn(id: FactionStakeoutColumnId, header: string): ColumnDef<FactionStakeoutRow> {
	return { id, header };
}
