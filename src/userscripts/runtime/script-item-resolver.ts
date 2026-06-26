import { ttCache } from "@common/utils/data/cache";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { millisToNewDay } from "@common/utils/functions/torn";
import type { FullItem, ItemResolver, StaticItem } from "@common/utils/torn-api/items.types";
import type { TornItem } from "tornapi-typescript";

export const ScriptItemResolver: ItemResolver & {
	items: TornItem[];
	itemsMap: Record<number, TornItem>;
	loadItems: () => Promise<void>;
} = {
	items: [],
	itemsMap: {},
	loadItem(id: number): StaticItem | FullItem | null {
		return this.getFullItem(id) ?? this.getStaticItem(id);
	},
	findItem(matcher: (item: StaticItem | FullItem) => boolean): FullItem {
		return this.getAllFullItems().find(matcher) ?? null;
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
		console.debug("TT Userscripts - Loading items.");
		if (ttCache.hasValue("static-data", "items-map")) {
			console.debug("TT Userscripts - Using cached items.");
			const map = ttCache.get("static-data", "items-map");
			this.items = Object.values(map);
			this.itemsMap = map;
			return;
		}

		console.debug("TT Userscripts - No cached items, fetching.");
		const data = await fetchData<PGTornToolsStaticItemsResponse>("playground_torntools", { section: "static-items" });
		console.debug("TT Userscripts - Fetched items from remote.", data);
		const itemsMap = data.items.reduce((acc, item) => {
			acc[item.id] = item;
			return acc;
		}, {});

		this.items = Object.values(itemsMap);
		this.itemsMap = itemsMap;
		void ttCache.set({ "static-data": { "items-map": itemsMap } }, millisToNewDay());
	},
	getAllFullItems(): FullItem[] {
		return this.items as FullItem[];
	},
	getAllStaticItems(): StaticItem[] {
		return this.getAllFullItems();
	},
};

interface PGTornToolsStaticItemsResponse {
	items: TornItem[];
}
