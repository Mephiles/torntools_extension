"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Search Chat",
		"global",
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
		window.addEventListener(EVENT_CHANNELS.CHAT_OPENED, (event) => {
			if (!feature.enabled()) return;

			addSearch(event.detail.chat);
		});
		window.addEventListener(EVENT_CHANNELS.CHAT_MESSAGE, (event) => {
			if (!feature.enabled()) return;

			const parent = findParent(event.detail.message, { class: "^=chat-box_" });
			if (!parent) return;

			const input = parent.find(".tt-chat-filter input");
			if (!input) return;

			const keyword = input.value;
			if (keyword) searchChat(event.detail.message, keyword);
		});
	}

	async function showSearch() {
		for (const chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			addSearch(chat);
		}
	}

	function addSearch(chat) {
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

	function removeSearch() {
		for (const chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			for (const message of document.findAll("[class*='overview_'] [class*='message_']")) {
				message.classList.remove("hidden");
			}
			const viewport = chat.find("[class*='viewport_']");
			viewport.scrollTop = viewport.scrollHeight;

			const searchInput = document.find(".tt-chat-filter");
			if (searchInput) searchInput.remove();
			chat.find("[class*='chat-box-input_']").classList.remove("tt-modified");
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
