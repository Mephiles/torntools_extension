import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import { settings } from "@utils/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(async ({ active }) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmTradeFeature)) return;
		if (!active) return;

		await removeConfirmation();
	});
}

async function removeConfirmation() {
	await requireElement("#trade-container .trade-cont");

	const link = document.querySelector(".trade-cancel a.accept");
	if (!link) return;

	const url = link.getAttribute("href");
	if (!url.includes("accept") || url.includes("accept2")) return;

	link.setAttribute("href", url.replace("accept", "accept2"));
}

export default class NoConfirmTradeFeature extends Feature {
	constructor() {
		super("Trade No Confirm", "trade");
	}

	isEnabled() {
		return settings.scripts.noConfirm.tradeAccept;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await removeConfirmation();
	}

	storageKeys() {
		return ["settings.scripts.noConfirm.tradeAccept"];
	}
}
