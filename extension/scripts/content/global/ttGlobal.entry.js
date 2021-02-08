"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Global Entry - Loading script. ");

	registerGlobalEntry();
	loadGlobalEntryFeatures();

	storageListeners.settings.push(() => {
		loadGlobalEntryFeatures();
		featureManager.display();

		loadGlobalEntry();
	});
	storageListeners.userdata.push(() => {
		loadGlobalEntryFeatures();

		loadGlobalEntry();
	});

	await loadGlobalEntry();

	console.log("TT: Global Entry - Script loaded.");

	requireContent().then(() => {
		console.log("DKK xxx");
		featureManager.createPopup();
	});
})();

function registerGlobalEntry() {
	featureManager.new({
		name: "Align Left",
		scope: "global",
		enabled: settings.pages.global.alignLeft,
		func: async () => {
			if (settings.pages.global.alignLeft) document.documentElement.classList.add("tt-align-left");
			else document.documentElement.classList.remove("tt-align-left");
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Hide Level Upgrade",
		scope: "global",
		enabled: settings.pages.global.hideLevelUpgrade,
		func: async () => {
			document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hideLevelUpgrade ? "none" : "block");
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Hide Leave Buttons",
		scope: "global",
		enabled: settings.pages.global.hideQuitButtons,
		func: async () => {
			document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Hide Icons",
		scope: "global",
		enabled: settings.hideIcons.length,
		func: async () => {
			for (let icon of ALL_ICONS) {
				document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
			}
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Hide Areas",
		scope: "global",
		enabled: settings.hideAreas.length,
		func: async () => {
			for (let area of ALL_AREAS.map((area) => area.class)) {
				document.documentElement.style.setProperty(`--torntools-hide-area-${area}`, settings.hideAreas.includes(area) ? "none" : "initial");
			}
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Chat Font Size",
		scope: "global",
		enabled: settings.pages.chat.fontSize !== 12,
		func: async () => {
			document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Highlight Energy Refill",
		scope: "global",
		enabled: settings.pages.sidebar.highlightEnergy,
		func: async () => {
			if (!hasAPIData()) throw "No api data!";

			document.documentElement.style.setProperty(
				"--torntools-highlight-energy",
				!userdata.refills.energy_refill_used && settings.pages.sidebar.highlightEnergy ? `#6e8820` : "#333"
			);
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Highlight Nerve Refill",
		scope: "global",
		enabled: settings.pages.sidebar.highlightNerve,
		func: async () => {
			if (!hasAPIData()) throw "No api data!";

			document.documentElement.style.setProperty(
				"--torntools-highlight-nerve",
				!userdata.refills.nerve_refill_used && settings.pages.sidebar.highlightNerve ? `#6e8820` : "#333"
			);
		},
		runWhenDisabled: true,
	});
	featureManager.new({
		name: "Block Zalgo",
		scope: "global",
		enabled: settings.pages.sidebar.highlightNerve,
		func: async () => {
			await requireElement("#chatRoot");

			if (settings.pages.chat.blockZalgo) document.find("#chatRoot").classList.add("no-zalgo");
			else document.find("#chatRoot").classList.remove("no-zalgo");
		},
		runWhenDisabled: true,
	});
}

function loadGlobalEntryFeatures() {
	for (const name of [
		"Align Left",
		"Hide Level Upgrade",
		"Hide Leave Buttons",
		"Hide Icons",
		"Hide Areas",
		"Chat Font Size",
		"Highlight Energy Refill",
		"Highlight Nerve Refill",
		"Block Zalgo",
	]) {
		featureManager.load(name);
	}

	// featureManager.load("Hide Chats");
	// featureManager.load("Clean Flight");
}

async function loadGlobalEntry() {
	// mobile check
	checkMobile().then((mobile) => {
		if (mobile) document.documentElement.classList.add("tt-mobile");
		else document.documentElement.classList.remove("tt-mobile");
	});

	if (getSearchParameters().has("popped")) document.documentElement.classList.add("tt-popout");
	else document.documentElement.classList.remove("tt-popout");

	forceUpdate().catch(() => {});
}

async function forceUpdate() {
	await requireContent();

	document.find("#sidebarroot ul[class*='status-icons']").setAttribute("updated", Date.now());
}
