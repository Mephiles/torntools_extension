import "./chat-font-size.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

function applySize() {
	document.documentElement.style.setProperty("--torntools-chat-font-size", `${settings.pages.chat.fontSize || 12}px`);
}

export default class ChatFontSizeFeature extends Feature {
	constructor() {
		super("Chat Font Size", "chat", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.chat.fontSize !== 12;
	}

	override execute() {
		applySize();
	}

	override storageKeys() {
		return ["settings.pages.chat.fontSize"];
	}
}
