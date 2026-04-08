import styles from "./resizable-chat.module.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { localdata, settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireChatsLoaded, requireElement } from "@/utils/common/functions/requires";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { SELECTOR_CHAT_ROOT, SELECTOR_CHAT_V3__BOX, SELECTOR_CHAT_V3__VARIOUS_ROOT } from "@/utils/common/global/selectors/chatSelectors";
import { ttStorage } from "@/utils/common/data/storage";
import { isChatV3 } from "@/utils/common/functions/torn";

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
		const newHeight = Math.min(setHeight, MAX_HEIGHT);

		await ttStorage.change({ localdata: { chatResize: { [id]: `${newHeight}px` } } });
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
