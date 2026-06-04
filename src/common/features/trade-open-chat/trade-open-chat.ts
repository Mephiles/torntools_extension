import "./trade-open-chat.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder, executeScript } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";
import { browser } from "wxt/browser";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(async ({ step }) => {
		if (!FEATURE_MANAGER.isEnabled(TradeOpenChatFeature)) return;
		if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

		await addButton();
	});
}

async function addButton() {
	await requireElement(`#trade-container .log > li .desc a`);

	const button = elementBuilder({
		type: "span",
		text: "Open Chat",
		class: "tt-open-chat",
	});

	button.addEventListener("click", () => executeScript(browser.runtime.getURL("/trade-open-chat--inject.js")));

	document.querySelector("#trade-container > .title-black").appendChild(
		elementBuilder({
			type: "div",
			children: [button],
		}),
	);
}

function removeButton() {
	document.querySelector(".tt-open-chat")?.remove();
}

export default class TradeOpenChatFeature extends Feature {
	constructor() {
		super("Trade Open Chat", "trade");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.trade.openChat;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addButton();
	}

	cleanup() {
		removeButton();
	}

	storageKeys() {
		return ["settings.pages.trade.openChat"];
	}
}
