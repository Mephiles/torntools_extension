import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { withoutEndPunctuation } from "@common/utils/functions/formatting";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import { getUserDetails, HIGHLIGHT_PLACEHOLDERS, is2FACheckPage } from "@common/utils/functions/torn";
import {
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
	addCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, ({ message }) => applyV3Highlights(message));
	addCustomListener(EVENT_CHANNELS.CHAT_OPENED, ({ chat }) => {
		findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`, chat).forEach(applyV3Highlights);
	});
	addCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, ({ chat }) => {
		findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`, chat).forEach(applyV3Highlights);
	});
	addCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED, () => {
		findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`).forEach(applyV3Highlights);
	});
	addCustomListener(EVENT_CHANNELS.WINDOW__FOCUS, applyAllHighlights);
}

function readSettings() {
	highlights = settings.pages.chat.highlights
		.map<HighlightColor | null>((highlight) => {
			let { name, color } = highlight;

			for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			if (!name?.trim()) return null;

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		})
		.filter((highlight) => highlight !== null);

	applyAllHighlights();
}

function applyAllHighlights() {
	requireChatsLoaded().then(() => {
		findAllElements(`${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`).forEach(applyV3Highlights);
	});
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
			const details = getUserDetails();
			sender = "name" in details ? (details.name ?? "") : "";
		} else if (root && !root.matches(SELECTOR_CHAT_V3__MESSAGE_SELF)) {
			const chatItem = message.closest("[class*='item___']")!;
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
