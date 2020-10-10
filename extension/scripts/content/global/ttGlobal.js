(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);

	loadGlobal();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobal() {
	requireChatsLoaded()
		.then(() => {
			// TODO - Add search to chats.
			// TODO - Block Zalgo in chats.
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));
	requireSidebar()
		.then(() => {
			// TODO - Show update notice.
		})
		.catch((reason) => console.error("TT failed during loading sidebar.", reason));
	// TODO - Display custom developer console.
	// TODO - Show Nuke Central Hospital revive request.
	// TODO - Show last action in the mini profiles.
}

function requireChatsLoaded() {
	return requireElement(".overview_1MoPG");
}
