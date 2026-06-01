import { ExecutionTiming, Feature } from "@features/feature";
import "./chat-font-size.css";

import { settings } from "@utils/data/database";

function applySize() {
	document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);
}

export default class ChatFontSizeFeature extends Feature {
	constructor() {
		super("Chat Font Size", "chat", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.chat.fontSize !== 12;
	}

	execute() {
		applySize();
	}

	cleanup() {
		applySize();
	}

	storageKeys() {
		return ["settings.pages.chat.fontSize"];
	}
}
