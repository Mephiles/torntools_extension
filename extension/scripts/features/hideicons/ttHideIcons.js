"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Icons",
		"global",
		() => settings.hideIcons.length,
		initialiseHideIcons,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.hideIcons"],
		},
		null
	);

	async function initialiseHideIcons() {
		await requireSidebar();

		const selector = "#sidebarroot ul[class*='status-icons_']";
		if (document.find(selector)) {
			new MutationObserver((mutations, observer) => {
				observer.disconnect();
				moveIcons();
				observer.observe(document.find(selector), { childList: true, attributes: true });
			}).observe(document.find(selector), { childList: true, attributes: true });
		}
	}

	function applyStyle() {
		for (let icon of ALL_ICONS) {
			document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
		}
		moveIcons();
	}

	function moveIcons() {
		for (let icon of document.findAll("#sidebarroot ul[class*='status-icons_'] > li")) {
			if (!settings.hideIcons.includes(icon.getAttribute("class").split("_")[0])) continue;

			icon.parentElement.appendChild(icon);
		}
	}
})();
