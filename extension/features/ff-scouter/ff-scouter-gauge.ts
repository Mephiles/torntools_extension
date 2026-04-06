/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 *
 * Applicable to almost everything beyond this point.
 */

import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { getPage } from "@/utils/common/functions/torn";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { type ScouterService, scouterService } from "@/features/ff-scouter/ff-scouter";
import { displayAlert } from "@/utils/common/functions/alerts";

let scoutLock = false;
let lockFailure = false;

let BLUE_ARROW: string, GREEN_ARROW: string, RED_ARROW: string;
let SCOUTER_SERVICE: ScouterService;

async function initialise() {
	SCOUTER_SERVICE = await scouterService();
	BLUE_ARROW = browser.runtime.getURL("/images/svg-icons/blue-arrow.svg");
	GREEN_ARROW = browser.runtime.getURL("/images/svg-icons/green-arrow.svg");
	RED_ARROW = browser.runtime.getURL("/images/svg-icons/red-arrow.svg");

	new MutationObserver(function () {
		if (!FEATURE_MANAGER.isEnabled(FFScouterGaugeFeature)) return;

		setTimeout(triggerGauge);
	}).observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
}

async function triggerGauge() {
	if (scoutLock) return;
	scoutLock = true;

	const honorBars = findAllElements<HTMLAnchorElement>(".honor-text-wrap");
	if (honorBars.length > 0) {
		applyGauge(honorBars)
			.catch((reason) => {
				if (!reason) return;

				if ("error" in reason) {
					displayAlert({
						title: "FFScouter Failure",
						text: reason.error,
						type: "error",
					});
				}

				console.error("TT - Failed to scout ff for the honor bars.", reason);
			})
			.finally(() => (scoutLock = false));
	} else {
		let selector: string;

		switch (getPage()) {
			case "factions":
				selector = ".member";
				break;
			case "companies":
			case "joblist":
				selector = ".employee";
				break;
			case "messages":
			case "abroad-people":
			case "hospital":
			case "userlist":
				selector = ".name";
				break;
			case "bounties":
				selector = ".target, .listed";
				break;
			case "forums":
				selector = ".last-poster, .starter, .last-post,.poster";
				break;
			case "hof":
				selector = "[class^='userInfoBox__']";
				break;
			case "russianroulette":
				selector = "[class^='rowsWrap___'] [class*='userInfoBox___']";
				break;
			case "enemies":
			case "friends":
			case "targets":
				selector = "[class*='name___'] [class*='honorWrap___']";
				break;
			default:
				scoutLock = false;
				return;
		}

		applyGauge(findAllElements<HTMLAnchorElement>(selector))
			.catch((reason) => {
				if (!reason) return;

				console.error("TT - Failed to scout ff for the honor bars.", reason);
			})
			.finally(() => (scoutLock = false));
	}
}

interface GaugeElements {
	element: HTMLElement;
	id: string;
}

function applyGauge(e: HTMLAnchorElement[]) {
	const elements = e
		.filter((element) => !element.classList.contains("tt-ff-scouter-indicator"))
		.map<GaugeElements>((element) => ({ element, id: extractPlayerId(element) }))
		.filter(({ id }) => !!id);
	if (elements.length === 0) return Promise.resolve();

	if (lockFailure) return Promise.reject(null);

	return new Promise<void>((resolve, reject) => {
		SCOUTER_SERVICE.scoutGroup(elements.map(({ id }) => id))
			.then((scouts) => {
				for (const { element, id } of elements) {
					element.classList.add("tt-ff-scouter-indicator");
					if (!element.classList.contains("indicator-lines")) {
						element.classList.remove("small", "big");
						element.classList.add("indicator-lines");
						element.style.setProperty("--arrow-width", "20px");
					}

					const ff = id in scouts && "fair_fight" in scouts[id] ? scouts[id].fair_fight : null;
					if (ff) {
						const percent = convertFFToPercentage(ff);
						element.style.setProperty("--band-percent", percent.toString());

						element.querySelector(".tt-ff-scouter-arrow")?.remove();

						let arrow: string;
						if (percent < 33) {
							arrow = BLUE_ARROW;
						} else if (percent < 66) {
							arrow = GREEN_ARROW;
						} else {
							arrow = RED_ARROW;
						}

						element.appendChild(
							elementBuilder({
								type: "img",
								class: "tt-ff-scouter-arrow",
								attributes: { src: arrow },
							})
						);
						element.dataset.ffScout = ff.toString();
					}
				}

				resolve();
			})
			.then(() => triggerCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE))
			.catch((reason) => {
				lockFailure = true;
				reject(reason);
			});
	});
}

function extractPlayerId(element: HTMLAnchorElement) {
	const match = (element.parentElement as HTMLAnchorElement)?.href?.match(/.*XID=(?<target_id>\d+)/);
	if (match) {
		return match.groups.target_id;
	}

	const anchors = element.getElementsByTagName("a");

	for (const anchor of anchors) {
		const match = anchor.href.match(/.*XID=(?<target_id>\d+)/);
		if (match) {
			return match.groups.target_id;
		}
	}

	if (element.nodeName.toLowerCase() === "a") {
		const match = element.href.match(/.*XID=(?<target_id>\d+)/);
		if (match) {
			return match.groups.target_id;
		}
	}

	return null;
}

function convertFFToPercentage(ff: number) {
	ff = Math.min(ff, 8);
	// There are 3 key areas, low, medium, high
	// Low is 1-2
	// Medium is 2-4
	// High is 4+
	// If we clip high at 8 then the math becomes easy
	// The percent is 0-33% 33-66% 66%-100%
	const lowPoint = 2;
	const highPoint = 4;
	const lowMidPercent = 33;
	const midHighPercent = 66;

	let percent: number;
	if (ff < lowPoint) {
		percent = ((ff - 1) / (lowPoint - 1)) * lowMidPercent;
	} else if (ff < highPoint) {
		percent = ((ff - lowPoint) / (highPoint - lowPoint)) * (midHighPercent - lowMidPercent) + lowMidPercent;
	} else {
		percent = ((ff - highPoint) / (8 - highPoint)) * (100 - midHighPercent) + midHighPercent;
	}

	return percent;
}

function removeGauge() {
	findAllElements(".tt-ff-scouter-indicator").forEach((element) => element.classList.remove("tt-ff-scouter-indicator"));
	findAllElements(".tt-ff-scouter-arrow").forEach((element) => element.remove());
}

export default class FFScouterGaugeFeature extends Feature {
	constructor() {
		super("FF Scouter Gauge", "ff-scouter");
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.ffScouter) return "FFScouter not enabled.";

		return true;
	}

	isEnabled(): boolean {
		return settings.scripts.ffScouter.gauge;
	}

	async initialise() {
		await initialise();
	}

	execute() {
		setTimeout(triggerGauge);
	}

	cleanup() {
		removeGauge();
	}

	storageKeys(): string[] {
		return ["settings.scripts.ffScouter.gauge", "settings.external.ffScouter"];
	}
}
