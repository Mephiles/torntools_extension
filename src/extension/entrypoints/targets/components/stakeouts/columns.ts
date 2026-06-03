import type { StakeoutData } from "@common/utils/data/default-database";
import type { ColumnDef } from "@tanstack/table-core";

export type StakeoutAlerts = StakeoutData["alerts"];
export type StakeoutInfo = StakeoutData["info"];
export type BooleanAlertKey = "okay" | "hospital" | "landing" | "online" | "revivable";
export type NumberAlertKey = "life" | "offline";
export type StakeoutColumnId = "id" | "name" | "label" | "status" | "lastAction" | "remove" | "notifications";

export type StakeoutRow = {
	id: string;
	info: StakeoutInfo | null;
	label: string;
	alerts: StakeoutAlerts;
	isNew: boolean;
};

export const columns: ColumnDef<StakeoutRow>[] = [
	createColumn("id", "ID"),
	createColumn("name", "Name"),
	createColumn("label", "Label"),
	createColumn("status", "Status"),
	createColumn("lastAction", "Last Action"),
	createColumn("remove", "Remove"),
	createColumn("notifications", "Notifications"),
];

function createColumn(id: StakeoutColumnId, header: string): ColumnDef<StakeoutRow> {
	return { id, header };
}
