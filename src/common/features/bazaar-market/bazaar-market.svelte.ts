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

		removeExistingBox();
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
let latestRequest = 0;

async function displayBazaars(itemId: number, retry = 0) {
	const item = ITEM_RESOLVER.getStaticItem(itemId);
	if (!item) return;

	pendingItemId = itemId;
	const request = ++latestRequest;

	const anchor = await requireElement("[class*='sellerList___']");

	if (request !== latestRequest || pendingItemId !== itemId) {
		return;
	}

	removeExistingBox();
	bazaarMarketBox = mount(BazaarMarketBox, {
		target: anchor.parentElement!,
		anchor,
		props: { item },
	});

	// For some reason the element sometimes gets disconnected immediately, without even triggering a MutationObserver.
	if (retry < 3) {
		const marketBox = anchor.previousElementSibling;
		setTimeout(() => {
			if (marketBox.isConnected || !anchor.isConnected || request !== latestRequest || pendingItemId !== itemId) return;

			void displayBazaars(itemId, retry++);
		});
	}
}

function removeExistingBox() {
	if (bazaarMarketBox) void unmount(bazaarMarketBox);
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

	storageKeys() {
		return ["settings.pages.itemmarket.bazaars"];
	}
}
