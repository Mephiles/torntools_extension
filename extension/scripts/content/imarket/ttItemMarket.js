"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Item Market - Loading script. ");

	loadItemMarketOnce();

	console.log("TT: Item Market - Script loaded.");
})();

function loadItemMarketOnce() {
	DRUG_DETAILS.addListener();
}
