import { ExecutionTiming, Feature } from "@features/feature";
import { FEATURE_MANAGER, ttStorage } from "@utils/context";
import "./hide-chat.css";

import { settings } from "@utils/data/database";

import { createCheckbox } from "@utils/elements/checkbox/checkbox";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireChatsLoaded } from "@utils/functions/requires";

function initializeListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED].push(async ({ settingsPanel }) => {
		if (!FEATURE_MANAGER.isEnabled(HideChatFeature)) return;

		await showButton(settingsPanel);
	});
}

function hideChats() {
	if (settings.pages.chat.hideChat) document.documentElement.classList.add("tt-chat-hidden");
}

async function showButton(settingsPanel: HTMLElement = null) {
	if (!settingsPanel) {
		await requireChatsLoaded();

		settingsPanel = document.querySelector("#chatRoot [class*='settings-panel__'], #settings_panel");
	}

	if (!settingsPanel) return;

	const checkbox = createCheckbox({ description: "Hide chats with TornTools.", class: "tt-hide-chat-option" });
	checkbox.setChecked(settings.pages.chat.hideChat);
	checkbox.onChange(() => {
		const checked = checkbox.isChecked();

		if (checked) hideChats();
		else showChats();

		ttStorage.change({ settings: { pages: { chat: { hideChat: checked } } } });
	});

	if (!settingsPanel.id) {
		settingsPanel.children[1].insertAdjacentElement("afterbegin", checkbox.element);
	} else {
		settingsPanel.querySelector("[class*='content___']").insertAdjacentElement("afterbegin", checkbox.element);
	}
}

function showChats() {
	document.documentElement.classList.remove("tt-chat-hidden");
}

function removeButton() {
	document.querySelector(".tt-hide-chat-option")?.remove();
}

export default class HideChatFeature extends Feature {
	constructor() {
		super("Hide Chat", "chat", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.chat.hideChatButton;
	}

	initialise() {
		initializeListeners();
	}

	async execute() {
		hideChats();
		await showButton();
	}

	cleanup() {
		showChats();
		removeButton();
	}

	storageKeys() {
		return ["settings.pages.chat.hideChatButton"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}
