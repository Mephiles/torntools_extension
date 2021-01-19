"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Display Case - Loading script. ");

	loadDisplayCaseOnce();

	console.log("TT: Display Case - Script loaded.");
})();

function loadDisplayCaseOnce() {
	const userId = location.hash.startsWith("#display/") ? parseInt(location.hash.substring(9)) || false : false;
	if (!userId || (hasAPIData() && userdata.player_id)) {
		ITEM_VALUE_UTILITIES.INVENTORY.addListener({ ignoreUntradable: false });
	}
}
