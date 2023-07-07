"use strict";

(async () => {
	handleTheme().catch(() => {});
	createOverlay();
	observeChat().catch(console.error);
	observeBody().catch(console.error);

	setInterval(decreaseCountdown, 1000);

	async function handleTheme() {
		await loadDatabase();

		document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
		document.documentElement.style.setProperty(
			"--tt-theme-background",
			settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)",
		);
		storageListeners.settings.push((oldSettings) => {
			if (!oldSettings || !oldSettings.themes || !settings || !settings.themes || oldSettings.themes.containers !== settings.themes.containers) {
				document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
				document.documentElement.style.setProperty(
					"--tt-theme-background",
					settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)",
				);
			}
		});
	}

	function createOverlay() {
		document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay tt-hidden" }));
	}

	async function observeChat() {
		await requireChatsLoaded();

		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const addedNode of mutation.addedNodes) {
					if (addedNode.classList) {
						if (addedNode.classList.contains("^=_chat-box_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_NEW, { chat: addedNode });
						} else if (addedNode.classList.contains("^=_chat-box-input_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: mutation.target });
						} else if (addedNode.classList.contains("^=_message_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: addedNode });
						} else if (addedNode.classList.contains("^=_error_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_ERROR, { message: addedNode });
						} else if (addedNode.classList.contains("^=_chat-confirm_")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_REPORT_OPENED, { input: mutation.target });
						}
					}
				}
				for (const removedNode of mutation.removedNodes) {
					if (removedNode.classList?.contains("^=_error_")) {
						triggerCustomListener(EVENT_CHANNELS.CHAT_ERROR, { message: removedNode });
						break;
					} else if (removedNode.classList?.contains("^=_chat-confirm_")) {
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
		const now = Date.now();

		countdownTimers.forEach((countdown, index) => {
			// Rewritten so the timers don't desync when the tab is inactive
			// old method left in as a fallback for timers that haven't yet been updated
			let seconds;

			if (countdown.dataset.end) {
				seconds = parseInt((parseInt(countdown.dataset.end) - now) / 1000);
			} else {
				seconds = parseInt(countdown.dataset.seconds) - 1;
			}

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
