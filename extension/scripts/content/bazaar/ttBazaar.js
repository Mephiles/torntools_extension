"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Bazaar - Loading script. ");

	loadBazaarOnce();

	console.log("TT: Bazaar - Script loaded.");
})();

function loadBazaarOnce() {
	if (isOwnBazaar()) {
		featureManager.new({
			name: "Item Values",
			scope: "items",
			enabled: settings.pages.items.values,
			func: async () => {
				ITEM_VALUE_UTILITIES.INVENTORY.addListener({ addRelative: true });
			},
			runWhenDisabled: true,
		});
		featureManager.load("Item Values");
	}
	featureManager.new({
		name: "Drug Details",
		scope: "items",
		enabled: settings.pages.items.drugDetails,
		func: async () => {
			DRUG_DETAILS.addMutationObserver("[class*='itemsContainner_'], [class*='core-layout_'] [class*='items_']");
		},
		runWhenDisabled: true,
	});
	featureManager.load("Drug Details");
}

function isOwnBazaar() {
	const userId = getSearchParameters().get("userId");
	return !userId || (hasAPIData() && userdata.player_id);
}
