"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Leave Buttons",
		"global",
		() => settings.pages.global.hideQuitButtons,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.global.hideQuitButtons"],
		},
		null
	);

	function applyStyle() {
		document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hideQuitButtons ? "none" : "flex");
	}
})();
