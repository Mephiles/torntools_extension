import { DisabledUntilNoticeFeature } from "@features/feature";
import { settings } from "@utils/data/database";
import { getPageStatus, isAbroad } from "@utils/functions/torn";

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
