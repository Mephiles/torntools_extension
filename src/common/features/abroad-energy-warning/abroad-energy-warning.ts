import "./abroad-energy-warning.css";
import { DisabledUntilNoticeFeature } from "@features/feature";
import { settings } from "@utils/data/database";
import { getPageStatus, isAbroad } from "@utils/functions/torn";

export default class AbroadEnergyWarningFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Abroad Energy Warning", "travel");
	}

	precondition() {
		return isAbroad() && getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.travel.energyWarning;
	}

	storageKeys() {
		return ["settings.pages.travel.energyWarning"];
	}
}
