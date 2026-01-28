interface ColoredChatOption {
	title: string;
	color: string;
}

(async () => {
	if (is2FACheckPage()) return;

	const feature = featureManager.registerFeature(
		"Colored Chat",
		"chat",
		() => !!settings.pages.chat.titleHighlights.length,
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

		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(reColorChats);
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_CLOSED].push(reColorChats);
		CUSTOM_LISTENERS[EVENT_CHANNELS.WINDOW__FOCUS].push(reColorChats);

		function reColorChats() {
			if (!feature.enabled()) return;

			showColoredChats(true);
		}
	}

	async function showColoredChats(loaded = false) {
		if (!loaded) await requireChatsLoaded();

		removeColoredChats();

		if (!settings.pages.chat.titleHighlights.length) return;

		document
			.findAll(
				[
					"[class*='group-minimized-chat-box__'] > [class*='minimized-chat-box__']", // Chat 2.0 - minimized chats
					"[class*='chat-box__'] > [class*='chat-box-header__']", // Chat 2.0 - chat headers
					"[class*='root___']:has(> button[id*='channel_panel_button:private'])", // Chat 3.0 - minimized private chats
					"[class*='root___'] > [class*='root___']:has(> button[class*='header___'])", // Chat 3.0 - chat headers
				].join(", ")
			)
			.forEach((chatHeader) => {
				const chatPlayer = chatHeader.textContent;
				const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

				applyColor(highlights, chatHeader);
			});
		document
			.findAll("[class*='root___']:has(> button[id*='channel_panel_button:'][title])") // Chat 3.0 - minimized group chats
			.forEach((chatHeader) => {
				const chatPlayer = chatHeader.find("button[title]").getAttribute("title");
				const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

				applyColor(highlights, chatHeader);
			});
	}

	function applyColor(highlights: ColoredChatOption[], header: HTMLElement) {
		if (!highlights.length) return;
		if (CHAT_TITLE_COLORS[highlights[0].color]?.length !== 2) return;

		header.classList.add("tt-chat-colored");
		header.style.setProperty("--highlight-color_1", CHAT_TITLE_COLORS[highlights[0].color][0]);
		header.style.setProperty("--highlight-color_2", CHAT_TITLE_COLORS[highlights[0].color][1]);
	}

	function removeColoredChats() {
		[...document.findAll(".tt-chat-colored")].forEach((chat) => chat.classList.remove("tt-chat-colored"));
	}
})();
