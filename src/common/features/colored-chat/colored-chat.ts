import "./colored-chat.css";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import { CHAT_TITLE_COLORS, is2FACheckPage } from "@common/utils/functions/torn";
import { SELECTOR_CHAT_V3__VARIOUS_ROOT } from "@common/utils/global/selectors/chatSelectors";
import { Feature } from "@features/feature";

async function initialiseColoredChats() {
	await requireChatsLoaded();

	addCustomListener(EVENT_CHANNELS.CHAT_OPENED, reColorChats);
	addCustomListener(EVENT_CHANNELS.CHAT_CLOSED, reColorChats);
	addCustomListener(EVENT_CHANNELS.WINDOW__FOCUS, reColorChats);

	async function reColorChats() {
		await showColoredChats(true);
	}
}

async function showColoredChats(loaded = false) {
	if (!loaded) await requireChatsLoaded();

	removeColoredChats();

	if (!settings.pages.chat.titleHighlights.length) return;

	findAllElements(
		[
			`${SELECTOR_CHAT_V3__VARIOUS_ROOT}:has(> button[id*='chat_panel_button:']:not([title]))`, // Chat v3 - minimized private chats
			`${SELECTOR_CHAT_V3__VARIOUS_ROOT} > ${SELECTOR_CHAT_V3__VARIOUS_ROOT}:has(> button[class*='header___'])`, // Chat v3 - chat headers
		].join(", "),
	).forEach((chatHeader) => {
		const chatPlayer = chatHeader.textContent;
		const highlights = settings.pages.chat.titleHighlights.filter((highlight) => highlight.title === chatPlayer);

		applyColor(highlights, chatHeader);
	});
	findAllElements(`${SELECTOR_CHAT_V3__VARIOUS_ROOT}:has(> button[id*='chat_panel_button:'][title])`) // Chat v3 - minimized group chats
		.forEach((chatHeader) => {
			const chatPlayer = findElement("button[title]", chatHeader).getAttribute("title");
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

	override precondition() {
		return !is2FACheckPage();
	}

	override isEnabled() {
		return !!settings.pages.chat.titleHighlights.length;
	}

	override async initialise() {
		await initialiseColoredChats();
	}

	override async execute() {
		await showColoredChats();
	}

	override storageKeys() {
		return ["settings.pages.chat.titleHighlights"];
	}
}
