import { DisabledUntilNoticeFeature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { getPageStatus, isAbroad } from "@/utils/common/functions/torn";

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
