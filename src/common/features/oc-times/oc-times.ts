import "./oc-times.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { factiondata, settings } from "@common/utils/data/database";
import { hasAPIData, hasOC1Data } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatDate, formatTime } from "@common/utils/functions/formatting";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, () => {
		if (!FEATURE_MANAGER.isEnabled(OCTimesFeature)) return;

		showTimes();
	});
}

function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	showTimes();
}

function showTimes() {
	let oldDate: boolean | string = false;

	for (const crime of findAllElements(".organize-wrap .crimes-list > .item-wrap")) {
		const details = findElement(".details-wrap", crime, true);
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

		findElement(".status", crime).appendChild(elementBuilder({ type: "span", class: "tt-oc-time", text }));
	}
}

export default class OCTimesFeature extends Feature {
	constructor() {
		super("OC Times", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.ocTimes;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.ocTimes"];
	}

	override async requirements() {
		if (!hasAPIData() || !factiondata || !("crimes" in factiondata) || !factiondata.crimes) return "No API access.";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}
}
