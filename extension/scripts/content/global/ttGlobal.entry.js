"use strict";

(async () => {
	handleMobile();
	handlePopout();
	setupFeatureManager();

	// FIXME - Get to know what this is needed for.
	forceUpdate().catch(() => {});

	function handleMobile() {
		checkMobile().then((mobile) => {
			if (mobile) document.documentElement.classList.add("tt-mobile");
			else document.documentElement.classList.remove("tt-mobile");
		});
	}

	function handlePopout() {
		if (getSearchParameters().has("popped")) document.documentElement.classList.add("tt-popout");
		else document.documentElement.classList.remove("tt-popout");
	}

	function setupFeatureManager() {
		storageListeners.settings.push(() => featureManager.display());
		requireContent().then(() => featureManager.createPopup());
	}
})();

async function forceUpdate() {
	await requireContent();

	document.find("#sidebarroot ul[class*='status-icons']").setAttribute("updated", Date.now());
}
