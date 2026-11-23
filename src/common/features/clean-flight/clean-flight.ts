import { settings } from "@common/utils/data/database";
import { findElement } from "@common/utils/functions/find-elements";
import { getPageStatus, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./clean-flight.module.css";

async function addCleanFlight() {
	findElement("#travel-root", true)?.classList.add(styles.cleanFlight);
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
