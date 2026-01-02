(() => {
	featureManager.registerFeature(
		"Market Left Bar",
		"item market",
		() => settings.pages.itemmarket.leftBar,
		null,
		() => document.documentElement.classList.add("tt-item-market-left-bar"),
		() => document.documentElement.classList.remove("tt-item-market-left-bar"),
		{
			storage: ["settings.pages.itemmarket.leftBar"],
		},
		null
	);
})();
