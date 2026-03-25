import "./bazaar-worth.css";
import { ExecutionTiming, Feature } from "@features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { ttCache } from "@/utils/common/data/cache";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { formatNumber } from "@/utils/common/functions/formatting";
import { addFetchListener } from "@/utils/common/functions/listeners";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

interface BazaarFetchItem {
	amount: number;
	averageprice: number;
}

function addListener() {
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page === "bazaar" && json) {
			if (json.list) {
				if (json.list.length === 0) addWorth(true, []);
				else if (json.list.length === json.total) addWorth(true, json.list as BazaarFetchItem[]);
				else if (json.list.length < json.total) addWorth(true, null);
			} else if (new URLSearchParams(fetch.url).get("step") === "getBazaarItems") {
				addWorth(true, null);
			}
		}
	});
}

async function addWorth(liveReload: boolean, list: BazaarFetchItem[] | null) {
	if (!liveReload) return;

	const bazaarUserId = parseInt(getSearchParameters().get("userId"));

	if (!bazaarUserId || bazaarUserId === userdata.profile.id) await requireElement(".info-msg-cont:not(.red) .msg");
	else await requireElement(".info-msg-cont .msg a[href]");

	if (list && Array.isArray(list)) {
		handleBazaar(list).catch(console.error);
		return;
	}

	if (ttCache.hasValue("bazaar", bazaarUserId)) {
		handleBazaar(ttCache.get("bazaar", bazaarUserId)).catch(console.error);
	} else {
		// TODO - Migrate to V2 (user/bazaar).
		fetchData("tornv2", { section: "user", id: bazaarUserId, selections: ["bazaar"], legacySelections: ["bazaar"] })
			.then((result) => {
				handleBazaar(result.bazaar);

				ttCache.set({ [bazaarUserId]: result.bazaar }, TO_MILLIS.SECONDS * 30, "bazaar");
			})
			.catch((error) => {
				document.querySelector(".info-msg-cont .msg").appendChild(
					elementBuilder({
						type: "div",
						class: "tt-bazaar-text",
						text: "TORN API returned error:" + error.toString(),
					})
				);
				console.log("TT - Bazaar Worth API Error:", error);
			});
	}

	async function handleBazaar(bazaar: any[]) {
		let total = 0;

		for (const item of bazaar) {
			if ("amount" in item) {
				total += item.averageprice * item.amount;
			} else {
				total += item.market_price * item.quantity;
			}
		}

		await requireElement("[class*='preloader___']:not(.undefined)", { invert: true });
		const text = document.querySelector(".tt-bazaar-text span");
		if (text) text.textContent = formatNumber(total, { currency: true });
		else {
			const message = document.querySelector(".info-msg-cont .msg");
			if (!message) return;

			observerText(message, bazaar);
			message.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-bazaar-text",
					children: [
						document.createTextNode("This bazaar is worth "),
						elementBuilder({ type: "span", text: formatNumber(total, { currency: true }) }),
						document.createTextNode("."),
					],
				})
			);
		}
	}

	function observerText(message: Element, items: any[]) {
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

function removeWorth() {
	document.querySelector(".tt-bazaar-text")?.remove();
}

export default class BazaarWorthFeature extends Feature {
	constructor() {
		super("Bazaar Worth", "bazaar", ExecutionTiming.IMMEDIATELY);
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.bazaar.worth;
	}

	initialise() {
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addWorth(liveReload ?? false, null);
	}

	cleanup() {
		removeWorth();
	}

	storageKeys() {
		return ["settings.pages.bazaar.worth"];
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
