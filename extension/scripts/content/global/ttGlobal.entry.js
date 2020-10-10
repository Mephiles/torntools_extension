(async () => {
	await loadDatabase();
	console.log("TT: Global Entry - Loading script. ");

	storageListeners.settings.push(loadEntry);

	loadEntry();

	console.log("TT: Global Entry - Script loaded.");
})();

function loadEntry() {
	if (settings.pages.global.alignLeft) document.documentElement.classList.add("tt-align-left");
	else document.documentElement.classList.remove("tt-align-left");

	// hide upgrade button

	// hide quit/leave options

	// hide icons

	// hide areas

	// hide chats

	// clean flight

	document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.global.fontSize || 12}px`);

	// mobile check
}
