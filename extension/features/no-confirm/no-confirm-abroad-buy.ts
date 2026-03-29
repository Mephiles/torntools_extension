import { DisabledUntilNoticeFeature, Feature } from "@/features/feature-manager";
import { isAbroad } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";

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
