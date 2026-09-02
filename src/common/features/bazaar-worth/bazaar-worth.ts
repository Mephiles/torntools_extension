import "./bazaar-worth.css";
import { ITEM_RESOLVER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1BazaarItem, UserV1BazaarResponse } from "@common/utils/functions/api-v1.types";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getUserDetails } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { ExecutionTiming, Feature } from "@features/feature";

interface BazaarFetchItem {
	amount: number;
	averageprice: number;
}

function addListener() {
	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (page === "bazaar" && json) {
			if (json.list) {
				if (json.list.length === 0) await addWorth([]);
				else if (json.list.length === json.total) await addWorth(json.list as BazaarFetchItem[]);
				else if (json.list.length < json.total) await addWorth();
			} else if (new URLSearchParams(fetch.url).get("step") === "getBazaarItems") {
				await addWorth();
			}
		}
	});
}

async function addWorth(list: BazaarFetchItem[] | null = null) {
	const bazaarUserId = parseInt(getSearchParameters().get("userId"));

	if (!bazaarUserId || bazaarUserId === getUserDetails()?.id) await requireElement(".info-msg-cont:not(.red) .msg");
	else await requireElement(".info-msg-cont .msg a[href]");

	if (list && Array.isArray(list)) {
		handleBazaar(list).catch(console.error);
		return;
	}

	if (ttCache.hasValue("bazaar", bazaarUserId)) {
		handleBazaar(ttCache.get("bazaar", bazaarUserId)).catch(console.error);
	} else {
		// TODO - Migrate to V2 (user/bazaar).
		fetchData<UserV1BazaarResponse>("tornv2", { section: "user", id: bazaarUserId, legacySelections: ["bazaar"] })
			.then((result) => {
				handleBazaar(result.bazaar);

				ttCache.set({ [bazaarUserId]: result.bazaar }, TO_MILLIS.SECONDS * 30, "bazaar");
			})
			.catch((error) => {
				findElement(".info-msg-cont .msg").appendChild(
					elementBuilder({
						type: "div",
						class: "tt-bazaar-text",
						text: `TORN API returned error: ${error.toString()}`,
					}),
				);
				console.log("TT - Bazaar Worth API Error:", error);
			});
	}

	async function handleBazaar(bazaar: (UserV1BazaarItem | BazaarFetchItem)[]) {
		let total = 0;

		for (const item of bazaar) {
			if ("amount" in item) {
				total += item.averageprice * item.amount;
			} else {
				total += item.market_price * item.quantity;
			}
		}

		await requireElement("[class*='preloader___']:not(.undefined)", { invert: true });
		const text = findElement(".tt-bazaar-text span", true);
		if (text) text.textContent = formatNumber(total, { currency: true });
		else {
			const message = findElement(".info-msg-cont .msg", true);
			if (!message) return;

			observerText(message, bazaar);
			message.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-bazaar-text",
					text: "This bazaar is worth ",
					children: [elementBuilder({ type: "span", text: formatNumber(total, { currency: true }) }), "."],
				}),
			);
		}
	}

	function observerText(message: Element, items: (UserV1BazaarItem | BazaarFetchItem)[]) {
		const observer = new MutationObserver((mutations) => {
			if (mutations.every((m) => m.removedNodes.length === 0)) return;

			handleBazaar(items);
			observer.disconnect();
			clearTimeout(interval);
		});
		const interval = setTimeout(() => observer.disconnect(), 1000);

		observer.observe(message, { childList: true, subtree: true });
	}
}

export default class BazaarWorthFeature extends Feature {
	constructor() {
		super("Bazaar Worth", "bazaar", ExecutionTiming.IMMEDIATELY);
	}

	override requirements() {
		if (!ITEM_RESOLVER.hasFullItems()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.bazaar.worth;
	}

	override initialise() {
		addListener();
	}

	override async reload() {
		await addWorth();
	}

	override storageKeys() {
		return ["settings.pages.bazaar.worth"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
