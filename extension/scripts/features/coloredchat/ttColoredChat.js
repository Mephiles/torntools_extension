"use strict";

(async () => {
	featureManager.registerFeature(
		"Colored Chat",
		"global",
		() => settings.pages.chat.titleHighlights.length,
		initialiseColoredChats,
		showColoredChats,
		removeColoredChats,
		{
			storage: ["settings.pages.chat.titleHighlights"],
		},
		null
	);

	function initialiseColoredChats() {
		// FIXME - Update colors upon a new chat.
	}

	async function showColoredChats() {
		await requireChatsLoaded();
		removeColoredChats();

		settings.pages.chat.titleHighlights
			.map((entry) => {
				return {
					colors: CHAT_TITLE_COLORS[entry.color],
					element: findParent(document.find(`[class*='chat-box-title_'][title^="${entry.title}"]`, { text: entry.title }), {
						class: "^=chat-box-head_",
					}),
				};
			})
			.filter((entry) => entry.colors && entry.colors.length === 2 && entry.element)
			.forEach((entry) => {
				entry.element.classList.add("chat-colored");
				entry.element.style.setProperty("--highlight-color__1", entry.colors[0]);
				entry.element.style.setProperty("--highlight-color__2", entry.colors[1]);
			});
	}

	function removeColoredChats() {
		[...document.findAll(".chat-colored")].forEach((chat) => chat.classList.remove("chat-colored"));
	}
})();
