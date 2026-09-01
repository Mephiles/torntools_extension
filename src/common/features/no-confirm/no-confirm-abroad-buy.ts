import { settings } from "@common/utils/data/database";
import { isAbroad } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@features/feature";

export default class NoConfirmAbroadBuyFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Abroad Buy No Confirm", "travel");
	}

	override precondition() {
		return isAbroad();
	}

	override isEnabled() {
		return settings.scripts.noConfirm.abroadItemBuy;
	}
}
