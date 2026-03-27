import { ExecutionTiming, Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";

function initialiseListeners() {
	new MutationObserver(async (mutations) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmPointsMarketFeature)) return;

		if (mutations[0].removedNodes.length > 1) return;

		await removeConfirmation();
	}).observe(document.querySelector(".users-point-sell"), { childList: true });
}

async function removeConfirmation() {
	await requireElement(".users-point-sell");

	for (const item of findAllElements(".users-point-sell > li:not(.yes) > span[href]")) {
		const url = item.getAttribute("href");
		if (settings.scripts.noConfirm.pointsMarketRemove && url.includes("ajax_action=remove")) {
			item.classList.add("yes");
			item.setAttribute("href", url.replace("ajax_action=remove", "ajax_action=remove1"));
		} else if (settings.scripts.noConfirm.pointsMarketBuy && url.includes("ajax_action=buy")) {
			item.classList.add("yes");
			item.setAttribute("href", url.replace("ajax_action=buy", "ajax_action=buy1"));
		}
	}
}

export default class NoConfirmPointsMarketFeature extends Feature {
	constructor() {
		super("Points Market No Confirm", "points", ExecutionTiming.CONTENT_LOADED);
	}

	isEnabled() {
		return settings.scripts.noConfirm.pointsMarketRemove || settings.scripts.noConfirm.pointsMarketBuy;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await removeConfirmation();
	}

	storageKeys() {
		return ["settings.scripts.noConfirm.pointsMarketRemove", "settings.scripts.noConfirm.pointsMarketBuy"];
	}
}
