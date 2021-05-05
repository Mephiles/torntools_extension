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

			const keyword = input.value;
			if (keyword) searchChat(message, keyword);
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
		chatInput.insertBefore(
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
			}),
			chatInput.firstElementChild
		);
		chatInput.classList.add("tt-modified");
	}

	function addPeopleSearch() {
		const people = document.find("#chatRoot [class*='chat-box-people_'] [class*='chat-box-content_']");
		if (!people || people.find(".tt-chat-filter")) return;

		people.appendChild(
			document.newElement({
				type: "div",
				class: "tt-chat-filter",
				children: [
					document.newElement({ type: "div", text: "Search:" }),
					document.newElement({
						type: "input",
						events: {
							keyup(event) {
								const keyword = event.target.value.toLowerCase();

								for (const player of people.findAll("ul[class*='people-list_'] > li")) {
									if (keyword && !player.find(".bold").innerText.toLowerCase().includes(keyword)) {
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

	function removeSearch() {
		for (const chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			for (const message of document.findAll("[class*='overview_'] [class*='message_']")) {
				message.classList.remove("hidden");
			}
			const viewport = chat.find("[class*='viewport_']");
			viewport.scrollTop = viewport.scrollHeight;

			const searchInput = chat.find(".tt-chat-filter");
			if (searchInput) searchInput.remove();
			chat.find("[class*='chat-box-input_']").classList.remove("tt-modified");
		}
		for (const search of document.findAll("#chatRoot .tt-chat-filter")) {
			search.remove();
		}
	}

	function searchChat(message, keyword) {
		if (keyword && !message.find("span").innerText.toLowerCase().includes(keyword)) {
			message.classList.add("hidden");
		} else {
			message.classList.remove("hidden");
		}
	}
})();
