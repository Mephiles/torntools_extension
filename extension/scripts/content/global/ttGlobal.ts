(async () => {
	handleTheme().catch(() => {});
	createOverlay();
	observeChat().catch(console.error);
	observeBody().catch(console.error);

	setInterval(decreaseCountdown, 1000);
	handleFocus();

	async function handleTheme() {
		await loadDatabase();

		document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
		document.documentElement.style.setProperty(
			"--tt-theme-background",
			settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)"
		);
		storageListeners.settings.push((oldSettings) => {
			if (!oldSettings || !oldSettings.themes || !settings || !settings.themes || oldSettings.themes.containers !== settings.themes.containers) {
				document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
				document.documentElement.style.setProperty(
					"--tt-theme-background",
					settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)"
				);
			}
		});
	}

	function createOverlay() {
		document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay tt-hidden" }));
	}

	async function observeChat() {
		await requireChatsLoaded();

		if (isChatV3()) {
			const chatRefreshObserver = new MutationObserver((mutations) => {
				triggerCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, { chat: mutations[0].target as Element });
			});
			new MutationObserver((mutations) => {
				if (mutations.every((mutation) => mutation.removedNodes.length === 0)) return;

				triggerCustomListener(EVENT_CHANNELS.CHAT_CLOSED);
			}).observe(document.find("#chatRoot > [class*='root___'] > [class*='root___']:first-child"), {
				childList: true,
			});
			new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					Array.from(mutation.addedNodes)
						.filter(isElement)
						.forEach((node) => {
							if (node.tagName === "svg" || !isHTMLElement(node)) return;

							if (node.className?.includes("item___")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });
								chatRefreshObserver.observe(node.find(`${SELECTOR_CHAT_V3__BOX_SCROLLER} > div`), { childList: true });
							} else if (node.id === "settings_panel") {
								const panel = (mutation.target as Element).find(":scope > [class*='root___']");

								triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: panel });
							} else if (node.id === "people_panel") {
								const panel = (mutation.target as Element).find(":scope > [class*='root___']");

								triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: panel });
							} else if (
								isElement(mutation.target) &&
								mutation.target.className === "" &&
								node.querySelector(SELECTOR_CHAT_V3__MESSAGE_CONTENT)
							) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node.querySelector(SELECTOR_CHAT_V3__MESSAGE) });
							}
						});
				}
			}).observe(document.find(SELECTOR_CHAT_ROOT), { childList: true, subtree: true });
			new MutationObserver(() => {
				triggerCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED);
			}).observe(document.find(SELECTOR_CHAT_ROOT), { childList: true });

			for (const chat of document.findAll(`${SELECTOR_CHAT_ROOT} ${SELECTOR_CHAT_V3__BOX}`)) {
				const chatPanel = chat.find(`:scope > ${SELECTOR_CHAT_V3__VARIOUS_ROOT}`);
				if (!chatPanel) continue; // No content in the panel.

				if (chatPanel.id === "people_panel") {
					triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: chat });
				} else if (chatPanel.id === "settings_panel") {
					triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: chat });
				} else if (!chatPanel.id) {
					// Special panels have an id, normal chats don't.
					triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: chat });
				}
			}
		} else {
			const chatRefreshObserver = new MutationObserver(() => {
				triggerCustomListener(EVENT_CHANNELS.CHAT_REFRESHED);
			});
			new MutationObserver(() => {
				triggerCustomListener(EVENT_CHANNELS.CHAT_CLOSED);
			}).observe(document.find("#chatRoot [class*='group-minimized-chat-box__']"), { childList: true });
			new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					Array.from(mutation.addedNodes)
						.filter(isElement)
						.forEach((node) => {
							if (node.tagName === "svg" || !isHTMLElement(node)) return;

							if (node.className?.includes("group-chat-box__")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });

								chatRefreshObserver.observe(node.find(SELECTOR_CHAT_V2__CHAT_BOX_BODY), { childList: true });
							} else if (!node.className && node.parentElement?.className.includes("chat-box-body__")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node });
							} else if (node.className?.includes("chat-app__panel__")) {
								if (node.children[0].className.includes("settings-panel__"))
									triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: node.children[0] as HTMLElement });
								else triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: node });
							}
						});

					const openedChats = document.findAll("#chatRoot [class*='group-chat-box__chat-box-wrapper__']");
					if (openedChats.length) chatRefreshObserver.observe(openedChats[0].find(SELECTOR_CHAT_V2__CHAT_BOX_BODY), { childList: true });
					else chatRefreshObserver.disconnect();
				}
			}).observe(document.find(SELECTOR_CHAT_ROOT), { childList: true, subtree: true });
		}
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
			let seconds: number;

			if (countdown.dataset.end) {
				seconds = parseInt(((parseInt(countdown.dataset.end) - now) / 1000).toString());
			} else {
				seconds = parseInt(countdown.dataset.seconds ?? "0") - 1;
			}

			if (seconds <= 0) {
				countdown.textContent = countdown.dataset.doneText || "Ready";
				delete countdown.dataset.seconds;
				countdownTimers.splice(index, 1);
			} else {
				countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
				countdown.dataset.seconds = seconds.toString();
			}
		});
		countTimers.forEach((countdown) => {
			const seconds = parseInt(countdown.dataset.seconds);

			countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
		});
	}

	function handleFocus() {
		let focusTimeout: number | null = null;

		window.addEventListener("focus", () => {
			if (focusTimeout) return;

			focusTimeout = setTimeout(() => {
				focusTimeout = null;

				triggerCustomListener(EVENT_CHANNELS.WINDOW__FOCUS);
			}, 50);
		});
	}
})();
