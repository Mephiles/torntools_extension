(async () => {
	await loadDatabase();
	console.log("TT: Global Entry - Loading script. ");

	storageListeners.settings.push(loadGlobalEntry);

	await loadGlobalEntry();

	console.log("TT: Global Entry - Script loaded.");
})();

async function loadGlobalEntry() {
	if (settings.pages.global.alignLeft) document.documentElement.classList.add("tt-align-left");
	else document.documentElement.classList.remove("tt-align-left");

	// TODO - Hide level upgrade button

	document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");

	// hide icons

	// hide areas

	// hide chats

	// clean flight

	document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);

	if (settings.pages.chat.blockZalgo) document.documentElement.classList.add("no-zalgo");
	else document.documentElement.classList.remove("no-zalgo");

	// mobile check
	await checkMobile();
	if (mobile) document.documentElement.classList.add("tt-mobile");
	else document.documentElement.classList.remove("tt-mobile");
}
