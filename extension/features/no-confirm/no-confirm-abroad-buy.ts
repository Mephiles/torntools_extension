import { DisabledUntilNoticeFeature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { isAbroad } from "@/utils/common/functions/torn";

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
