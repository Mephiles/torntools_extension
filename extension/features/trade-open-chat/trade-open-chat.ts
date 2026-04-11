import "./trade-open-chat.css";
import { browser } from "wxt/browser";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { elementBuilder, executeScript } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(async ({ step }) => {
		if (!FEATURE_MANAGER.isEnabled(TradeOpenChatFeature)) return;
		if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

		await addButton();
	});
}

async function addButton() {
	let id: number;

	const trader: HTMLAnchorElement = await requireElement(`#trade-container .log > li .desc a:not([href*="${userdata.profile.id}"])`);
	if (trader) id = parseInt(trader.href.match(/XID=(\d*)/i)[1]);
	if (!id) return;

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
