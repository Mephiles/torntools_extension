"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Chat",
		"chat",
		() => settings.pages.chat.hideChatButton,
		null,
		hideChats,
		showChats,
		{
			storage: ["settings.pages.chat.hideChatButton"],
		},
		null
	);

	function hideChats() {
		document.documentElement.classList.add("tt-chat-hidden");
	}

	function showChats() {
		document.documentElement.classList.remove("tt-chat-hidden");
	}

})();
