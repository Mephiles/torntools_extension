"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Bazaar - Loading script. ");

	loadBazaarOnce();

	console.log("TT: Bazaar - Script loaded.");
})();

function loadBazaarOnce() {
	const userId = getSearchParameters().get("userId");
	if (!userId || (hasAPIData() && userdata.player_id)) {
		ITEM_VALUE_UTILITIES.INVENTORY.addListener();
	}
}
