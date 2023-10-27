"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Search Chat",
		"chat",
		() => settings.pages.chat.searchChat,
		initialiseSearchChat,
		showSearch,
		removeSearch,
		{
			storage: ["settings.pages.chat.searchChat"],
		},
		null
	);

	function initialiseSearchChat() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_NEW].push(({ chat }) => {
			if (!feature.enabled()) return;

			addChatSearch(chat);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			addChatSearch(chat);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			const parent = message.find("[class*='chat-box__']");
			if (!parent) return;

			const input = parent.find(".tt-chat-filter input");
			if (!input) return;

			const inputValue = input.value;
			if (inputValue)
				searchChat(message.find("[class*='chat-box-body__message-box__']"), inputValue);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push(() => {
			if (!feature.enabled()) return;

			// Re-filter all chats after they refresh.
			document.findAll("[class*='group-chat-box__chat-box-wrapper__']").forEach((chat) => {
				const input = chat.find(".tt-chat-filter input");
				if (!input) return;

				const inputValue = input.value;
				if (inputValue)
					onChatSearch({ target: input }, chat);
			});
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED].push(({ peopleMenu }) => {
			addPeopleSearch(peopleMenu);
		});
	}

	async function showSearch() {
		await requireChatsLoaded();
		for (const chat of document.findAll("#chatRoot [class*='group-chat-box__'] [class*='group-chat-box__chat-box-wrapper__']")) {
			addChatSearch(chat);
		}
		addPeopleSearch();
	}

	function addChatSearch(chat) {
		if (chat.find(".tt-chat-filter")) return;

		const chatFooter = chat.find("[class*='chat-box-footer__']");
		// const hasTradeTimer = chat.classList.contains("^=_trade_") && chat.find("#tt-trade-timer");

		const searchElement = document.newElement({
			type: "div",
			class: "tt-chat-filter",
			children: [
				document.newElement({
					type: "label",
					text: "Search:",
					children: [
						document.newElement({
							type: "input",
							events: { input: (event) => onChatSearch(event, chat) },
						}),
					]
				}),
			],
		});

		// if (hasTradeTimer) {
			// hasTradeTimer.parentElement.appendChild(searchElement);
		// } else {
			chatFooter.insertAdjacentElement("beforebegin", searchElement);
		// }
	}

	function addPeopleSearch(peopleMenu = null) {
		if (!peopleMenu)
			peopleMenu = document.find("#chatRoot [class*='chat-app__panel__']");

		if (!peopleMenu || peopleMenu.find(".tt-chat-filter")) return;

		peopleMenu.find("[class*='chat-list-header__tabs__']")?.insertAdjacentElement(
			"beforebegin",
			document.newElement({
				type: "div",
				class: "tt-chat-filter",
				children: [
					document.newElement({
						type: "label",
						text: "Search:",
						children: [
							document.newElement({
								type: "input",
								events: {
									input: (event) => {
										const keyword = event.target.value.toLowerCase();
										const isUserID = !isNaN(keyword);

										if (peopleMenu.find("[class*='chat-list-header__tabs__'] [class*='chat-list-header__tab--active__']:first-child")) {
											// "Chats" tab opened.
											const list = peopleMenu.findAll("#scrollableDiv .infinite-scroll-component > button [class*='detailed-chat-card__header__'] a");
											list.forEach((chatEntry) => {
												const shouldHide = keyword &&
																	((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
																	(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
												if (shouldHide)
													chatEntry.closest("button").classList.add("tt-hidden");
												else
													chatEntry.closest("button").classList.remove("tt-hidden");
											});
										} else {
											// Other tabs opened.
											const list = peopleMenu.findAll("#scrollableDiv > [class*='member-card__'] a");
											list.forEach((chatEntry) => {
												const shouldHide = keyword &&
																	((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
																	(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
												if (shouldHide)
													chatEntry.closest("[class*='member-card__']").classList.add("tt-hidden");
												else
													chatEntry.closest("[class*='member-card__']").classList.remove("tt-hidden");
											});
										}
									},
								},
							}),
						]
					})
				],
			})
		);
	}

	function onChatSearch(event, chat) {
		const keyword = event.target.value.toLowerCase();

		for (const message of chat.findAll("[class*='chat-box-body__'] [class*='chat-box-body__message-box__']")) {
			searchChat(message, keyword);
		}

		if (!keyword) {
			const chatBody = chat.find("[class*='chat-box-body__']");
			chatBody.scrollTop = chatBody.scrollHeight;
		}
	}

	function removeSearch() {
		for (const chat of document.findAll("#chatRoot [class*='group-chat-box__'] [class*='group-chat-box__chat-box-wrapper__']")) {
			for (const message of chat.findAll("[class*='chat-box-body__'] [class*='chat-box-body__message-box__'] div[class='tt-hidden']")) {
				message.classList.remove("tt-hidden");
			}
			const chatBody = chat.find("[class*='chat-box-body__']");
			chatBody.scrollTop = chatBody.scrollHeight;

			chat.find(".tt-chat-filter").remove();

			// const hasTradeTimer = chat.classList.contains("^=_trade_") && chat.find("#tt-trade-timer");
			// if (!hasTradeTimer) chat.find("[class*='_chat-box-input_']").classList.remove("tt-modified");
		}
		document.findAll("#chatRoot .tt-chat-filter").forEach(x => x.remove());
	}

	function searchChat(message, keyword) {
		if (keyword.startsWith("by:") || keyword.startsWith("u:")) {
			const splitInput = keyword.split(" ");
			const target = splitInput.shift().split(":")[1];
			keyword = splitInput.join(" ");

			const sender = message.find("[class*='chat-box-body__sender-button__'] a");
			if (!sender.textContent.toLowerCase().includes(target) && (isNaN(target) || !sender.href.match(`XID=${target}$`))) {
				message.closest("div:not([class]), div.tt-hidden").setAttribute("class", "tt-hidden");
				return;
			}
		}

		const messageText = message.lastElementChild.textContent.toLowerCase();
		if (keyword && !messageText.includes(keyword)) {
			message.closest("div:not([class]), div.tt-hidden").setAttribute("class", "tt-hidden");
		} else {
			message.closest("div:not([class]), div.tt-hidden").removeAttribute("class");
		}
	}
})();
