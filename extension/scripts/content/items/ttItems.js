"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Items - Loading script. ");

	storageListeners.settings.push(loadItems);
	loadItems();

	console.log("TT: Items - Script loaded.");
})();

function loadItems() {
	requireContent().then(async () => {
		loadQuickItems().catch((error) => console.error("Couldn't load the quick items.", error));
		showItemValues().catch((error) => console.error("Couldn't show the item values.", error));
		showDrugDetails().catch((error) => console.error("Couldn't show drug details.", error));
		showItemMarketIcons().catch((error) => console.error("Couldn't show the market icons.", error));
		highlightBloodBags().catch((error) => console.error("Couldn't highlight the correct blood bags.", error));
	});
}

async function loadQuickItems() {
	if (settings.pages.items.quickItems) {
		const { content } = createContainer("Quick Items", { nextElement: document.find(".equipped-items-wrap"), spacer: true });
	} else {
		removeContainer("Quick Items");
	}
}

async function showItemValues() {
	if (settings.pages.items.values && hasAPIData()) {
	} else {
	}
}

async function showDrugDetails() {
	if (settings.pages.items.drugDetails) {
	} else {
	}
}

async function showItemMarketIcons() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
	} else {
	}
}

async function highlightBloodBags() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
	} else {
	}
}
