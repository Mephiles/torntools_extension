import "./casino-net-total.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPage, getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { formatNumber } from "@/utils/common/functions/formatting";

const page = getPage();

function initialiseListener() {
	if (isBookie()) {
		window.addEventListener("hashchange", async () => {
			if (FEATURE_MANAGER.isEnabled(CasinoNetTotalFeature) && location.hash.includes("stats/")) {
				await addTotal();
			}
		});
	}
}

async function addTotal() {
	if (isBookie() && !location.hash.includes("stats/")) return;

	for (const statsType of ["overall", "your"]) {
		if (statsType === "overall" && hasOnlyPersonalStats()) continue;

		await requireElement(`#${statsType}-stats .stat-value`);
		const moneyElementsList = document.evaluate(
			`//div[contains(@id,"${statsType}-stats")]
				//li
					[
						(contains(text(), "Total money won") or contains(text(), "Total money gain"))
						or
						(contains(text(), "Total money lost") or contains(text(), "Total money loss"))
					]
						/following-sibling::li[(contains(@class, "stat-value"))]`,
			document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		if (moneyElementsList.snapshotLength !== 2) continue;
		const totalWon = parseInt(moneyElementsList.snapshotItem(0).textContent.replace(/[$, ]/g, ""));
		const totalLostElement = moneyElementsList.snapshotItem(1);
		if (!isElement(totalLostElement)) return;

		const totalLost = parseInt(totalLostElement.textContent.replace(/[$, ]/g, ""));

		if (document.querySelector(`.${statsType}-stats-wrap .tt-net-total`)) return;

		await requireElement(`.stats-wrap .${statsType}-stats-wrap .stat`);
		totalLostElement.closest("li:not(.stat-value)").insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "ul",
				class: ["tt-net-total", isBookie() ? "bookie" : null, isPoker() ? "poker" : null],
				children: [
					elementBuilder({ type: "li", class: "name", text: "Net total" }),
					elementBuilder({ type: "li", class: "value", text: formatNumber(totalWon - totalLost, { currency: true }) }),
				],
			})
		);
	}

	function hasOnlyPersonalStats() {
		return ["russianroulettestatistics", "holdemstats"].includes(page);
	}

	function isPoker() {
		return page === "holdemstats";
	}
}

function isBookie() {
	return page === "bookie";
}

function removeTotal() {
	findAllElements(".tt-net-total").forEach((x) => x.remove());
}

export default class CasinoNetTotalFeature extends Feature {
	constructor() {
		super("Casino Net Total", "casino");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.casino.netTotal;
	}

	initialise() {
		initialiseListener();
	}

	async execute() {
		await addTotal();
	}

	cleanup() {
		removeTotal();
	}

	storageKeys() {
		return ["settings.pages.casino.netTotal"];
	}
}
