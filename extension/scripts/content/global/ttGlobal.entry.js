"use strict";

(async () => {
	handleMobile();
	handleTablet();
	handlePopout();
	setupFeatureManager();

	forceUpdate().catch(() => {});

	function handleMobile() {
		checkMobile().then((mobile) => {
			if (mobile) document.body.classList.add("tt-mobile");
			else document.body.classList.remove("tt-mobile");
		});
	}

	function handleTablet() {
		checkTablet().then((tablet) => {
			if (tablet) document.body.classList.add("tt-tablet");
			else document.body.classList.remove("tt-tablet");
		})
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
