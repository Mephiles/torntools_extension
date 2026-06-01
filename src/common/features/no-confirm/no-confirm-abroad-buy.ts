import { DisabledUntilNoticeFeature } from "@features/feature";
import { settings } from "@utils/data/database";
import { isAbroad } from "@utils/functions/torn";

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
