import { torndata } from "@common/utils/data/database";
import type { StaticItem } from "@common/utils/torn-api/items.types";
import { STATIC_ITEM_MAP } from "@common/utils/torn-api/static-items";
import type { TornItem } from "tornapi-typescript";

export function loadItem(id: number): StaticItem | TornItem | null {
	if (torndata?.itemsMap && id in torndata.itemsMap) {
		return torndata.itemsMap[id];
	}

	return id in STATIC_ITEM_MAP ? STATIC_ITEM_MAP[id] : null;
}
