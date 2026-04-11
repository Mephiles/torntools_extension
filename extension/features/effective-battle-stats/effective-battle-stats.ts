import "./effective-battle-stats.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { checkDevice, elementBuilder, findElementWithText } from "@/utils/common/functions/dom";
import { convertToNumber, dropDecimals, formatNumber } from "@/utils/common/functions/formatting";
import { requireContent } from "@/utils/common/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@/utils/common/functions/torn";

async function showEffectiveBattleStats() {
	await requireContent();

	const statsContainer = findElementWithText("h5", "Battle Stats").parentElement.nextElementSibling.querySelector("ul.info-cont-wrap");
	const { content } = createContainer("Effective Battle Stats", {
		collapsible: false,
		applyRounding: false,
		compact: true,
		parentElement: statsContainer,
	});

	let effectiveTotal = 0;
	const stats = ["Strength", "Defense", "Speed", "Dexterity"];
	for (let i = 0; i < stats.length; i++) {
		const base = convertToNumber(statsContainer.querySelector(`li:nth-child(${i + 1}) .desc`).textContent);

		const modifierText = statsContainer.querySelector(`li:nth-child(${i + 1}) .mod`).textContent.trim();
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

	precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	isEnabled() {
		return settings.pages.home.effectiveStats;
	}

	async requirements() {
		await checkDevice();
		return true;
	}

	async execute() {
		await showEffectiveBattleStats();
	}

	cleanup() {
		removeContainer("Effective Battle Stats");
	}

	storageKeys() {
		return ["settings.pages.home.effectiveStats"];
	}
}
