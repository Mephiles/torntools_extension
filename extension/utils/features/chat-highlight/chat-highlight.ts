import { Feature, FEATURE_MANAGER } from "@features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { getUserDetails, is2FACheckPage } from "@/utils/common/functions/torn";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireChatsLoaded } from "@/utils/common/functions/requires";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { sleep } from "@/utils/common/functions/utilities";
import {
	SELECTOR_CHAT_V2__CHAT_BOX_BODY,
	SELECTOR_CHAT_V2__MESSAGE_BOX,
	SELECTOR_CHAT_V2__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__BOX_SCROLLER,
	SELECTOR_CHAT_V3__MESSAGE,
	SELECTOR_CHAT_V3__MESSAGE_SELF,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
} from "@/utils/common/global/selectors/chatSelectors";

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => getUserDetails().name ?? "", description: "Your player name." }] as const;

interface HighlightColor {
	name: string;
	color: string;
	senderColor: string;
}

interface HighlightDebugData {
	type: string;
	match: string;
}

let highlights: HighlightColor[];

function initialiseHighlights() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		const messageBox = message.querySelector<HTMLElement>(SELECTOR_CHAT_V2__MESSAGE_BOX);
		if (messageBox) applyV2Highlights(messageBox);
		else applyV3Highlights(message);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}`, chat)) {
			applyV2Highlights(message);
		}
		for (const message of findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`, chat)) {
			applyV3Highlights(message);
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push((information) => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		if (information) {
			const { chat } = information;
			for (const message of findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`, chat)) {
				applyV3Highlights(message);
			}
		} else {
			for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}`)) {
				applyV2Highlights(message);
			}
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.WINDOW__FOCUS].push(() => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		applyAllHighlights();
	});
}

function readSettings() {
	if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

	highlights = settings.pages.chat.highlights.map<HighlightColor>((highlight) => {
		let { name, color } = highlight;

		for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
			if (name !== placeholder.name) continue;

			name = placeholder.value();
			break;
		}

		return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
	});

	applyAllHighlights();
}

function applyAllHighlights() {
	requireChatsLoaded()
		.then(() => sleep(100))
		.then(() => {
			removeHighlights();

			for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}`)) {
				applyV2Highlights(message);
			}
			for (const message of findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`)) {
				applyV3Highlights(message);
			}
		});
}

function applyV2Highlights(message: HTMLElement) {
	if (!message) return;
	if (!highlights?.length) return;

	const sender = simplify(message.querySelector(SELECTOR_CHAT_V2__MESSAGE_SENDER).textContent.replace(":", ""));
	const words = message.lastElementChild.textContent
		.split(" ")
		.map(simplify)
		.flatMap((text) => [text, withoutEndPunctuation(text)]);

	const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
	if (senderHighlights.length) {
		// When message sender is in highlights.
		message.style.outline = `1px solid ${senderHighlights[0].senderColor}`;
	}

	for (const { name, color } of highlights) {
		// When word includes a name in highlights.
		if (!words.includes(name)) continue;

		message.style.backgroundColor = color;
		break;
	}

	function simplify(text: string) {
		return text.toLowerCase().trim();
	}
}

function applyV3Highlights(message: HTMLElement) {
	if (!message) return;
	if (!highlights?.length) return;

	let sender: string;
	const senderElement = message.querySelector(SELECTOR_CHAT_V3__MESSAGE_SENDER);

	if (senderElement) {
		sender = senderElement.textContent.replace(":", "");
	} else {
		const hasBox = !!message.querySelector("[class*='box___']");
		if (hasBox) {
			if (message.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
				sender = getUserDetails().name;
			} else {
				const chatItem = message.closest("[class*='item___']");
				const title = chatItem.querySelector("[class*='title___']");
				sender = title.textContent;
			}
		} else {
			return;
		}

		if (hasBox && message.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
			sender = getUserDetails().name;
		} else if (hasBox && !message.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
			const chatItem = message.closest("[class*='item___']");
			const title = chatItem.querySelector("[class*='title___']");
			sender = title.textContent;
		} else return;
	}
	sender = simplify(sender);

	const words = message
		.querySelector("[class*='message___']")
		.textContent.split(" ")
		.map(simplify)
		.flatMap((text) => [text, withoutEndPunctuation(text)]);

	const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
	if (senderHighlights.length) {
		// When the message sender is in highlights.
		message.style.outline = `1px solid ${senderHighlights[0].senderColor}`;
		writeDebugData(message, "sender", senderHighlights.map((h) => h.name).join(" | "));
	}

	for (const { name, color } of highlights) {
		// When a word includes a name in highlights.
		if (!words.includes(name)) continue;

		message.style.backgroundColor = color;
		writeDebugData(message, "word", name);
		break;
	}

	function simplify(text: string) {
		return text.toLowerCase().trim();
	}
}

function withoutEndPunctuation(text: string) {
	return text.replace(/[.,!?]+$/, "");
}

function writeDebugData(message: HTMLElement, type: string, match: string) {
	const debugData = (message.dataset.ttHighlightDebug ? (JSON.parse(message.dataset.ttHighlightDebug) as HighlightDebugData[]) : []).filter(
		(n) => n.type !== type
	);

	debugData.push({ type, match });

	message.dataset.ttHighlightDebug = JSON.stringify(debugData, null, 2);
}

function removeHighlights() {
	for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}[style]`)) {
		message.style = "";
	}
}

export default class ChatHighlightFeature extends Feature {
	constructor() {
		super("Chat Highlight", "chat");
	}

	precondition() {
		return !is2FACheckPage();
	}

	isEnabled() {
		return !!settings.pages.chat.highlights.length;
	}

	initialise() {
		initialiseHighlights();
	}

	execute() {
		readSettings();
	}

	cleanup() {
		removeHighlights();
	}

	storageKeys() {
		return ["settings.pages.chat.highlights"];
	}
}
