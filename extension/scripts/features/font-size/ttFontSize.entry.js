"use strict";

(async () => {
	featureManager.registerFeature(
		"Chat Font Size",
		"chat",
		() => settings.pages.chat.fontSize !== 12,
		null,
		applySize,
		applySize,
		{
			storage: ["settings.pages.chat.fontSize"],
		},
		null
	);

	function applySize() {
		document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);
	}
})();
