/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 *
 * Applicable to almost everything beyond this point.
 */

import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { displayAlert } from "@common/utils/functions/alerts";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements, isElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { getPage } from "@common/utils/functions/torn";
import { isTabFocused } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import { type ScouterService, scouterService } from "@features/ff-scouter/ff-scouter";

let SCOUTER_SERVICE: ScouterService;
let BLUE_ARROW: string, GREEN_ARROW: string, RED_ARROW: string;

let pageSelector: string | null;

let scoutLock = false;
let lockFailure = false;

function initialise() {
	new MutationObserver((mutations) => {
		if (!FEATURE_MANAGER.isEnabled(FFScouterGaugeFeature)) return;

		const hasRelevantNodes = mutations.some(
			(mutation) =>
				mutation.addedNodes.length > 0 &&
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.some((element) => element.matches(pageSelector) || element.querySelector(pageSelector)),
		);
		if (!hasRelevantNodes) return;

		safeTriggerGauge();
	}).observe(document.body, { childList: true, subtree: true });
	addCustomListener(EVENT_CHANNELS.WINDOW__FOCUS, () => {
		if (!FEATURE_MANAGER.isEnabled(FFScouterGaugeFeature)) return;

		safeTriggerGauge();
	});
}

let rafId: number | null = null;
let lastTriggerTime = 0;
const TRIGGER_THROTTLE = 200;

function safeTriggerGauge() {
	if (!isTabFocused()) return;

	const now = Date.now();
	if (now - lastTriggerTime < TRIGGER_THROTTLE || rafId) return;

	rafId = requestAnimationFrame(() => {
		rafId = null;
		triggerGauge();
	});
	lastTriggerTime = now;
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
		if (!elements.length) {
			scoutLock = false;
			return;
		}
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
	if (lockFailure) return Promise.reject(null);

	const elements: Array<GaugeElements> = e
		.filter((el) => !el.classList.contains("tt-ff-scouter-indicator"))
		.map((element) => ({ element, id: extractPlayerId(element) }))
		.filter(({ id }) => !!id);
	if (!elements.length) return Promise.resolve();

	return processBatches(elements);
}

const BATCH_SIZE = 10;
const BATCH_DELAY = 10;

function processBatches(elementsWithIds: GaugeElements[]): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let currentBatch = 0;
		const totalBatches = Math.ceil(elementsWithIds.length / BATCH_SIZE);

		const processNextBatch = () => {
			if (currentBatch >= totalBatches) {
				triggerCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE);
				resolve();
				return;
			}

			const startIdx = currentBatch * BATCH_SIZE;
			const endIdx = Math.min(startIdx + BATCH_SIZE, elementsWithIds.length);
			const batch = elementsWithIds.slice(startIdx, endIdx);

			SCOUTER_SERVICE.scoutGroup(batch.map(({ id }) => id))
				.then((scouts) => {
					const updates: Array<() => void> = [];

					for (const { element, id } of batch) {
						element.classList.add("tt-ff-scouter-indicator");

						if (!element.classList.contains("indicator-lines")) {
							updates.push(() => {
								element.classList.remove("small", "big");
								element.classList.add("indicator-lines");
								element.style.setProperty("--arrow-width", "20px");
							});
						}

						const ff = id in scouts && "fair_fight" in scouts[id] ? scouts[id].fair_fight : null;
						if (ff) {
							const percent = convertFFToPercentage(ff);
							const arrow = percent < 33 ? BLUE_ARROW : percent < 66 ? GREEN_ARROW : RED_ARROW;

							updates.push(() => {
								element.style.setProperty("--band-percent", percent.toString());
								element.querySelector(".tt-ff-scouter-arrow")?.remove();
								element.appendChild(
									elementBuilder({
										type: "img",
										class: "tt-ff-scouter-arrow",
										attributes: { src: arrow },
									}),
								);
								element.dataset.ffScout = ff.toString();
							});
						}
					}

					requestAnimationFrame(() => {
						updates.forEach((update) => update());
						currentBatch++;

						setTimeout(processNextBatch, BATCH_DELAY);
					});
				})
				.catch((reason) => {
					lockFailure = true;
					reject(reason);
				});
		};

		processNextBatch();
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
	if (rafId) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
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

	initialise() {
		SCOUTER_SERVICE = scouterService();
		BLUE_ARROW = browser.runtime.getURL("/images/svg-icons/blue-arrow.svg");
		GREEN_ARROW = browser.runtime.getURL("/images/svg-icons/green-arrow.svg");
		RED_ARROW = browser.runtime.getURL("/images/svg-icons/red-arrow.svg");
		pageSelector = SELECTORS.get(getPage());
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
