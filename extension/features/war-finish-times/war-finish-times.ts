import "./war-finish-times.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatDate, formatTime, textToTime } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

function startListeners() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(async () => {
			if (FEATURE_MANAGER.isEnabled(WarFinishTimesFeature)) await addFinishTimes();
		});
	}
}

async function addFinishTimes() {
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
