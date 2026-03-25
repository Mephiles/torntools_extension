import "./abroad-energy-warning.css";
import { Feature } from "@features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { getPageStatus, isAbroad } from "@/utils/common/functions/torn";

export default class AbroadEnergyWarningFeature extends Feature {
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

	requirements() {
		return "Disabled until further notice.";
	}
}
