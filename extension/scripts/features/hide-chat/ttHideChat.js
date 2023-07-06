"use strict";

(async () => {
	if (is2FACheckPage()) return;

	const feature = featureManager.adjustFeature("Hide Chat", initialiseListeners, showButton, removeButton);

	async function initialiseListeners() {
		await requireChatsLoaded();

		new MutationObserver((mutations) => {
			if (!feature.enabled()) return;
			if (![...mutations].some((mutation) => mutation.addedNodes.length)) return;

			showButton();
		}).observe(document.find("#chatRoot [class*='_chat-box-settings_'] [class*='_overview_']"), { childList: true });
	}

	async function showButton() {
		await requireChatsLoaded();

		const settingsBox = document.find("#chatRoot [class*='_chat-box-settings_']");
		if (!settingsBox.classList.contains("^=_chat-active_")) return;

		const overview = settingsBox.find("[class*='overview_']");
		if (overview.find(".tt-hide-chat-option")) return;

		const checkbox = createCheckbox({ description: "Hide chats with TornTools.", class: "tt-hide-chat-option" });
		checkbox.setChecked(settings.pages.chat.hideChat);
		checkbox.onChange(() => {
			const checked = checkbox.isChecked();

			if (checked) hideChats();
			else showChats();

			ttStorage.change({ settings: { pages: { chat: { hideChat: checked } } } });
		});

		overview.appendChild(checkbox.element);

		new MutationObserver((mutations) => {
			if ([...mutations].every((m) => m.addedNodes.length === 0 || [...m.addedNodes].includes(checkbox.element))) {
				return;
			}

			overview.appendChild(checkbox.element);
		}).observe(overview, { childList: true });
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
