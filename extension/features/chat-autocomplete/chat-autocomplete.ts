import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { checkDevice, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireChatsLoaded, requireElement } from "@/utils/common/functions/requires";
import { REACT_UPDATE_VERSIONS, updateReactInput } from "@/utils/common/functions/torn";
import {
	SELECTOR_CHAT_V2__CHAT_BOX_BODY,
	SELECTOR_CHAT_V2__MESSAGE_BOX,
	SELECTOR_CHAT_V2__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__BOX_SCROLLER,
	SELECTOR_CHAT_V3__MESSAGE,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
} from "@/utils/common/global/selectors/chatSelectors";

function initialiseAutocomplete() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(async ({ chat }) => {
		if (!FEATURE_MANAGER.isEnabled(ChatAutocompleteFeature)) return;

		await addAutocomplete(chat);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_RECONNECTED].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(ChatAutocompleteFeature)) return;

		await readSettings();
	});
}

async function readSettings() {
	await requireChatsLoaded();

	await Promise.all(
		findAllElements("[class*='group-chat-box__chat-box-wrapper__'] [class*='chat-box__'], #chatRoot [class*='item___'][style*='z-index']").map((chat) =>
			addAutocomplete(chat),
		),
	);
}

async function addAutocomplete(chat: HTMLElement) {
	await requireElement("[class*='loader___']", { parent: chat, invert: true });

	const messages = findAllElements(
		`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}, ${SELECTOR_CHAT_V3__BOX_SCROLLER} ${SELECTOR_CHAT_V3__MESSAGE}`,
		chat,
	);
	if (!messages.length) return;

	const textarea = chat.querySelector<HTMLTextAreaElement>("textarea:not(.tt-chat-autocomplete)");
	if (!textarea) return;
	textarea.classList.add("tt-chat-autocomplete");

	let currentUsername: string | null, currentSearchValue: string | null;
	textarea.addEventListener("keydown", (event) => {
		if (event.key !== "Tab") {
			currentUsername = null;
			currentSearchValue = null;
			return;
		}
		event.preventDefault();

		const valueBeforeCursor = textarea.value.substr(0, textarea.selectionStart);
		const searchValueMatch = valueBeforeCursor.match(/([^A-Za-z\d\-_]?)([A-Za-z\d\-_]*)$/);

		if (currentSearchValue === null) currentSearchValue = searchValueMatch[2].toLowerCase();

		const matchedUsernames = findAllElements(`${SELECTOR_CHAT_V2__MESSAGE_SENDER}, ${SELECTOR_CHAT_V3__MESSAGE_SENDER}`, chat)
			.map((message) => message.textContent.split(":")[0])
			.filter((username, index, array) => array.indexOf(username) === index && username.toLowerCase().startsWith(currentSearchValue))
			.sort();
		if (!matchedUsernames.length) return;

		let index = currentUsername !== null ? matchedUsernames.indexOf(currentUsername) + 1 : 0;
		if (index > matchedUsernames.length - 1) index = 0;

		currentUsername = matchedUsernames[index];

		const valueStart = searchValueMatch.index + searchValueMatch[1].length;
		updateReactInput(
			textarea,
			textarea.value.substring(0, valueStart) + currentUsername + textarea.value.substring(valueBeforeCursor.length, textarea.value.length),
			{ version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT },
		);

		const selectionIndex = valueStart + currentUsername.length;
		textarea.setSelectionRange(selectionIndex, selectionIndex);
	});
}

export default class ChatAutocompleteFeature extends Feature {
	constructor() {
		super("Chat Autocomplete", "chat");
	}

	async requirements() {
		const devices = await checkDevice();
		if (devices.mobile || devices.tablet) return "Not supported on mobile/tablet!";

		return true;
	}

	isEnabled() {
		return settings.pages.chat.completeUsernames;
	}

	initialise() {
		initialiseAutocomplete();
	}

	async execute() {
		await readSettings();
	}

	storageKeys() {
		return ["settings.pages.chat.completeUsernames"];
	}
}
