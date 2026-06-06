import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { localdata, settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireChatsLoaded, requireElement } from "@common/utils/functions/requires";
import { isChatV3 } from "@common/utils/functions/torn";
import { SELECTOR_CHAT_ROOT, SELECTOR_CHAT_V3__BOX, SELECTOR_CHAT_V3__VARIOUS_ROOT } from "@common/utils/global/selectors/chatSelectors";
import { Feature } from "@features/feature";
import styles from "./resizable-chat.module.css";

const MIN_HEIGHT = 26;
const MAX_HEIGHT = 48;

export interface StoredResizableChats {
	[key: string]: string;
}

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(async ({ chat }) => {
		if (!FEATURE_MANAGER.isEnabled(ResizableChatFeature)) return;

		await resizeInput(chat);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_RECONNECTED].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(ResizableChatFeature)) return;

		await startFeature();
	});
}

let resizeObserver: ResizeObserver | undefined;

async function startFeature() {
	await requireChatsLoaded();

	await Promise.all(findAllElements(`${SELECTOR_CHAT_ROOT} ${SELECTOR_CHAT_V3__BOX}`).map((textarea) => resizeInput(textarea)));
}

async function resizeInput(chat: HTMLElement) {
	const firstRoot = chat.querySelector(SELECTOR_CHAT_V3__VARIOUS_ROOT);
	if (!firstRoot || firstRoot.id) return;

	await requireElement("[class*='loader___']", { parent: chat, invert: true });
	const textarea: HTMLTextAreaElement = await requireElement("textarea", { parent: chat });

	const id = chat.querySelector(`${SELECTOR_CHAT_V3__VARIOUS_ROOT}[id]`).id;

	if (id in localdata.chatResize) {
		textarea.style.height = localdata.chatResize[id];
	}

	textarea.classList.add(styles.resizableChat);

	resizeObserver = new ResizeObserver(async () => {
		const setHeight = parseInt(textarea.style.height);
		const newHeight = Math.max(Math.min(setHeight, MAX_HEIGHT), MIN_HEIGHT);

		await ttStorage.change({ localdata: { chatResize: { [id]: Number.isNaN(setHeight) ? undefined : `${newHeight}px` } } });
	});
	resizeObserver.observe(textarea);
}

function removeResize() {
	findAllElements(styles.resizableChat).forEach((textarea) => {
		textarea.style.height = "";
		textarea.classList.remove(styles.resizableChat);
	});
	resizeObserver?.disconnect();
	resizeObserver = undefined;
}

export default class ResizableChatFeature extends Feature {
	constructor() {
		super("Resizable Chat", "chat");
	}

	requirements() {
		if (!isChatV3()) return "Only for chat v3.";

		return true;
	}

	isEnabled() {
		return settings.pages.chat.resizable;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeResize();
	}

	storageKeys() {
		return ["settings.pages.chat.resizable"];
	}
}
