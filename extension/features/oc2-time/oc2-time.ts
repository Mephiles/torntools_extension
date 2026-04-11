import type { FactionCrime } from "tornapi-typescript";
import { Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData, hasOC2Data } from "@/utils/common/functions/api";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@/utils/common/functions/dom";
import { type FormatTimeOptions, formatTime } from "@/utils/common/functions/formatting";
import { requireSidebar } from "@/utils/common/functions/requires";
import { countdownTimers } from "@/utils/common/functions/timers";
import { LINKS } from "@/utils/common/functions/torn";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

async function showTimer() {
	await requireSidebar();

	removeTimer();
	await addInformationSection();
	showInformationSection();

	const elements: Element[] = [];

	const inCrime = userdata.organizedCrime !== null ? ["Recruiting", "Planning"].includes((userdata.organizedCrime as FactionCrime).status) : false;
	if (inCrime) {
		elements.push(buildTimeLeftElement());
		if (settings.pages.sidebar.oc2TimerPosition) {
			elements.push(elementBuilder({ type: "span", text: " - " }));
			elements.push(buildPositionElement());
		}
		if (settings.pages.sidebar.oc2TimerLevel) {
			elements.push(buildLevelElement());
		}
	} else {
		elements.push(elementBuilder({ type: "span", class: "countdown", text: "No crime joined." }));
	}

	document.querySelector(".tt-sidebar-information").appendChild(
		elementBuilder({
			type: "section",
			id: "oc2Timer",
			children: [
				elementBuilder({
					type: "a",
					class: "title",
					text: "OC: ",
					href: LINKS.organizedCrimes,
				}),
				...elements,
			],
			style: { order: "1" },
		}),
	);
}

function buildTimeLeftElement() {
	const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });
	const now = Date.now();
	let readyAt: number;
	// Torn's ready_at value corresponds to the planning finish time for currently joined members
	// If the OC is partially filled it will not provide an accurate end time (i.e. when it will initiate)

	// Count the missing members
	const missingMembers = (userdata.organizedCrime as FactionCrime).slots.filter(({ user }) => user === null).length;

	// Add 24 hours for every missing member
	// The result is that this now provides the earliest projected end/initiation time
	if (missingMembers > 0) {
		const missingTime = TO_MILLIS.DAYS * missingMembers;
		readyAt = Math.max((userdata.organizedCrime as FactionCrime).ready_at * 1000 + missingTime, now + missingTime);
	} else {
		readyAt = (userdata.organizedCrime as FactionCrime).ready_at * 1000;
	}

	const timeLeft = readyAt - now;

	if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
	else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

	if (timeLeft > 0) {
		const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
		timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

		timeLeftElement.dataset.end = readyAt.toString();
		timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
		countdownTimers.push(timeLeftElement);
	} else {
		timeLeftElement.textContent = `Ready ${(userdata.organizedCrime as FactionCrime).status}`;
	}

	return timeLeftElement;
}

function buildPositionElement() {
	const position = (userdata.organizedCrime as FactionCrime).slots.find(({ user }) => user?.id === userdata.profile.id)?.position ?? "???";
	const name = (userdata.organizedCrime as FactionCrime).name;

	return elementBuilder({ type: "span", class: "position", text: `${position} in ${name}` });
}

function buildLevelElement() {
	const level = (userdata.organizedCrime as FactionCrime).difficulty;

	return elementBuilder({ type: "span", class: "position", text: ` (Lvl ${level})` });
}

function removeTimer() {
	document.querySelector("#oc2Timer")?.remove();
}

export default class OC2TimeFeature extends Feature {
	constructor() {
		super("OC2 Time", "sidebar");
	}

	async precondition() {
		return (await checkDevice()).hasSidebar;
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!hasOC2Data()) return "No OC 2 data.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.oc2Timer && !!userdata?.faction;
	}

	async execute() {
		await showTimer();
	}

	cleanup() {
		removeTimer();
	}

	storageKeys() {
		return [
			"settings.pages.sidebar.oc2Timer",
			"settings.pages.sidebar.oc2TimerPosition",
			"settings.pages.sidebar.oc2TimerLevel",
			"userdata.organizedCrime",
		];
	}
}
