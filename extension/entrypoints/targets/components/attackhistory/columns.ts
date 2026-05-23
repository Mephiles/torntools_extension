import type { ColumnDef } from "@tanstack/table-core";

export type SwitchableKey = "mug" | "leave" | "hospitalise" | "arrest" | "special" | "stealth";
export type HistoryColumnId =
	| "id"
	| "name"
	| "lastAttack"
	| "win"
	| SwitchableKey
	| "assist"
	| "defend"
	| "lose"
	| "stalemate"
	| "escapes"
	| "defend_lost"
	| "respect"
	| "fair_fight";

export type HistoryRow = {
	id: string;
	name: string;
	lastAttack: number;
	lastAttackLabel: string;
	lastAttackCode: string;
	win: number;
	mug: number;
	mugLabel: string;
	leave: number;
	leaveLabel: string;
	hospitalise: number;
	hospitaliseLabel: string;
	arrest: number;
	arrestLabel: string;
	special: number;
	specialLabel: string;
	stealth: number;
	stealthLabel: string;
	assist: number;
	defend: number;
	lose: number;
	stalemate: number;
	escapes: number;
	defend_lost: number;
	respect: number;
	respectLabel: string;
	fair_fight: number;
	fairFightLabel: string;
};

export const columns: ColumnDef<HistoryRow>[] = [
	createColumn("id", "ID"),
	createColumn("name", "Name"),
	createColumn("lastAttack", "Last Attack"),
	createColumn("win", "Wins"),
	createColumn("mug", "Mugs"),
	createColumn("leave", "Leaves"),
	createColumn("hospitalise", "Hosps"),
	createColumn("arrest", "Arrests"),
	createColumn("special", "Specials"),
	createColumn("stealth", "Stealths"),
	createColumn("assist", "Assists"),
	createColumn("defend", "Defends"),
	createColumn("lose", "Losses"),
	createColumn("stalemate", "Stalemates"),
	createColumn("escapes", "Escapes"),
	createColumn("defend_lost", "Defends Lost"),
	createColumn("respect", "Respect"),
	createColumn("fair_fight", "FF"),
];

function createColumn(id: HistoryColumnId, header: string): ColumnDef<HistoryRow> {
	return {
		accessorKey: id,
		header,
		enableSorting: true,
		sortDescFirst: id !== "id" && id !== "name",
		cell: ({ column, row }) => getCellLabel(row.original, column.id),
	};
}

function getCellLabel(row: HistoryRow, columnId: string) {
	switch (columnId) {
		case "mug":
		case "leave":
		case "hospitalise":
		case "arrest":
		case "special":
		case "stealth":
		case "respect":
			return row[`${columnId}Label`];
		case "fair_fight":
			return row.fairFightLabel;
		default:
			return row[columnId as keyof HistoryRow];
	}
}
