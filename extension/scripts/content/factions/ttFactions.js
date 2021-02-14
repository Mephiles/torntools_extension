"use strict";

let ownFaction = false;

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
			ownFaction = true;

			switch (getSubpage()) {
				case "main":
					loadMain();
					break;
				case "info":
					loadInfo();
					break;
				case "crimes":
					loadCrimes();
					break;
				case "upgrades":
					loadUpgrades();
					break;
				case "armoury":
					loadArmory();
					break;
				case "controls":
					loadControls();
					break;
				default:
					break;
			}
		} else {
			ownFaction = hasAPIData() && userdata.faction ? parseInt(getSearchParameters().get("ID")) === userdata.faction.faction_id : false;

			loadInfo();
		}

		// setupQuickDragListeners().catch((error) => console.error("Couldn't make the items draggable for quick items.", error));
	});

	function getSubpage() {
		const hash = window.location.hash.replace("#/", "");
		return !hash || hash.includes("war/") ? "main" : getHashParameters().get("tab") || "";
	}
}

function loadFactionsOnce() {
	if (getSearchParameters().get("step") === "your") {
		requireElement(".faction-tabs").then(() => {
			document.find(".faction-tabs li[data-case=main]").addEventListener("click", loadMain);
			document.find(".faction-tabs li[data-case=info]").addEventListener("click", loadInfo);
			document.find(".faction-tabs li[data-case=crimes]").addEventListener("click", loadCrimes);
			document.find(".faction-tabs li[data-case=upgrades]").addEventListener("click", loadUpgrades);
			document.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);
			document.find(".faction-tabs li[data-case=controls]").addEventListener("click", loadControls);
		});
	}
}

function loadMain() {}

function loadInfo() {}

function loadCrimes() {}

function loadUpgrades() {}

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

function loadControls() {}

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
