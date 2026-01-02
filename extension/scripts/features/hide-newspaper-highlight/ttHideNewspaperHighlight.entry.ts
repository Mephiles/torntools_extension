(async () => {
	featureManager.registerFeature(
		"Hide Newspaper Highlight",
		"chat",
		() => settings.pages.sidebar.hideNewspaperHighlight,
		null,
		hideChats,
		showChats,
		{
			storage: ["settings.pages.sidebar.hideNewspaperHighlight"],
		},
		null
	);

	function hideChats() {
		document.documentElement.classList.add("tt-hide-newspaper-highlight");
	}

	function showChats() {
		document.documentElement.classList.remove("tt-hide-newspaper-highlight");
	}
})();
