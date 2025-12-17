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
				triggerCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, { chat: mutations[0].target });
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
							if (node.tagName === "svg") return;

							if (node.className?.includes("item___")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });
								chatRefreshObserver.observe(node.find("[class*='scrollContainer___'] > [class*='list___']"), { childList: true });
							} else if (node.id === "settings_panel") {
								const panel = (mutation.target as Element).querySelector(":scope > [class*='root___']");

								triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: panel });
							} else if (node.id === "people_panel") {
								const panel = (mutation.target as Element).querySelector(":scope > [class*='root___']");

								triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: panel });
							} else if (
								(mutation.target as Element).className.includes("list___") &&
								node.className?.includes("root___") &&
								!node.className?.includes("messageGroupTimestamp___")
							) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node });
							}
						});
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
			new MutationObserver(() => {
				triggerCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED);
			}).observe(document.find("#chatRoot"), { childList: true });

			for (const chat of document.findAll("#chatRoot > [class*='root___'] > [class*='root___'] > [class*='item___']")) {
				const chatPanel = chat.find(":scope > [class*='root___']");
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
							if (node.tagName === "svg") return;

							if (node.className?.includes("group-chat-box__")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });

								chatRefreshObserver.observe(node.find("[class*='chat-box-body__']"), { childList: true });
							} else if (!node.className && node.parentElement?.className.includes("chat-box-body__")) {
								triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node });
							} else if (node.className?.includes("chat-app__panel__")) {
								if (node.children[0].className.includes("sett`ings-panel__"))
									triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: node.children[0] });
								else triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: node });
							}
						});

					const openedChats = document.findAll("#chatRoot [class*='group-chat-box__chat-box-wrapper__']");
					if (openedChats.length) chatRefreshObserver.observe(openedChats[0].find("[class*='chat-box-body__']"), { childList: true });
					else chatRefreshObserver.disconnect();
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
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
})();
