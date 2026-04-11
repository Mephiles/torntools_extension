import { Feature } from "@/features/feature-manager";
import { attackHistory, settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

async function showFF() {
	await requireElement("div[class*='textEntries___']");

	const id = parseInt(getSearchParameters().get("user2ID"));
	const ff = attackHistory.history[id]?.latestFairFightModifier;
	if (!ff) return;

	const entries = document.querySelector("div[class*='headerWrapper___'][class*='rose___'] div[class*='textEntries___']");

	entries.classList.add("tt-fair-attack");
	entries.insertAdjacentElement(
		"afterbegin",
		elementBuilder({
			type: "div",
			class: "tt-fair-attack",
			text: `FF: ${formatNumber(ff, { decimals: 2 })}`,
		}),
	);
}

function removeFF() {
	findAllElements(".tt-fair-attack").forEach((ff) => ff.remove());
}

export default class FairAttackFeature extends Feature {
	constructor() {
		super("Fair Attack", "attack");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.attack.fairAttack && settings.pages.global.keepAttackHistory;
	}

	async execute() {
		await showFF();
	}

	cleanup() {
		removeFF();
	}

	storageKeys() {
		return ["settings.pages.attack.fairAttack", "settings.pages.global.keepAttackHistory"];
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}
}
