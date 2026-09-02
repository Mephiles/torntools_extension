import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { withoutEndPunctuation } from "@common/utils/functions/formatting";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import { getUserDetails, HIGHLIGHT_PLACEHOLDERS, is2FACheckPage } from "@common/utils/functions/torn";
import {
	SELECTOR_CHAT_V2__CHAT_BOX_BODY,
	SELECTOR_CHAT_V2__MESSAGE_BOX,
	SELECTOR_CHAT_V2__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__BOX_SCROLLER,
	SELECTOR_CHAT_V3__MESSAGE,
	SELECTOR_CHAT_V3__MESSAGE_SELF,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__VARIOUS_ROOT,
} from "@common/utils/global/selectors/chatSelectors";
import { Feature } from "@features/feature";

export interface SavedHighlight {
	name: string;
	color: string;
}

let highlights: HighlightColor[];

interface HighlightColor {
	name: string;
	color: string;
	senderColor: string;
}

function initialiseHighlights() {
	addCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, ({ message }) => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		const messageBox = findElement(SELECTOR_CHAT_V2__MESSAGE_BOX, message, true);
		if (messageBox) applyV2Highlights(messageBox);
		else applyV3Highlights(message);
	});
	addCustomListener(EVENT_CHANNELS.CHAT_OPENED, ({ chat }) => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}`, chat)) {
			applyV2Highlights(message);
		}
		for (const message of findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`, chat)) {
			applyV3Highlights(message);
		}
	});
	addCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, (information) => {
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
	addCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED, () => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		for (const message of findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`)) {
			applyV3Highlights(message);
		}
	});
	addCustomListener(EVENT_CHANNELS.WINDOW__FOCUS, () => {
		if (!FEATURE_MANAGER.isEnabled(ChatHighlightFeature)) return;

		applyAllHighlights();
	});
}

function readSettings() {
	highlights = settings.pages.chat.highlights
		.map<HighlightColor>((highlight) => {
			let { name, color } = highlight;

			for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			if (!name?.trim()) return null;

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		})
		.filter((h) => !!h);

	applyAllHighlights();
}

function applyAllHighlights() {
	requireChatsLoaded().then(() => {
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

	const sender = simplify(findElement(SELECTOR_CHAT_V2__MESSAGE_SENDER, message).textContent.replace(":", ""));
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
	const senderElement = findElement(SELECTOR_CHAT_V3__MESSAGE_SENDER, message, true);
	if (senderElement) {
		sender = senderElement.textContent.replace(":", "");
	} else {
		const root = message.closest(SELECTOR_CHAT_V3__VARIOUS_ROOT);
		if (root?.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
			sender = getUserDetails().name;
		} else if (root && !root.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
			const chatItem = message.closest("[class*='item___']");
			const title = findElement("[class*='title___']", chatItem);
			sender = title.textContent;
		} else return;
	}
	sender = simplify(sender);

	const words = findElement("[class*='message___']", message)
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
		// When word includes a name in highlights.
		if (!words.includes(name)) continue;

		message.style.backgroundColor = color;
		writeDebugData(message, "word", name);
		break;
	}

	function simplify(text: string) {
		return text.toLowerCase().trim();
	}
}

interface HighlightDebugData {
	type: string;
	match: string;
}

function writeDebugData(message: HTMLElement, type: string, match: string) {
	const debugData = (message.dataset.ttHighlightDebug ? (JSON.parse(message.dataset.ttHighlightDebug) as HighlightDebugData[]) : []).filter(
		(n) => n.type !== type,
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

	override precondition() {
		return !is2FACheckPage();
	}

	override isEnabled() {
		return !!settings.pages.chat.highlights.length;
	}

	override initialise() {
		initialiseHighlights();
	}

	override execute() {
		readSettings();
	}

	override storageKeys() {
		return ["settings.pages.chat.highlights"];
	}
}
