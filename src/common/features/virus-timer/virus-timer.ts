import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@common/utils/functions/dom";
import { type FormatTimeOptions, formatTime } from "@common/utils/functions/formatting";
import { requireSidebar } from "@common/utils/functions/requires";
import { countdownTimers } from "@common/utils/functions/timers";
import { isPageWithSidebar, LINKS } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@extension/context/feature-manager";

async function showTimer() {
	await requireSidebar();

	removeTimer();
	await addInformationSection();
	showInformationSection();

	document.querySelector(".tt-sidebar-information").appendChild(
		elementBuilder({
			type: "section",
			id: "virusTimer",
			children: [
				elementBuilder({
					type: "a",
					class: "title",
					text: "Virus: ",
					href: LINKS.pc,
				}),
				buildTimeLeftElement(),
			],
			style: { order: "5" },
		}),
	);
}

function buildTimeLeftElement() {
	const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });

	const readyAt: number = (userdata.virus?.until ?? 0) * 1000;
	const timeLeft = readyAt - Date.now();

	if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
	else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

	if (timeLeft > 0) {
		const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
		timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

		timeLeftElement.dataset.end = readyAt.toString();
		timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
		countdownTimers.push(timeLeftElement);
	} else {
		timeLeftElement.textContent = `Ready`;
	}

	return timeLeftElement;
}

function removeTimer() {
	document.querySelector("#virusTimer")?.remove();
}

export default class VirusTimerFeature extends Feature {
	constructor() {
		super("Virus Timer", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.virus) return "No API access.";
		else if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.virusTimer;
	}

	storageKeys() {
		return ["settings.pages.sidebar.virusTimer"];
	}

	async execute() {
		await showTimer();
	}

	cleanup() {
		removeTimer();
	}
}
