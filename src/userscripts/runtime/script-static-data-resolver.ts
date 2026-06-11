import { ttCache } from "@common/utils/data/cache";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { millisToNewDay } from "@common/utils/functions/torn";
import type { StaticItemResolver } from "@common/utils/torn-api/items";
import type { StaticItem } from "@common/utils/torn-api/items.types";

export const ScriptStaticItemResolver: StaticItemResolver & {
	itemsMap: Record<number, StaticItem>;
	loadStaticItems: () => Promise<void>;
} = {
	itemsMap: {},
	getStaticItem(id: number): StaticItem | null {
		if (!Object.keys(this.itemsMap).length) {
			throw new Error("no items loaded");
		}

		return id in this.itemsMap ? this.itemsMap[id] : null;
	},
	async loadStaticItems() {
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
	items: StaticItem[];
}
