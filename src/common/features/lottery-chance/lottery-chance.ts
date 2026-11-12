import { settings } from "@common/utils/data/database";
import { findElement } from "@common/utils/functions/find-elements";
import { addXHRListener } from "@common/utils/functions/listeners";
import { Feature } from "@features/feature";
import { lotteryChance, lotteryTickets } from "./lottery-chance-calculation";
import styles from "./lottery-chance.module.css";

const LOTTERIES = ["daily-dime", "lucky-shot", "holy-grail"];

function readTickets(element: Element | null, suffix = ""): number | null {
	const text = element?.textContent?.trim().replace(suffix, "").trim().replaceAll(",", "");
	if (!text || !/^\d+$/.test(text)) return null;
	return Number(text);
}

function updateChances(data?: { id: string; owned: number; total: number }[]) {
	for (const id of LOTTERIES) {
		const lottery = findElement(`#${id}`, true);
		const description = lottery ? findElement(".desc", lottery, true) : null;
		if (!lottery || !description) continue;
		const ticketData = data?.find((item) => item.id === id);
		if (data && !ticketData) continue;
		const owned = ticketData
			? ticketData.owned
			: (readTickets(findElement(".totalTickets", lottery, true), " tickets bought") ??
				readTickets(findElement(".totalTickets", lottery, true), " ticket bought"));
		const total = ticketData ? ticketData.total : readTickets(findElement(".tickets span", lottery, true));
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
		const text = `Current Chance: ${chance.toFixed(6)}%`;
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

	override initialise() {
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!settings.pages.lottery.chance || page !== "page" || new URL(xhr.responseURL).searchParams.get("sid") !== "lotteryData") return;
			updateChances(lotteryTickets(json));
		});
	}

	override execute() {
		updateChances();
	}
}
