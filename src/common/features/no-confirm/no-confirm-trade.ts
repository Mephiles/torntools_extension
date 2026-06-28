import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.TRADE, async ({ active }) => {
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
