"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Item (use parcel) - Loading script. ");

	loadItemParcelOnce();

	console.log("TT: Item (use parcel) - Script loaded.");
})();

function loadItemParcelOnce() {
	ITEM_VALUE_UTILITIES.INVENTORY.addListener();
}
