"use strict";

(async () => {
	if (!isFlying() && !isAbroad()) return;

	await loadDatabase();
	console.log("TT: Flying - Loading script. ");

	loadFlyingOnce();

	console.log("TT: Flying - Script loaded.");
})();

function loadFlyingOnce() {
	DRUG_DETAILS.addListener();
}
