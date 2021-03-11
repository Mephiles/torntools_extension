"use strict";

(async () => {
	const page = getPage();

	if (page === "factions" && getSearchParameters().get("step") !== "your") return;

	// noinspection JSIncompatibleTypesComparison
	const feature = featureManager.registerFeature(
		"Highlight Blood Bags",
		"items",
		() => settings.pages.items.highlightBloodBags !== "none",
		initialiseBloodBags,
		highlightBloodBags,
		removeHighlights,
		{
			storage: ["settings.pages.items.highlightBloodBags"],
		},
		null
	);

	function initialiseBloodBags() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push((details) => {
			if (!feature.enabled()) return;

			const { section } = details;
			if (section !== "medical") return;

			highlightBloodBags();
		});
	}

	async function highlightBloodBags() {
		// TODO - Implement for the items page.
		await requireContent();

		if (page === "factions") {
			if (getCurrentTab() === "armoury") {
				await requireElement("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']");

				if (getCurrentSection() !== "medical") return;
			} else return;
		}

		const allowedBlood = ALLOWED_BLOOD[settings.pages.items.highlightBloodBags];

		for (const item of document.findAll("#faction-armoury-tabs .armoury-tabs[aria-expanded='true'] .item-list > li")) {
			if (!item.find(".name")) continue;
			item.find(".name").classList.remove("good-blood", "bad-blood");
			if (item.find(".tt-item-price")) item.find(".tt-item-price").remove();

			if (!item.find(".name").innerText.split(" x")[0].includes("Blood Bag : ")) continue; // is not a filled blood bag

			const itemId = parseInt(item.find(".img-wrap").dataset.id);
			if (itemId === 1012) continue; // is an irradiated blood bag

			item.find(".name").classList.add(allowedBlood.includes(itemId) ? "good-blood" : "bad-blood");

			if (page === "factions" && hasAPIData()) {
				item.find(".name").appendChild(
					document.newElement({ type: "span", class: "tt-blood-price", text: `$${formatNumber(torndata.items[itemId].market_value)}` })
				);
			}
		}
	}

	function getCurrentTab() {
		return document.find("#factions > ul.faction-tabs > li[aria-selected='true']").getAttribute("data-case").replace("faction-", "");
	}

	function getCurrentSection() {
		return document.find("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
	}

	async function removeHighlights() {
		for (const highlight of document.findAll(".good-blood, .bad-blood")) {
			highlight.classList.remove("good-blood", "bad-blood");

			const price = highlight.find(".tt-item-price");
			if (price) price.remove();
		}
	}
})();
