(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);

	loadGlobal();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobal() {
	// TODO - Show update notice.
	// TODO - Display custom developer console.
	// TODO - Add search to chats.
	// TODO - Block Zalgo in chats.
	// TODO - Show Nuke Central Hospital revive request.
	// TODO - Show last action in the mini profiles.
}
