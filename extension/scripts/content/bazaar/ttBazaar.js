"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Bazaar - Loading script. ");

	loadBazaarOnce();

	console.log("TT: Bazaar - Script loaded.");
})();

function loadBazaarOnce() {
	if (isOwnBazaar()) {
		ITEM_VALUE_UTILITIES.INVENTORY.addListener();
	}
	DRUG_DETAILS.addMutationObserver("[class*='itemsContainner_'], [class*='core-layout_'] [class*='items_']");
}

function isOwnBazaar() {
	const userId = getSearchParameters().get("userId");
	return !userId || (hasAPIData() && userdata.player_id);
}
