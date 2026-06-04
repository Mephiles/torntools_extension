import { factiondata, settings, userdata } from "@common/utils/data/database";
import { hasAPIData, hasOC1Data } from "@common/utils/functions/api";
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
		}),
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

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData() || !((settings.apiUsage.user.icons && userdata.userCrime) || "userCrime" in factiondata)) return "No API access.";
		else if (!hasOC1Data()) return "No OC 1 data.";
		else if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

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
