(async () => {
	await loadDatabase();
	console.log("TT: Home - Loading script. ");

	storageListeners.settings.push(loadHome);

	loadHome();

	console.log("TT: Home - Script loaded.");
})();

function loadHome() {
	// FIXME - Check travel state.

	requireContent().then(() => {
		displayNetworth();
		displayEffectiveBattleStats();
	});
}

function displayNetworth() {
	if (settings.pages.home.networthDetails) {
	} else {
	}
}

function displayEffectiveBattleStats() {
	if (settings.pages.home.effectiveStats) {
	} else {
	}
}
