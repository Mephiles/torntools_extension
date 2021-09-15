"use strict";

(async () => {
	handleTheme();
	createOverlay();
	detectScroll();
	observeChat().catch(console.error);
	observeBody().catch(console.error);

	setInterval(decreaseCountdown, 1000);

	function handleTheme() {
		storageListeners.settings.push((oldSettings) => {
			if (!oldSettings || !oldSettings.themes || !settings || !settings.themes || oldSettings.themes.containers !== settings.themes.containers) {
				for (const container of document.findAll(`.${THEMES[oldSettings.themes.containers].containerClass}`)) {
					if (oldSettings && !oldSettings.themes) container.classList.remove(THEMES[oldSettings.themes.containers].containerClass);
					if (settings && !settings.themes) container.classList.add(THEMES[settings.themes.containers].containerClass);
				}
			}
		});
	}

	function createOverlay() {
		document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay hidden" }));
	}

	function detectScroll() {
		checkScroll();
		document.addEventListener("scroll", checkScroll);

		function checkScroll() {
			if (window.scrollY >= 75) document.body.classList.add("scrolled");
			else document.body.classList.remove("scrolled");
		}
	}

	async function observeChat() {
		await requireChatsLoaded();

		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const addedNode of mutation.addedNodes) {
					if (addedNode.classList) {
						if (addedNode.classList.contains("^=chat-box_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_NEW, { chat: addedNode });
						} else if (addedNode.classList.contains("^=chat-box-input_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: mutation.target });
						} else if (addedNode.classList.contains("^=message_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: addedNode });
						} else if (addedNode.classList.contains("^=error_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_ERROR, { message: addedNode });
						} else if (addedNode.classList.contains("^=chat-confirm_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_REPORT_OPENED, { input: mutation.target });
						}
					}
				}
				for (const removedNode of mutation.removedNodes) {
					if (removedNode.classList && removedNode.classList.contains("^=error_")) {
						triggerCustomListener(EVENT_CHANNELS.CHAT_ERROR, { message: removedNode });
						break;
					} else if (removedNode.classList.contains("^=chat-confirm_")) {
						triggerCustomListener(EVENT_CHANNELS.CHAT_REPORT_CLOSED, { input: mutation.target });
					}
				}
			}
		}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
	}

	async function observeBody() {
		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				switch (mutation.attributeName) {
					case "data-layout":
						triggerCustomListener(EVENT_CHANNELS.STATE_CHANGED, { oldState: mutation.oldValue, newState: document.body.dataset.layout });
						break;
				}
			}
		}).observe(document.body, { attributes: true, attributeFilter: ["data-layout"], attributeOldValue: true });
	}

	function decreaseCountdown() {
		countdownTimers.forEach((countdown, index) => {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.textContent = countdown.dataset.doneText || "Ready";
				delete countdown.dataset.seconds;
				countdownTimers.splice(index, 1);
			} else {
				countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
				countdown.dataset.seconds = seconds;
			}
		});
		countTimers.forEach((countdown) => {
			const seconds = parseInt(countdown.dataset.seconds);

			countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
		});
	}
})();
