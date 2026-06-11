import { STATIC_ITEM_RESOLVER } from "@common/utils/context";
import { torndata } from "@common/utils/data/database";
import type { StaticItem } from "@common/utils/torn-api/items.types";
import type { TornItem } from "tornapi-typescript";

export function loadItem(id: number): StaticItem | TornItem | null {
	if (torndata?.itemsMap && id in torndata.itemsMap) {
		return torndata.itemsMap[id];
	}

	return STATIC_ITEM_RESOLVER.getStaticItem(id);
}

export interface StaticItemResolver {
	getStaticItem(id: number): StaticItem | null;
}
