"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Item Market - Loading script. ");

	loadItemMarketOnce();

	console.log("TT: Item Market - Script loaded.");
})();

function loadItemMarketOnce() {
	// FIXME - Checking the same item twice won't send out a new request.
	DRUG_DETAILS.addListener();
}
