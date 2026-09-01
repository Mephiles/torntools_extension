import "./clean-flight.css";
import { settings } from "@common/utils/data/database";
import { getPageStatus, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addCleanFlight() {
	document.querySelector("#travel-root")?.classList.add("tt-clean-flight");
}

export default class CleanFlightFeature extends Feature {
	constructor() {
		super("Clean Flight", "travel");
	}

	override precondition() {
		return getPageStatus().access && isFlying();
	}

	override isEnabled() {
		return settings.pages.travel.cleanFlight;
	}

	override async execute() {
		await addCleanFlight();
	}

	override storageKeys() {
		return ["settings.pages.travel.cleanFlight"];
	}
}
