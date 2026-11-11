import { settings } from "@common/utils/data/database";
import { findElement } from "@common/utils/functions/find-elements";
import { Feature } from "@features/feature";
import { lotteryChance } from "./lottery-chance-calculation";
import styles from "./lottery-chance.module.css";

const LOTTERIES = ["daily-dime", "lucky-shot", "holy-grail"];

function readTickets(element: Element | null): number | null {
	const text = element?.textContent?.trim().replaceAll(",", "");
	if (!text || !/^\d+$/.test(text)) return null;
	return Number(text);
}

function updateChances() {
	for (const id of LOTTERIES) {
		const lottery = findElement(`#${id}`, true);
		const description = lottery ? findElement(".desc", lottery, true) : null;
		if (!lottery || !description) continue;
		const owned = readTickets(findElement(".totalTickets", lottery, true));
		const total = readTickets(findElement(".tickets", lottery, true));
		const chance = owned === null || total === null ? null : lotteryChance(owned, total);
		let display = findElement(`.${styles.lotteryChance}`, description, true);
		if (chance === null) {
			display?.remove();
			continue;
		}
		if (!display) {
			display = document.createElement("div");
			display.className = styles.lotteryChance;
			description.appendChild(display);
		}
		const text = `Current chance: ${chance.toFixed(6)}%`;
		if (display.textContent !== text) display.textContent = text;
	}
}

export default class LotteryChanceFeature extends Feature {
	constructor() {
		super("Lottery Chance", "lottery");
	}

	override isEnabled() {
		return settings.pages.lottery.chance;
	}

	override storageKeys() {
		return ["settings.pages.lottery.chance"];
	}

	override execute() {
		updateChances();
		new MutationObserver(updateChances).observe(document.body, { childList: true, characterData: true, subtree: true });
	}
}
