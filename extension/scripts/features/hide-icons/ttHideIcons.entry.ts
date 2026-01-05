(async () => {
	await requireFeatureManager();

	featureManager.registerFeature(
		"Hide Icons",
		"sidebar",
		() => settings.hideIcons.length > 0,
		initialiseHideIcons,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.hideIcons"],
		},
		async () => {
			await requireSidebar();
			return true;
		}
	);

	function initialiseHideIcons() {
		const selector = "#sidebarroot ul[class*='status-icons_']";
		if (document.find(selector)) {
			new MutationObserver((_mutations, observer) => {
				observer.disconnect();
				moveIcons();
				observer.observe(document.find(selector), { childList: true, attributes: true });
			}).observe(document.find(selector), { childList: true, attributes: true });
		}
	}

	function applyStyle() {
		for (const { icon } of ALL_ICONS) {
			document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, settings.hideIcons.includes(icon) ? "none" : "initial");
		}
		moveIcons();
	}

	function moveIcons() {
		for (const icon of document.findAll("#sidebarroot ul[class*='status-icons_'] > li")) {
			if (!settings.hideIcons.includes(icon.getAttribute("class").split("_")[0])) continue;

			icon.parentElement.appendChild(icon);
		}
	}
})();
