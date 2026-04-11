import "./colored-chat.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireChatsLoaded } from "@/utils/common/functions/requires";
import { CHAT_TITLE_COLORS, is2FACheckPage } from "@/utils/common/functions/torn";

async function initialiseColoredChats() {
	await requireChatsLoaded();

	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(reColorChats);
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_CLOSED].push(reColorChats);
	CUSTOM_LISTENERS[EVENT_CHANNELS.WINDOW__FOCUS].push(reColorChats);

	async function reColorChats() {
		if (!FEATURE_MANAGER.isEnabled(ColoredChatFeature)) return;

		await showColoredChats(true);
	}
}

async function showColoredChats(loaded = false) {
	if (!loaded) await requireChatsLoaded();

	removeColoredChats();

	if (!settings.pages.chat.titleHighlights.length) return;

	findAllElements(
		[
			"[class*='group-minimized-chat-box__'] > [class*='minimized-chat-box__']", // Chat 2.0 - minimized chats
			"[class*='chat-box__'] > [class*='chat-box-header__']", // Chat 2.0 - chat headers
			"[class*='root___']:has(> button[id*='channel_panel_button:private'])", // Chat 3.0 - minimized private chats
			"[class*='root___'] > [class*='root___']:has(> button[class*='header___'])", // Chat 3.0 - chat headers
		].join(", "),
	).forEach((chatHeader) => {
		const chatPlayer = chatHeader.textContent;
		const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

		applyColor(highlights, chatHeader);
	});
	findAllElements("[class*='root___']:has(> button[id*='channel_panel_button:'][title])") // Chat 3.0 - minimized group chats
		.forEach((chatHeader) => {
			const chatPlayer = chatHeader.querySelector("button[title]").getAttribute("title");
			const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

			applyColor(highlights, chatHeader);
		});
}

export interface ColoredChatOption {
	title: string;
	color: string;
}

function applyColor(highlights: ColoredChatOption[], header: HTMLElement) {
	if (!highlights.length) return;
	if (CHAT_TITLE_COLORS[highlights[0].color]?.length !== 2) return;

	header.classList.add("tt-chat-colored");
	header.style.setProperty("--highlight-color_1", CHAT_TITLE_COLORS[highlights[0].color][0]);
	header.style.setProperty("--highlight-color_2", CHAT_TITLE_COLORS[highlights[0].color][1]);
}

function removeColoredChats() {
	findAllElements(".tt-chat-colored").forEach((chat) => chat.classList.remove("tt-chat-colored"));
}

export default class ColoredChatFeature extends Feature {
	constructor() {
		super("Colored Chat", "chat");
	}

	precondition() {
		return !is2FACheckPage();
	}

	isEnabled() {
		return !!settings.pages.chat.titleHighlights.length;
	}

	initialise() {
		initialiseColoredChats();
	}

	async execute() {
		await showColoredChats();
	}

	cleanup() {
		removeColoredChats();
	}

	storageKeys() {
		return ["settings.pages.chat.titleHighlights"];
	}
}
