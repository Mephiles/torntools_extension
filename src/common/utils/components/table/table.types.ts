import type { Snippet } from "svelte";

export interface TableColumn<T> {
	id: keyof T;
	title: string;
	width: number;
	class?: string;
}

export type TableCells<T> = { [K in keyof T]?: Snippet<[T[K], T]> };

export type TableSummary<T> = { [K in keyof T]?: string | number };
