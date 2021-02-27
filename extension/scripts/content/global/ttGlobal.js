"use strict";

(async () => {
	storageListeners.settings.push((oldSettings) => {
		if (oldSettings.themes.containers !== settings.themes.containers) {
			for (let container of document.findAll(`.${THEMES[oldSettings.themes.containers].containerClass}`)) {
				container.classList.remove(THEMES[oldSettings.themes.containers].containerClass);
				container.classList.add(THEMES[settings.themes.containers].containerClass);
			}
		}
	});

	requireChatsLoaded().then(() => {
		new MutationObserver((mutations) => {
			for (let mutation of mutations) {
				for (let addedNode of mutation.addedNodes) {
					if (addedNode.classList && addedNode.classList.contains("^=chat-box_")) {
						window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_NEW, { chat: addedNode }));
					}
				}
			}
		}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
	});
})();
