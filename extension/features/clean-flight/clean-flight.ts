import "./clean-flight.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { getPageStatus, isFlying } from "@/utils/common/functions/torn";

async function addCleanFlight() {
	document.querySelector("#travel-root")?.classList.add("tt-clean-flight");
}

function removeCleanFlight() {
	document.querySelector(".tt-clean-flight")?.classList.remove("tt-clean-flight");
}

export default class CleanFlightFeature extends Feature {
	constructor() {
		super("Clean Flight", "travel");
	}

	precondition() {
		return getPageStatus().access && isFlying();
	}

	isEnabled() {
		return settings.pages.travel.cleanFlight;
	}

	async execute() {
		await addCleanFlight();
	}

	cleanup() {
		removeCleanFlight();
	}

	storageKeys() {
		return ["settings.pages.travel.cleanFlight"];
	}
}
