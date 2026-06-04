import { settings } from "@common/utils/data/database";
import { isAbroad } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@features/feature";

export default class NoConfirmAbroadBuyFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Abroad Buy No Confirm", "travel");
	}

	precondition() {
		return isAbroad();
	}

	isEnabled() {
		return settings.scripts.noConfirm.abroadItemBuy;
	}
}
