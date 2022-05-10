"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Colored Chat",
		"chat",
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
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_NEW].push(() => {
			if (!feature.enabled()) return;

			showColoredChats();
		});
	}

	async function showColoredChats() {
		await requireChatsLoaded();
		removeColoredChats();

		settings.pages.chat.titleHighlights
			.map((entry) => {
				return {
					colors: CHAT_TITLE_COLORS[entry.color],
					element: findParent(document.find(`[class*='_chat-box-title_'][title^="${entry.title}"]`, { text: entry.title }), {
						class: "^=_chat-box-head_",
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
