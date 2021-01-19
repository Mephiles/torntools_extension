"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Trade - Loading script. ");

	storageListeners.settings.push(loadTrade);
	loadTrade();
	loadTradeOnce();

	console.log("TT: Trade - Script loaded.");
})();

function loadTrade() {
	requireElement(".user.left, .user.right, #inventory-stat-container").then(() => {
		const step = getHashParameters().get("step");

		switch (step) {
			case "add":
				break;
			default:
				console.log("Unknown trade step.", step);
		}
	});
}

function loadTradeOnce() {
	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (page === "trade") {
			loadTrade();
		} else if (page === "inventory") {
			ITEM_VALUE_UTILITIES.INVENTORY.handleInventoryRequest(xhr, json);
		}
	});
}
