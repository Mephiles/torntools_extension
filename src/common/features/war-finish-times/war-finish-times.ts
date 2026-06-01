import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import "./war-finish-times.css";
import { isInternalFaction } from "@common/pages/factions-page";

import { settings } from "@utils/data/database";
import { elementBuilder, findAllElements } from "@utils/functions/dom";
import { formatDate, formatTime, textToTime } from "@utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";

function startListeners() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(async () => {
			if (FEATURE_MANAGER.isEnabled(WarFinishTimesFeature)) await addFinishTimes();
		});
	}
}

async function addFinishTimes() {
	if (isInternalFaction && !document.querySelector(".faction-description")) return;

	await requireElement("#react-root .f-war-list");

	for (const timer of findAllElements(".status-wrap .timer:not(.tt-modified)")) {
		const millis = Date.now() + textToTime(timer.textContent);

		timer.insertAdjacentElement("afterend", elementBuilder({ type: "div", class: "tt-timer", text: `${formatTime(millis)} ${formatDate(millis)}` }));
		timer.classList.add("tt-modified");
	}
}

function removeFunction() {
	findAllElements(".f-war-list.war-new .status-wrap .tt-timer").forEach((timer) => timer.remove());
}

export default class WarFinishTimesFeature extends Feature {
	constructor() {
		super("War Finish Times", "faction");
	}

	isEnabled() {
		return settings.pages.faction.warFinishTimes;
	}

	storageKeys(): string[] {
		return ["settings.pages.faction.warFinishTimes"];
	}

	initialise() {
		startListeners();
	}

	async execute() {
		await addFinishTimes();
	}

	cleanup() {
		removeFunction();
	}
}
