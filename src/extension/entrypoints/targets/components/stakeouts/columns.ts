import type { StakeoutData } from "@common/utils/data/default-database";
import type { DataTableFeatures } from "@svelte/components/ui/data-table";
import { createColumnHelper } from "@tanstack/svelte-table";

export type StakeoutAlerts = StakeoutData["alerts"];
export type StakeoutInfo = StakeoutData["info"];
export type BooleanAlertKey = "okay" | "hospital" | "flying" | "landing" | "online" | "idle" | "goesOffline" | "revivable";
export type NumberAlertKey = "life" | "offline";

export type StakeoutRow = {
	id: number;
	info: StakeoutInfo | null;
	label: string;
	alerts: StakeoutAlerts;
	isNew: boolean;
};

const columnHelper = createColumnHelper<DataTableFeatures, StakeoutRow>();

export const columns = columnHelper.columns([
	columnHelper.display({ id: "id", header: "ID" }),
	columnHelper.display({ id: "name", header: "Name" }),
	columnHelper.display({ id: "label", header: "Label" }),
	columnHelper.display({ id: "status", header: "Status" }),
	columnHelper.display({ id: "lastAction", header: "Last Action" }),
	columnHelper.display({ id: "remove", header: "Remove" }),
	columnHelper.display({ id: "notifications", header: "Notifications" }),
]);
