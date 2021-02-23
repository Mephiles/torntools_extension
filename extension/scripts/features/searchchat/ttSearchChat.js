"use strict";

(async () => {
	featureManager.registerFeature(
		"Search Chat",
		"global",
		() => settings.pages.chat.searchChat,
		null,
		showSearch,
		removeSearch,
		{
			storage: ["settings.pages.chat.searchChat"],
		},
		null
	);

	async function showSearch() {
		for (let chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			if (chat.find(".tt-chat-filter")) continue;

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

									for (let message of chat.findAll("[class*='overview_'] [class*='message_']")) {
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
	}

	function removeSearch() {
		for (let chat of document.findAll("[class*='chat-active_']:not([class*='chat-box-settings_'])")) {
			for (let message of document.findAll("[class*='overview_'] [class*='message_']")) {
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
