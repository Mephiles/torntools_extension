(async () => {
	await loadDatabase();
	console.log("TT: Global Entry - Loading script. ");

	storageListeners.settings.push(loadGlobalEntry);
	storageListeners.userdata.push(loadGlobalEntry);

	await loadGlobalEntry();

	console.log("TT: Global Entry - Script loaded.");
})();

async function loadGlobalEntry() {
	if (settings.pages.global.alignLeft) document.documentElement.classList.add("tt-align-left");
	else document.documentElement.classList.remove("tt-align-left");

	document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");

	document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");

	// hide icons

	// hide areas

	// hide chats

	// clean flight

	document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);

	if (hasAPIData()) {
		// Highlight refills.
		document.documentElement.style.setProperty(
			"--torntools-highlight-energy",
			!userdata.refills.energy_refill_used && settings.pages.sidebar.highlightEnergy ? `#6e8820` : "#333"
		);
		document.documentElement.style.setProperty(
			"--torntools-highlight-nerve",
			!userdata.refills.nerve_refill_used && settings.pages.sidebar.highlightNerve ? `#6e8820` : "#333"
		);
	}

	requireElement("#chatRoot").then((chats) => {
		if (settings.pages.chat.blockZalgo) chats.classList.add("no-zalgo");
		else chats.classList.remove("no-zalgo");
	});

	// mobile check
	checkMobile().then((mobile) => {
		if (mobile) document.documentElement.classList.add("tt-mobile");
		else document.documentElement.classList.remove("tt-mobile");
	});

	if (getSearchParameters().has("popped")) document.documentElement.classList.add("tt-popout");
	else document.documentElement.classList.remove("tt-popout");
}
