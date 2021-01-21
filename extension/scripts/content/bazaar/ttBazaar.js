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
	// FIXME - Checking the same item twice won't send out a new request.
	// Viewing the bazaar	- BROKEN
	// Adding items			- working
	// Managing items		- BROKEN
	DRUG_DETAILS.addListener({ isXHR: isOwnBazaar(), isFetch: true, react: true });
}

function isOwnBazaar() {
	const userId = getSearchParameters().get("userId");
	return !userId || (hasAPIData() && userdata.player_id);
}
