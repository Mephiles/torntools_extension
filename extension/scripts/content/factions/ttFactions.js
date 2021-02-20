"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Factions - Loading script.");

	storageListeners.settings.push(loadFactions);
	loadFactions();
	loadFactionsOnce();

	console.log("TT: Factions - Script loaded.");
})();

function loadFactions() {
	requireContent().then(() => {
		if (getSearchParameters().get("step") === "your") {
			switch (getSubpage()) {
				case "armoury":
					loadArmory();
					break;
				default:
					break;
			}
		}
	});

	function getSubpage() {
		const hash = window.location.hash.replace("#/", "");
		return !hash || hash.includes("war/") ? "main" : getHashParameters().get("tab") || "";
	}
}

function loadFactionsOnce() {
	if (getSearchParameters().get("step") === "your") {
		requireElement(".faction-tabs").then(() => {
			document.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);
		});
	}
}

function loadArmory() {
	requireElement("#faction-armoury-tabs > ul.tabs > li[aria-selected='true']").then(() => {
		loadArmorySection();
		new MutationObserver((mutations) => {
			if (
				!mutations
					.filter((mut) => mut.type === "childList" && mut.addedNodes.length)
					.flatMap((mut) => Array.from(mut.addedNodes))
					.some((node) => node.classList && node.classList.contains("item-list"))
			)
				return;

			loadArmorySection();
		}).observe(document.find(`#faction-armoury-tabs`), { childList: true, subtree: true });
	});

	function getCurrentSection() {
		return document.find("#faction-armoury-tabs > ul.tabs > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
	}

	function loadArmorySection() {
		switch (getCurrentSection()) {
			case "medical":
				highlightBloodBags().catch((error) => console.error("Couldn't highlight the correct blood bags.", error));
				break;
		}
	}
}

async function highlightBloodBags() {
	// noinspection JSIncompatibleTypesComparison
	if (settings.pages.items.highlightBloodBags !== "none") {
		const allowedBlood = ALLOWED_BLOOD[settings.pages.items.highlightBloodBags];

		for (let item of document.findAll("#faction-armoury-tabs .armoury-tabs[aria-expanded='true'] .item-list > li")) {
			if (!item.find(".name")) continue;
			item.find(".name").classList.remove("good-blood", "bad-blood");
			if (item.find(".tt-item-price")) item.find(".tt-item-price").remove();

			if (!item.find(".name").innerText.split(" x")[0].includes("Blood Bag : ")) continue; // is not a filled blood bag

			const itemId = parseInt(item.find(".img-wrap").dataset.id);
			if (itemId === 1012) continue; // is an irradiated blood bag

			item.find(".name").classList.add(allowedBlood.includes(itemId) ? "good-blood" : "bad-blood");

			if (hasAPIData()) {
				item.find(".name").appendChild(
					document.newElement({ type: "span", class: "tt-blood-price", text: `$${formatNumber(torndata.items[itemId].market_value)}` })
				);
			}
		}
	} else {
		for (let bb of document.findAll(".good-blood, .bad-blood")) {
			bb.classList.remove("good-blood", "bad-blood");
			bb.find(".tt-item-price").remove();
		}
	}
}
