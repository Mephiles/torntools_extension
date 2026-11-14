import { isLotteryData } from "@common/pages/lottery-page.ts";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { findElement } from "@common/utils/functions/find-elements";
import { addXHRListener } from "@common/utils/functions/listeners";
import { Feature } from "@features/feature";
import { lotteryTickets } from "./lottery-chance-calculation";
import styles from "./lottery-chance.module.css";

const LOTTERIES = ["daily-dime", "lucky-shot", "holy-grail"];

function initialize() {
	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (page !== "page") return;

		const sid = new URL(xhr.responseURL).searchParams.get("sid");
		if (!isLotteryData(sid, json)) return;

		updateChances(lotteryTickets(json));
	});
}

function updateChances(data: { id: string; owned: number; total: number }[]) {
	for (const id of LOTTERIES) {
		const description = findElement(`#${id} .desc`);

		const ticketData = data.find((item) => item.id === id);
		if (!ticketData) continue;

		const { owned, total } = ticketData;
		const chance = (owned / total) * 100;

		const text = `Current Chance: ${chance.toFixed(6)}%`;

		const display = findElement(`.${styles.lotteryChance}`, description, true);
		if (display) {
			if (display.textContent !== text) display.textContent = text;
		} else {
			description.appendChild(
				elementBuilder({
					type: "div",
					class: styles.lotteryChance,
					text,
				}),
			);
		}
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
		initialize();
	}
}
