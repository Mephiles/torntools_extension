/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 *
 * Applicable to almost everything beyond this point.
 */

import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { type ScouterService, scouterService } from "@/features/ff-scouter/ff-scouter";
import { settings } from "@/utils/common/data/database";
import { displayAlert } from "@/utils/common/functions/alerts";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { getPage } from "@/utils/common/functions/torn";

let SCOUTER_SERVICE: ScouterService;
let BLUE_ARROW: string, GREEN_ARROW: string, RED_ARROW: string;

let rafId: number | null = null;
let scoutLock = false;
let lockFailure = false;

function initialise() {
	new MutationObserver((mutations) => {
		if (!FEATURE_MANAGER.isEnabled(FFScouterGaugeFeature)) return;

		if (!mutations.some((mutation) => mutation.addedNodes.length > 0)) return;

		safeTriggerGauge();
	}).observe(document.body, { childList: true, subtree: true });
}

let lastProcessTime = 0;
const PROCESS_THROTTLE = 100;

function safeTriggerGauge() {
	if (rafId) return;

	const now = Date.now();
	if (now - lastProcessTime < PROCESS_THROTTLE) {
		rafId = requestAnimationFrame(() => {
			rafId = null;
			triggerGauge();
		});
	} else {
		triggerGauge();
	}
	lastProcessTime = now;
}

const SELECTORS = new Map<string, string>([
	["factions", ".member"],
	["companies", ".employee"],
	["joblist", ".employee"],
	["messages", ".name"],
	["abroad-people", ".name"],
	["hospital", ".name"],
	["userlist", ".name"],
	["bounties", ".target, .listed"],
	["forums", ".last-poster, .starter, .last-post,.poster"],
	["hof", "[class^='userInfoBox__']"],
	["russianroulette", "[class^='rowsWrap___'] [class*='userInfoBox___']"],
	["enemies", "[class*='name___'] [class*='honorWrap___']"],
	["friends", "[class*='name___'] [class*='honorWrap___']"],
	["targets", "[class*='name___'] [class*='honorWrap___']"],
]);

function triggerGauge() {
	if (scoutLock) return;
	scoutLock = true;

	let elements = findAllElements<HTMLAnchorElement>(".honor-text-wrap");
	if (!elements.length) {
		const selector = SELECTORS.get(getPage());
		if (!selector) {
			scoutLock = false;
			return;
		}

		elements = findAllElements<HTMLAnchorElement>(selector);
	}

	applyGauge(elements)
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
}

interface GaugeElements {
	element: HTMLElement;
	id: string;
}

function applyGauge(e: HTMLAnchorElement[]) {
	const elements = e
		.filter((element) => !element.classList.contains("tt-ff-scouter-indicator"))
		.map<GaugeElements>((element) => ({ element, id: extractPlayerId(element) }))
		.filter(({ id }) => id);
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
						const arrow = percent < 33 ? BLUE_ARROW : percent < 66 ? GREEN_ARROW : RED_ARROW;

						element.appendChild(
							elementBuilder({
								type: "img",
								class: "tt-ff-scouter-arrow",
								attributes: { src: arrow },
							}),
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

function extractPlayerId(element: HTMLAnchorElement): string | null {
	if (element.nodeName.toLowerCase() === "a") {
		const match = element.href?.match(/.*XID=(?<target_id>\d+)/);
		if (match) return match.groups.target_id;
	}

	const parent = element.parentElement as HTMLAnchorElement;
	if (parent?.href) {
		const match = parent.href.match(/.*XID=(?<target_id>\d+)/);
		if (match) return match.groups.target_id;
	}

	const anchor = element.querySelector("a");
	if (anchor?.href) {
		const match = anchor.href.match(/.*XID=(?<target_id>\d+)/);
		if (match) return match.groups.target_id;
	}

	return null;
}

function convertFFToPercentage(ff: number) {
	ff = Math.min(ff, 8);
	if (ff < 2) return (ff - 1) * 33;
	if (ff < 4) return (ff - 2) * 16.5 + 33;
	return (ff - 4) * 12.5 + 66;
}

function removeGauge() {
	if (rafId) cancelAnimationFrame(rafId);
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
		SCOUTER_SERVICE = await scouterService();
		BLUE_ARROW = browser.runtime.getURL("/images/svg-icons/blue-arrow.svg");
		GREEN_ARROW = browser.runtime.getURL("/images/svg-icons/green-arrow.svg");
		RED_ARROW = browser.runtime.getURL("/images/svg-icons/red-arrow.svg");
		initialise();
	}

	execute() {
		safeTriggerGauge();
	}

	cleanup() {
		removeGauge();
	}

	storageKeys(): string[] {
		return ["settings.scripts.ffScouter.gauge", "settings.external.ffScouter"];
	}
}
