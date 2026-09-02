import "./effective-battle-stats.css";
import { settings } from "@common/utils/data/database";
import { createContainer } from "@common/utils/functions/containers";
import { checkDevice, elementBuilder } from "@common/utils/functions/dom";
import { findElement, findElementWithText } from "@common/utils/functions/find-elements";
import { convertToNumber, dropDecimals, formatNumber } from "@common/utils/functions/formatting";
import { requireContent } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showEffectiveBattleStats() {
	await requireContent();

	const statsContainer = findElement("ul.info-cont-wrap", findElementWithText("h5", "Battle Stats").parentElement.nextElementSibling);
	const { content } = createContainer("Effective Battle Stats", {
		collapsible: false,
		applyRounding: false,
		compact: true,
		parentElement: statsContainer,
	});

	let effectiveTotal = 0;
	const stats = ["Strength", "Defense", "Speed", "Dexterity"];
	for (let i = 0; i < stats.length; i++) {
		const base = convertToNumber(findElement(`li:nth-child(${i + 1}) .desc`, statsContainer).textContent);

		const modifierText = findElement(`li:nth-child(${i + 1}) .mod`, statsContainer).textContent.trim();
		let modifier: number;
		if (modifierText.charAt(0) === "+") modifier = parseInt(modifierText.slice(1, -1)) / 100 + 1;
		else modifier = 1 - parseInt(modifierText.slice(1, -1)) / 100;
		const effective = dropDecimals(base * modifier);

		effectiveTotal += effective;
		content.appendChild(newRow(stats[i], formatNumber(effective)));
	}

	content.appendChild(newRow("Total", formatNumber(effectiveTotal)));

	function newRow(name: string, value: string) {
		return elementBuilder({
			type: "li",
			class: "stats-row",
			children: [
				elementBuilder({ type: "div", class: "divider", children: [elementBuilder({ type: "span", text: name })] }),
				elementBuilder({ type: "div", class: "desc", children: [elementBuilder({ type: "span", text: value })] }),
			],
		});
	}
}

export default class EffectiveBattleStatsFeature extends Feature {
	constructor() {
		super("Effective Battle Stats", "home");
	}

	override precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	override isEnabled() {
		return settings.pages.home.effectiveStats;
	}

	override async requirements() {
		await checkDevice();
		return true;
	}

	override async execute() {
		await showEffectiveBattleStats();
	}

	override storageKeys() {
		return ["settings.pages.home.effectiveStats"];
	}
}
