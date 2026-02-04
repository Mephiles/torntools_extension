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
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			addChatSearch(chat);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			const parent = message.closest("[class*='chat-box__'], [class*='item___']");
			if (!parent) return;

			const input = parent.querySelector<HTMLInputElement>(".tt-chat-filter input");
			if (!input) return;

			const inputValue = input.value;
			if (inputValue) searchChat(message.querySelector("[class*='chat-box-message__box__'], [class*='box___']"), inputValue);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push(() => {
			if (!feature.enabled()) return;

			// Re-filter all chats after they refresh.
			findAllElements("[class*='group-chat-box__chat-box-wrapper__'], #chatRoot [class*='item___'][style*='z-index']").forEach((chat) => {
				const input = chat.querySelector<HTMLInputElement>(".tt-chat-filter input");
				if (!input) return;

				const inputValue = input.value;
				if (inputValue) onChatSearch({ target: input }, chat);
			});
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED].push(({ peopleMenu }) => {
			addPeopleSearch(peopleMenu);
		});
	}

	async function showSearch() {
		await requireChatsLoaded();
		for (const chat of findAllElements(
			"#chatRoot [class*='group-chat-box__'] [class*='group-chat-box__chat-box-wrapper__'], #chatRoot [class*='item___'][style*='z-index']:not(:has(#people_panel))"
		)) {
			addChatSearch(chat);
		}
		addPeopleSearch();
	}

	function addChatSearch(chat: Element) {
		if (chat.querySelector(".tt-chat-filter")) return;

		const chatFooter = chat.querySelector("[class*='chat-box-footer__'], [class*='content___'] > [class*='root___']:nth-child(2)");
		if (!chatFooter) return;

		const searchElement = elementBuilder({
			type: "div",
			class: "tt-chat-filter",
			children: [
				elementBuilder({
					type: "label",
					text: "Search:",
					children: [
						elementBuilder({
							type: "input",
							events: { input: (event) => onChatSearch(event, chat) },
						}),
					],
				}),
			],
		});

		const scrollContainer = chat.querySelector("[class*='scrollContainer___']");
		if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;

		chatFooter.insertAdjacentElement("beforebegin", searchElement);
	}

	function addPeopleSearch(peopleMenu: Element | null = null) {
		if (!peopleMenu) peopleMenu = document.querySelector("#chatRoot [class*='chat-app__panel__']");

		if (!peopleMenu || peopleMenu.querySelector(".tt-chat-filter")) return;

		peopleMenu.querySelector("[class*='chat-list-header__tabs__']")?.insertAdjacentElement(
			"beforebegin",
			elementBuilder({
				type: "div",
				class: "tt-chat-filter",
				children: [
					elementBuilder({
						type: "label",
						text: "Search:",
						children: [
							elementBuilder({
								type: "input",
								events: {
									input: (event) => {
										const keyword = (event.target as HTMLInputElement).value.toLowerCase();
										const isUserID = !isNaN(parseInt(keyword));

										if (
											peopleMenu.querySelector(
												"[class*='chat-list-header__tabs__'] [class*='chat-list-header__tab--active__']:first-child"
											)
										) {
											// "Chats" tab opened.
											const list = findAllElements<HTMLAnchorElement>(
												"#scrollableDiv .infinite-scroll-component > button [class*='detailed-chat-card__header__'] a",
												peopleMenu
											);
											list.forEach((chatEntry) => {
												const shouldHide =
													keyword &&
													((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
														(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
												if (shouldHide) chatEntry.closest("button").classList.add("tt-hidden");
												else chatEntry.closest("button").classList.remove("tt-hidden");
											});
										} else {
											// Other tabs opened.
											const list = findAllElements<HTMLAnchorElement>("#scrollableDiv > [class*='member-card__'] a", peopleMenu);
											list.forEach((chatEntry) => {
												const shouldHide =
													keyword &&
													((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
														(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
												if (shouldHide) chatEntry.closest("[class*='member-card__']").classList.add("tt-hidden");
												else chatEntry.closest("[class*='member-card__']").classList.remove("tt-hidden");
											});
										}
									},
								},
							}),
						],
					}),
				],
			})
		);
	}

	function onChatSearch(event: { target: EventTarget }, chat: Element) {
		const keyword = (event.target as HTMLInputElement).value.toLowerCase();

		for (const message of findAllElements("[class*='chat-box-body__'] [class*='chat-box-message__box__'], [class*='list___'] [class*='box___']", chat)) {
			searchChat(message, keyword);
		}

		if (!keyword) {
			const chatBody = chat.querySelector("[class*='chat-box-body__'], [class*='scrollContainer___']");
			chatBody.scrollTop = chatBody.scrollHeight;
		}
	}

	function removeSearch() {
		for (const chat of findAllElements(
			"#chatRoot [class*='group-chat-box__'] [class*='group-chat-box__chat-box-wrapper__'], [class*='list___'] [class*='item___']"
		)) {
			for (const message of findAllElements(
				"[class*='chat-box-body__'] [class*='chat-box-message__box__'] div[class='tt-hidden'], div[class*='root___'][class*='tt-hidden']",
				chat
			)) {
				message.classList.remove("tt-hidden");
			}
			const chatBody = chat.querySelector("[class*='chat-box-body__'], [class*='scrollContainer___']");
			chatBody.scrollTop = chatBody.scrollHeight;

			chat.querySelector(".tt-chat-filter").remove();
		}
		findAllElements("#chatRoot .tt-chat-filter").forEach((x) => x.remove());
	}

	function searchChat(message: Element, keyword: string) {
		if (keyword.startsWith("by:") || keyword.startsWith("u:")) {
			const splitInput = keyword.split(" ");
			const target = splitInput.shift().split(":")[1];
			keyword = splitInput.join(" ");

			const sender = message.querySelector<HTMLAnchorElement>("[class*='chat-box-message__sender__'], [class*='sender___']");
			if (!sender.textContent.toLowerCase().includes(target) && (isNaN(parseInt(target)) || !sender.href.match(`XID=${target}$`))) {
				message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.add("tt-hidden");
				return;
			}
		}

		const messageText = message.querySelector("p, [class*='message___']").textContent.toLowerCase();
		if (keyword && !messageText.includes(keyword)) {
			message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.add("tt-hidden");
		} else {
			message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.remove("tt-hidden");
		}
	}
})();
