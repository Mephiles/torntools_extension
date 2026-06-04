import { settings } from "@common/utils/data/database";
import { getPageStatus, isAbroad } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@extension/context/feature-manager";

export default class TravelFillMaxFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Travel Fill Max", "travel");
	}

	precondition() {
		return getPageStatus().access && isAbroad();
	}

	isEnabled(): boolean {
		return settings.pages.travel.fillMax;
	}
}
