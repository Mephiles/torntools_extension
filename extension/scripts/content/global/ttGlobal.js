"use strict";

(async () => {
	storageListeners.settings.push((oldSettings) => {
		if (oldSettings.themes.containers !== settings.themes.containers) {
			for (const container of document.findAll(`.${THEMES[oldSettings.themes.containers].containerClass}`)) {
				container.classList.remove(THEMES[oldSettings.themes.containers].containerClass);
				container.classList.add(THEMES[settings.themes.containers].containerClass);
			}
		}
	});

	document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay hidden" }));

	requireChatsLoaded().then(() => {
		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const addedNode of mutation.addedNodes) {
					if (addedNode.classList) {
						if (addedNode.classList.contains("^=chat-box_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_NEW, { detail: { chat: addedNode } }));
						} else if (addedNode.classList.contains("^=chat-box-input_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_OPENED, { detail: { chat: mutation.target } }));
						} else if (addedNode.classList.contains("^=message_")) {
							window.dispatchEvent(new CustomEvent(EVENT_CHANNELS.CHAT_MESSAGE, { detail: { message: addedNode } }));
						}
					}
				}
			}
		}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
	});

	setInterval(() => {
		for (const countdown of document.findAll(".countdown.automatic[data-seconds]")) {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.removeAttribute("seconds-down");
				countdown.innerText = "Ready";
				continue;
			}

			countdown.innerText = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			// noinspection JSValidateTypes
			countdown.dataset.seconds = seconds;
		}
	}, 1000);
})();
