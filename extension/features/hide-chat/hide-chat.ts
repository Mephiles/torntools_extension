import "./hide-chat.css";
import { ExecutionTiming, Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireChatsLoaded } from "@/utils/common/functions/requires";
import { createCheckbox } from "@/utils/common/elements/checkbox/checkbox";
import { ttStorage } from "@/utils/common/data/storage";

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
}
