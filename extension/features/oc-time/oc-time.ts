import { Feature } from "@/features/feature-manager";
import { hasAPIData, hasOC1Data } from "@/utils/common/functions/api";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@/utils/common/functions/dom";
import { factiondata, settings, userdata } from "@/utils/common/data/database";
import { requireSidebar } from "@/utils/common/functions/requires";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { formatTime, type FormatTimeOptions } from "@/utils/common/functions/formatting";
import { countdownTimers } from "@/utils/common/functions/timers";
import { LINKS } from "@/utils/common/functions/torn";

async function showTimer() {
	await requireSidebar();

	removeTimer();
	await addInformationSection();
	showInformationSection();

	const userCrime = "userCrime" in factiondata ? factiondata.userCrime : userdata.userCrime;
	const timeLeft = userCrime - Date.now();

	const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });
	if (userCrime === -1) {
		timeLeftElement.textContent = "No active OC.";
	} else {
		if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
		else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

		if (timeLeft > 0) {
			const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
			timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

			timeLeftElement.dataset.end = userCrime.toString();
			timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
			countdownTimers.push(timeLeftElement);
		} else {
			timeLeftElement.textContent = "Ready";
		}
	}

	document.querySelector(".tt-sidebar-information").appendChild(
		elementBuilder({
			type: "section",
			id: "ocTimer",
			children: [elementBuilder({ type: "a", class: "title", text: "OC: ", href: LINKS.organizedCrimes }), timeLeftElement],
			style: { order: "1" },
		})
	);
}

function removeTimer() {
	const timer = document.querySelector("#ocTimer");
	if (timer) timer.remove();
}

export default class OCTimeFeature extends Feature {
	constructor() {
		super("OC Time", "sidebar");
	}

	async precondition() {
		return (await checkDevice()).hasSidebar;
	}

	async requirements() {
		if (!hasAPIData() || !((settings.apiUsage.user.icons && userdata.userCrime) || "userCrime" in factiondata)) return "No API access.";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.ocTimer && !!userdata?.faction;
	}

	async execute() {
		await showTimer();
	}

	cleanup() {
		removeTimer();
	}

	storageKeys() {
		return ["settings.pages.sidebar.ocTimer", "factiondata.userCrime", "userdata.userCrime"];
	}
}
