"use strict";

(async () => {
	if (!isFlying() && !isAbroad()) return;

	await loadDatabase();
	console.log("TT: Flying - Loading script. ");

	storageListeners.settings.push(loadFlying);
	loadFlying();

	console.log("TT: Flying - Script loaded.");
})();

function loadFlying() {}
