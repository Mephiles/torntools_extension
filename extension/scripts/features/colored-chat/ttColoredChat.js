"use strict";

(async () => {
	if (is2FACheckPage()) return;

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

	async function initialiseColoredChats() {
		await requireChatsLoaded();

		new MutationObserver(() => {
			if (!feature.enabled()) return;

			showColoredChats(true);
		}).observe(document.find("#chatRoot [class*='group-minimized-chat-box__']"), { childList: true });
	}

	async function showColoredChats(loaded = false) {
		if (!loaded) await requireChatsLoaded();

		removeColoredChats();

		if (!settings.pages.chat.titleHighlights.length) return;

		document.findAll("[class*='group-minimized-chat-box__'] > [class*='minimized-chat-box__']").forEach((chatHeader) => {
			const chatPlayer = chatHeader.textContent;
			const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

			if (highlights.length && CHAT_TITLE_COLORS[highlights[0].color]?.length === 2) {
				chatHeader.classList.add("tt-chat-colored");
				chatHeader.style.setProperty("--highlight-color_1", CHAT_TITLE_COLORS[highlights[0].color][0]);
				chatHeader.style.setProperty("--highlight-color_2", CHAT_TITLE_COLORS[highlights[0].color][1]);
			}
		});
		document.findAll("[class*='chat-box__'] > [class*='chat-box-header__']").forEach((chatHeader) => {
			const chatPlayer = chatHeader.textContent;
			const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

			if (highlights.length && CHAT_TITLE_COLORS[highlights[0].color]?.length === 2) {
				chatHeader.classList.add("tt-chat-colored");
				chatHeader.style.setProperty("--highlight-color_1", CHAT_TITLE_COLORS[highlights[0].color][0]);
				chatHeader.style.setProperty("--highlight-color_2", CHAT_TITLE_COLORS[highlights[0].color][1]);
			}
		});
	}

	function removeColoredChats() {
		[...document.findAll(".tt-chat-colored")].forEach((chat) => chat.classList.remove("tt-chat-colored"));
	}
})();
