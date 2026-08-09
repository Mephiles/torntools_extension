import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import { mount, unmount } from "svelte";
import BazaarMarketBox from "./bazaar-market-box.svelte";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_ITEMS, async ({ item }) => {
		if (!FEATURE_MANAGER.isEnabled(BazaarMarketFeature)) return;

		await displayBazaars(item);
	});
	addCustomListener(EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS, () => {
		if (!FEATURE_MANAGER.isEnabled(BazaarMarketFeature)) return;

		dispose();
	});
}

async function startFeature() {
	const params = getHashParameters();
	if (!params.has("itemID")) return;

	const id = parseInt(params.get("itemID"));
	if (!id) return;

	await displayBazaars(id);
}

let bazaarMarketBox: unknown;
let pendingItemId: number;

async function displayBazaars(itemId: number) {
	const item = ITEM_RESOLVER.getStaticItem(itemId);
	if (!item) return;

	pendingItemId = itemId;

	const nextElement = await requireElement("[class*='sellerList___']");

	if (pendingItemId !== itemId) return;

	if (bazaarMarketBox) await unmount(bazaarMarketBox);

	bazaarMarketBox = mount(BazaarMarketBox, {
		target: nextElement.parentElement!,
		anchor: nextElement,
		props: { item },
	});
}

function dispose() {
	if (bazaarMarketBox) {
		void unmount(bazaarMarketBox);
		bazaarMarketBox = undefined;
	}
	pendingItemId = undefined;
}

export default class BazaarMarketFeature extends Feature {
	constructor() {
		super("Bazaar Market", "item market");
	}

	async requirements() {
		if (!settings.external.tornw3b) return "TornW3B not enabled.";

		return true;
	}

	isEnabled() {
		return settings.pages.itemmarket.bazaars;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		dispose();
	}

	storageKeys() {
		return ["settings.pages.itemmarket.bazaars"];
	}
}
