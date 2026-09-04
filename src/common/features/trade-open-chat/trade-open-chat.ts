import "./trade-open-chat.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, executeScript } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { browser } from "wxt/browser";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.TRADE, async ({ step }) => {
		if (!FEATURE_MANAGER.isEnabled(TradeOpenChatFeature)) return;
		if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

		await addButton();
	});
}

async function addButton() {
	await requireElement(`#trade-container .log > li .desc a`);

	if (!(await getTraderID())) return;

	const button = elementBuilder({ type: "span", text: "Open Chat", class: "tt-open-chat" });

	button.addEventListener("click", () => executeScript(browser.runtime.getURL("/trade-open-chat--inject.js")));

	findElement("#trade-container > .title-black").appendChild(
		elementBuilder({
			type: "div",
			children: [button],
		}),
	);
}

export async function getTraderID() {
	const cookie = await cookieStore.get("uid");
	if (!cookie) return null;

	const playerID = cookie.value;

	const traderLink = findElement(`#trade-container .log > li .desc a:not([href*="${playerID}"]), .info-msg-cont a:not([href*='${playerID}'])`, true);
	const traderMatch = traderLink?.getAttribute("href")?.match(/XID=(\d*)/i);
	if (!traderMatch) return null;

	return parseInt(traderMatch[1]);
}

export default class TradeOpenChatFeature extends Feature {
	constructor() {
		super("Trade Open Chat", "trade");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.trade.openChat;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await addButton();
	}

	override storageKeys() {
		return ["settings.pages.trade.openChat"];
	}
}
