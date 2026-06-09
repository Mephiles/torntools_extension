import type { StaticItem } from "@common/utils/torn-api/items.types";

export type StaticItemScopeFilter = (item: StaticItem) => boolean;

export interface UserscriptMetadata {
	name: string;
	description: string;
	version: string;
	matches: string[];
	runAt: "document-start" | "document-body" | "document-end" | "document-idle";
	staticItems?: StaticItemScopeFilter;
}
