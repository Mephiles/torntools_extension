import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";

function initialise() {
	new MutationObserver(async (mutations) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmPointsMarketFeature)) return;

		if (mutations[0].removedNodes.length > 1) return;

		await startFeature();
	}).observe(document.querySelector(".users-point-sell"), { childList: true });
}

async function startFeature() {
	await requireElement(".users-point-sell");

	removeConfirmation();
}

function removeConfirmation() {
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
		super("Points Market No Confirm", "points");
	}

	isEnabled() {
		return settings.scripts.noConfirm.pointsMarketRemove || settings.scripts.noConfirm.pointsMarketBuy;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await startFeature();
	}

	storageKeys() {
		return ["settings.scripts.noConfirm.pointsMarketRemove", "settings.scripts.noConfirm.pointsMarketBuy"];
	}
}
