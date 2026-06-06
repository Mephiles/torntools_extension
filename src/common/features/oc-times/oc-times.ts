import "./oc-times.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { factiondata, settings } from "@common/utils/data/database";
import { hasAPIData, hasOC1Data } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { formatDate, formatTime } from "@common/utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
		if (!FEATURE_MANAGER.isEnabled(OCTimesFeature)) return;

		showTimes();
	});
}

function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

	showTimes();
}

function showTimes() {
	let oldDate: boolean | string = false;

	for (const crime of findAllElements(".organize-wrap .crimes-list > .item-wrap")) {
		const details = crime.querySelector<HTMLElement>(".details-wrap");
		if (!details) continue;

		const id = details.dataset.crime;

		let text: string;
		if ("crimes" in factiondata && id in factiondata.crimes) {
			const finish = new Date(factiondata.crimes[id].time_ready * 1000);

			const date = formatDate(finish);
			if (oldDate !== date) {
				crime.insertAdjacentElement("beforebegin", elementBuilder({ type: "div", class: "tt-oc-time-date", text: date }));
				oldDate = date;
			}

			text = `${formatTime(finish)} | ${date}`;
		} else {
			text = "N/A";
		}

		crime.querySelector(".status").appendChild(elementBuilder({ type: "span", class: "tt-oc-time", text }));
	}
}

function removeTimes() {
	for (const timer of findAllElements(".tt-oc-time")) timer.remove();
}

export default class OCTimesFeature extends Feature {
	constructor() {
		super("OC Times", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.ocTimes;
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		startFeature();
	}

	cleanup() {
		removeTimes();
	}

	storageKeys() {
		return ["settings.pages.faction.ocTimes"];
	}

	async requirements() {
		if (!hasAPIData() || !factiondata || !("crimes" in factiondata) || !factiondata.crimes) return "No API access.";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}
}
