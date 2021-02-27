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
					if (addedNode.classList) {
						if (addedNode.classList.contains("^=chat-box_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_NEW, { detail: { chat: addedNode } }));
						} else if (addedNode.classList.contains("^=chat-box-input_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_OPENED, { detail: { chat: mutation.target } }));
						} else if (addedNode.classList.contains("^=message_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_MESSAGE, { detail: { chat: addedNode, message: addedNode } }));
						}
					}
				}
			}
		}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
	});
})();
