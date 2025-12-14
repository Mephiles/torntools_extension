"use strict";

(async () => {
	if (is2FACheckPage()) return;

	const feature = featureManager.adjustFeature("Hide Chat", initialiseListeners, showButton, removeButton);

	async function initialiseListeners() {
		await requireChatsLoaded();

		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED].push(({ settingsPanel }) => {
			if (!feature.enabled()) return;

			showButton(settingsPanel);
		});
	}

	async function showButton(settingsPanel = null) {
		if (!settingsPanel) {
			await requireChatsLoaded();

			settingsPanel = document.find("#chatRoot [class*='settings-panel__'], #settings_panel");
		}

		if (!settingsPanel) return;

		const checkbox = createCheckbox({ description: "Hide chats with TornTools.", class: "tt-hide-chat-option" });
		checkbox.setChecked(settings.pages.chat.hideChat);
		checkbox.onChange(() => {
			const checked = checkbox.isChecked();

			if (checked) hideChats();
			else showChats();

			ttStorage.change({ settings: { pages: { chat: { hideChat: checked } } } });
		});

		if (!settingsPanel.id) {
			settingsPanel.children[1].insertAdjacentElement("afterbegin", checkbox.element);
		} else {
			settingsPanel.find("[class*='content___']").insertAdjacentElement("afterbegin", checkbox.element);
		}
	}

	function hideChats() {
		document.documentElement.classList.add("tt-chat-hidden");
	}

	function showChats() {
		document.documentElement.classList.remove("tt-chat-hidden");
	}

	function removeButton() {
		document.find(".tt-hide-chat-option")?.remove();
	}
})();
