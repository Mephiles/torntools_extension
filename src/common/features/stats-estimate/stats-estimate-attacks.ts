import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, getSearchParameters, mobile, tablet } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import type { PersonalStatsCrimesV1, PersonalStatsCrimesV2 } from "tornapi-typescript";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Attacks", false);

async function showEstimate() {
	await requireElement("div[class*='textEntries___']");

	handleDefender();
	handleAttacker();

	function handleDefender() {
		const id = parseInt(getSearchParameters().get("user2ID"));

		statsEstimate
			.fetchEstimate(id)
			.then((estimate) => createElement(estimate, true, "defender"))
			.catch(() => {});
	}

	function handleAttacker() {
		if (settings.apiUsage.user.battlestats) {
			createElement(userdata.battlestats.total, false, "attacker");
		} else if (settings.apiUsage.user.personalstats && settings.apiUsage.user.crimes) {
			const {
				profile: {
					rank,
					level,
					last_action: { timestamp: lastAction },
					id,
				},
				personalstats: {
					networth: { total: networth },
					crimes: crimesStats,
				},
			} = userdata;

			let crimes: number;
			if (crimesStats.version === "v1") crimes = (crimesStats as PersonalStatsCrimesV1).total;
			else if (crimesStats.version === "v2") crimes = (crimesStats as PersonalStatsCrimesV2).offenses.total;

			const estimate = statsEstimate.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);

			createElement(estimate, true, "attacker");
		}
	}

	function createElement(stats: number, isEstimate: false, side: "attacker" | "defender"): void;
	function createElement(estimate: string, isEstimate: true, side: "attacker" | "defender"): void;
	function createElement(estimate: string | number, isEstimate: boolean, side: "attacker" | "defender") {
		let text: string;
		if (isEstimate && typeof estimate === "string") {
			text = mobile ? `Estimate: ${estimate.replace("under ", "<").replace("over ", ">")}` : `Stats Estimate: ${estimate}`;
		} else if (!Number.isNaN(parseInt(estimate.toString()))) {
			text = mobile ? `Stats: ${formatNumber(estimate, { shorten: 3, decimals: 1 })}` : `Battle Stats: ${formatNumber(estimate, { shorten: true })}`;
		} else throw "Not a correct estimate!";

		let entries: HTMLElement;
		if (mobile || tablet) {
			const sideColor = side === "attacker" ? "green___" : "rose___";
			entries = findElement(`div[class*='playersModelWrap___'] div[class*='headerWrapper___'][class*=${sideColor}] div[class*='textEntries___']`, true);
		} else {
			entries =
				side === "attacker"
					? findElement("div[class*='playersModelWrap___'] div[class*='player___']:first-child div[class*='textEntries___']", true)
					: findElement("div[class*='playersModelWrap___'] div[class*='player___']:nth-child(2) div[class*='textEntries___']", true);
		}

		entries.classList.add("tt-stats-estimate-attacks-wrapper");
		entries.insertAdjacentElement("afterbegin", elementBuilder({ type: "div", class: "tt-stats-estimate-attacks", text }));
	}
}

export default class StatsEstimateAttacksFeature extends Feature {
	constructor() {
		super("Stats Estimate Attacks", "attack");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.attacks;
	}

	override async execute() {
		await showEstimate();
	}

	override storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.attacks"];
	}
}
