import { attackHistory, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showFF() {
	await requireElement("div[class*='textEntries___']");

	const id = parseInt(getSearchParameters().get("user2ID"));
	const ff = attackHistory.history[id]?.latestFairFightModifier;
	if (!ff) return;

	const entries = findElement("div[class*='headerWrapper___'][class*='rose___'] div[class*='textEntries___']");

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

export default class FairAttackFeature extends Feature {
	constructor() {
		super("Fair Attack", "attack");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.attack.fairAttack && settings.pages.global.keepAttackHistory;
	}

	override async execute() {
		await showFF();
	}

	override storageKeys() {
		return ["settings.pages.attack.fairAttack", "settings.pages.global.keepAttackHistory"];
	}

	override async requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}
}
