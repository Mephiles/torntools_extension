import "./abroad-energy-warning.css";
import { settings } from "@common/utils/data/database";
import { getPageStatus, isAbroad } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@features/feature";

export default class AbroadEnergyWarningFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Abroad Energy Warning", "travel");
	}

	override precondition() {
		return isAbroad() && getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.travel.energyWarning;
	}

	override storageKeys() {
		return ["settings.pages.travel.energyWarning"];
	}
}
