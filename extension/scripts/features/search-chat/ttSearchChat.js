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
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			addChatSearch(chat);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			const parent = findParent(message, { class: "^=chat-box_" });
			if (!parent) return;

			const input = parent.find(".tt-chat-filter input");
			if (!input) return;

			const inputValue = input.value;
			if (inputValue) searchChat(message, inputValue);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_ERROR].push(() => {
			if (!feature.enabled()) return;

			const notModifiedInputs = document.findAll("#chatRoot [class*='chat-box-input_']:not(.tt-modified) .tt-chat-filter");
			if (notModifiedInputs.length) notModifiedInputs.forEach((x) => x.parentElement.classList.add("tt-modified"));
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REPORT_OPENED].push(({ input }) => {
			if (!feature.enabled()) return;

			removeChatSearch(input.parentElement);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REPORT_CLOSED].push(({ input }) => {
			if (!feature.enabled()) return;

			addChatSearch(input.parentElement);
		});
	}

	async function showSearch() {
		for (const chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			addChatSearch(chat);
		}
		addPeopleSearch();
	}

	function addChatSearch(chat) {
		if (chat.find(".tt-chat-filter")) return;

		const id = `search_${chat.find("[class*='chat-box-title_']").getAttribute("title")}`;

		const chatInput = chat.find("[class*='chat-box-input_']");
		const hasTradeTimer = chat.classList.contains("^=trade_") && chat.find("#tt-trade-timer");

		const searchElement = document.newElement({
			type: "div",
			class: "tt-chat-filter",
			children: [
				document.newElement({ type: "label", text: "Search:", attributes: { for: id } }),
				document.newElement({
					type: "input",
					id,
					events: {
						input: (event) => {
							const keyword = event.target.value.toLowerCase();

							for (const message of chat.findAll("[class*='overview_'] [class*='message_']")) {
								searchChat(message, keyword);
							}

							if (!keyword) {
								const viewport = chat.find("[class*='viewport_']");
								viewport.scrollTop = viewport.scrollHeight;
							}
						},
					},
				}),
			],
		});

		if (hasTradeTimer) {
			hasTradeTimer.parentElement.appendChild(searchElement);
		} else {
			chatInput.insertBefore(searchElement, chatInput.firstElementChild);
		}
		chatInput.classList.add("tt-modified");
	}

	function addPeopleSearch() {
		const people = document.find("#chatRoot [class*='chat-box-people_'] [class*='chat-box-content_']");
		if (!people || people.find(".tt-chat-filter")) return;

		const id = "search_people";
		people.appendChild(
			document.newElement({
				type: "div",
				class: "tt-chat-filter",
				children: [
					document.newElement({ type: "label", text: "Search:", attributes: { for: id } }),
					document.newElement({
						type: "input",
						id,
						events: {
							input: (event) => {
								const keyword = event.target.value.toLowerCase();

								for (const player of people.findAll("ul[class*='people-list_'] > li")) {
									if (keyword && !player.find(".bold").textContent.toLowerCase().includes(keyword)) {
										player.style.display = "none";
									} else {
										player.style.display = "block";
									}
								}

								if (!keyword) people.find("div[class*='viewport_']").scrollTo(0, 0);
							},
						},
					}),
				],
			})
		);
	}

	function removeChatSearch(chat) {
		for (const message of chat.findAll("[class*='overview_'] [class*='message_']")) {
			message.classList.remove("tt-hidden");
		}
		const viewport = chat.find("[class*='viewport_']");
		viewport.scrollTop = viewport.scrollHeight;

		const searchInput = chat.find(".tt-chat-filter");
		if (searchInput) searchInput.remove();

		const hasTradeTimer = chat.classList.contains("^=trade_") && chat.find("#tt-trade-timer");
		if (!hasTradeTimer) chat.find("[class*='chat-box-input_']").classList.remove("tt-modified");

		chat.findAll(".tt-chat-filter")?.remove();
	}

	function removeSearch() {
		for (const chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			for (const message of chat.findAll("[class*='overview_'] [class*='message_']")) {
				message.classList.remove("tt-hidden");
			}
			const viewport = chat.find("[class*='viewport_']");
			viewport.scrollTop = viewport.scrollHeight;

			const searchInput = chat.find(".tt-chat-filter");
			if (searchInput) searchInput.remove();

			const hasTradeTimer = chat.classList.contains("^=trade_") && chat.find("#tt-trade-timer");
			if (!hasTradeTimer) chat.find("[class*='chat-box-input_']").classList.remove("tt-modified");
		}
		for (const search of document.findAll("#chatRoot .tt-chat-filter")) {
			search.remove();
		}
	}

	function searchChat(message, keyword) {
		if (keyword.startsWith("by:") || keyword.startsWith("u:")) {
			const splitInput = keyword.split(" ");
			const target = splitInput.shift().split(":")[1];
			keyword = splitInput.join(" ");

			const user = message.find("a");
			if (!user.textContent.toLowerCase().includes(target) && (isNaN(target) || !user.href.match(`XID=${target}$`))) {
				message.classList.add("tt-hidden");
				return;
			}
		}

		const messageText = message.find("span").textContent.toLowerCase();
		if (keyword && !messageText.includes(keyword)) {
			message.classList.add("tt-hidden");
		} else {
			message.classList.remove("tt-hidden");
		}
	}
})();
