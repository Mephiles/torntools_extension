"use strict";

/*
 * Credits to rDacted [2670953] (https://www.torn.com/profiles.php?XID=2670953).
 *
 * Applicable to almost everything beyond this point.
 */

(async () => {
	if (!getPageStatus().access) return;

	const BLUE_ARROW = chrome.runtime.getURL("resources/images/svg-icons/blue-arrow.svg");
	const GREEN_ARROW = chrome.runtime.getURL("resources/images/svg-icons/green-arrow.svg");
	const RED_ARROW = chrome.runtime.getURL("resources/images/svg-icons/red-arrow.svg");

	let scoutLock = false;
	let lockFailure = false;

	const feature = featureManager.registerFeature(
		"FF Scouter Gauge",
		"ff-scouter",
		() => settings.scripts.ffScouter.gauge,
		initialise,
		() => setTimeout(triggerGauge),
		removeGauge,
		{
			storage: ["settings.scripts.ffScouter.gauge", "settings.external.ffScouter"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.ffScouter) return "FFScouter not enabled.";
		}
	);

	function initialise() {
		new MutationObserver(function () {
			if (!feature.enabled()) return;

			setTimeout(triggerGauge);
		}).observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
	}

	async function triggerGauge() {
		if (scoutLock) return;
		scoutLock = true;

		const honorBars = [...document.findAll(".honor-text-wrap")];
		if (honorBars.length > 0) {
			applyGauge(honorBars)
				.catch((reason) => {
					if (!reason) return;

					console.error("TT - Failed to scout ff for the honor bars.", reason);
				})
				.finally(() => (scoutLock = false));
		} else {
			let selector;

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

			applyGauge([...document.findAll(selector)])
				.catch((reason) => {
					if (!reason) return;

					console.error("TT - Failed to scout ff for the honor bars.", reason);
				})
				.finally(() => (scoutLock = false));
		}
	}

	function applyGauge(elements) {
		elements = elements
			.filter((element) => !element.classList.contains("tt-ff-scouter-indicator"))
			.map((element) => ({ element, id: extractPlayerId(element) }))
			.filter(({ id }) => !!id);
		if (elements.length === 0) return Promise.resolve();

		if (lockFailure) return Promise.reject();

		return new Promise((resolve, reject) => {
			scoutFFGroup(elements.map(({ id }) => id))
				.then((scouts) => {
					for (const { element, id } of elements) {
						element.classList.add("tt-ff-scouter-indicator");
						if (!element.classList.contains("indicator-lines")) {
							element.classList.remove("small", "big");
							element.classList.add("indicator-lines");
							element.style.setProperty("--arrow-width", "20px");
						}

						const ff = scouts[id].fair_fight;
						if (ff) {
							const percent = convertFFToPercentage(ff);
							element.style.setProperty("--band-percent", percent);

							element.find(".tt-ff-scouter-arrow")?.remove();

							let arrow;
							if (percent < 33) {
								arrow = BLUE_ARROW;
							} else if (percent < 66) {
								arrow = GREEN_ARROW;
							} else {
								arrow = RED_ARROW;
							}

							element.appendChild(
								document.newElement({
									type: "img",
									class: "tt-ff-scouter-arrow",
									attributes: { src: arrow },
								})
							);
						}
					}

					resolve();
				})
				.catch((reason) => {
					lockFailure = true;
					reject(reason);
				});
		});
	}

	function extractPlayerId(element) {
		const match = element.parentElement?.href?.match(/.*XID=(?<target_id>\d+)/);
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

	function convertFFToPercentage(ff) {
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

		let percent;
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
		document.findAll(".tt-ff-scouter-indicator").forEach((element) => element.classList.remove("tt-ff-scouter-indicator"));
		document.findAll(".tt-ff-scouter-arrow").forEach((element) => element.remove());
	}
})();
