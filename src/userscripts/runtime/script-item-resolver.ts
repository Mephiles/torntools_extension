import { ttCache } from "@common/utils/data/cache";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { millisToNewDay } from "@common/utils/functions/torn";
import type { FullItem, ItemResolver, StaticItem } from "@common/utils/torn-api/items.types";
import type { TornItem } from "tornapi-typescript";

export const ScriptItemResolver: ItemResolver & {
	itemsMap: Record<number, TornItem>;
	loadItems: () => Promise<void>;
} = {
	itemsMap: {},
	loadItem(id: number): StaticItem | FullItem | null {
		return this.getFullItem(id) ?? this.getStaticItem(id);
	},
	getStaticItem(id: number): StaticItem | null {
		return this.getFullItem(id);
	},
	hasFullItems: () => true,
	getFullItem(id: number): FullItem | null {
		if (!Object.keys(this.itemsMap).length) {
			throw new Error("no items loaded");
		}

		return id in this.itemsMap ? (this.itemsMap[id] as FullItem) : null;
	},
	async loadItems() {
		if (ttCache.hasValue("static-data", "items-map")) {
			this.itemsMap = ttCache.get("static-data", "items-map");
			return;
		}

		const data = await fetchData<PGTornToolsStaticItemsResponse>("playground_torntools", { section: "static-items" });
		const itemsMap = data.items.reduce((acc, item) => {
			acc[item.id] = item;
			return acc;
		}, {});

		this.itemsMap = itemsMap;
		void ttCache.set({ "static-data": { "items-map": itemsMap } }, millisToNewDay());
	},
};

interface PGTornToolsStaticItemsResponse {
	items: TornItem[];
}
