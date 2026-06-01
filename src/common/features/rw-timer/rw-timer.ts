import { Feature } from "@features/feature";
import { factiondata, settings, userdata } from "@utils/data/database";
import type { FetchedFactiondataBasic } from "@utils/data/fetched-data";
import { hasAPIData, hasOC2Data } from "@utils/functions/api";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@utils/functions/dom";
import { type FormatTimeOptions, formatTime } from "@utils/functions/formatting";
import { requireSidebar } from "@utils/functions/requires";
import { countdownTimers } from "@utils/functions/timers";
import { isPageWithSidebar, LINKS } from "@utils/functions/torn";
import { TO_MILLIS } from "@utils/functions/utilities";

async function showTimer() {
	if (factiondata.access === "none") return;

	await requireSidebar();

	removeTimer();
	await addInformationSection();
	showInformationSection();

	const hasRWPlanned = !!factiondata.rankedwars.find((w) => w.end === 0);
	if (!hasRWPlanned) return;

	document.querySelector(".tt-sidebar-information").appendChild(
		elementBuilder({
			type: "section",
			id: "rwTimer",
			children: [
				elementBuilder({
					type: "a",
					class: "title",
					text: "RW: ",
					href: LINKS.faction__ranked_war,
				}),
				buildTimeLeftElement(factiondata),
			],
			style: { order: "3" },
		}),
	);
}

function buildTimeLeftElement(data: FetchedFactiondataBasic) {
	const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });
	const now = Date.now();

	const war = data.rankedwars[0];

	const startAt = war.start * TO_MILLIS.SECONDS;
	if (war.end !== 0) {
		// Filtered out before we call this function.
		timeLeftElement.textContent = `Unexpected, please report!`;
	} else if (startAt > now) {
		const timeLeft = startAt - now;

		if (timeLeft <= TO_MILLIS.HOURS) timeLeftElement.classList.add("short");
		else if (timeLeft <= TO_MILLIS.HOURS * 6) timeLeftElement.classList.add("medium");

		const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
		timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

		timeLeftElement.dataset.end = startAt.toString();
		timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
		timeLeftElement.dataset.doneText = "Ongoing";
		countdownTimers.push(timeLeftElement);
	} else {
		timeLeftElement.textContent = `Ongoing`;
		timeLeftElement.classList.add("short");
	}

	return timeLeftElement;
}

function removeTimer() {
	document.querySelector("#rwTimer")?.remove();
}

export default class RWTimerFeature extends Feature {
	constructor() {
		super("RW Timer", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!hasOC2Data()) return "No OC 2 data.";
		else if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.rwTimer && !!userdata?.faction;
	}

	async execute() {
		await showTimer();
	}

	cleanup() {
		removeTimer();
	}

	storageKeys() {
		return ["settings.pages.sidebar.rwTimer"];
	}
}
