import { Feature } from "@/features/feature-manager";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@/utils/common/functions/dom";
import { hasAPIData } from "@/utils/common/functions/api";
import { settings, userdata } from "@/utils/common/data/database";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { formatTime, FormatTimeOptions } from "@/utils/common/functions/formatting";
import { countdownTimers } from "@/utils/common/functions/timers";
import { requireSidebar } from "@/utils/common/functions/requires";
import { LINKS } from "@/utils/common/functions/torn";

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
		})
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

	async precondition() {
		return (await checkDevice()).hasSidebar;
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.virus) return "No API access.";

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
