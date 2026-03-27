import { Feature } from "@/features/feature-manager";
import { isAbroad } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";

export default class NoConfirmAbroadBuyFeature extends Feature {
	constructor() {
		super("Abroad Buy No Confirm", "travel");
	}

	precondition() {
		return isAbroad();
	}

	isEnabled() {
		return settings.scripts.noConfirm.abroadItemBuy;
	}

	requirements() {
		return "Disabled until further notice.";
	}
}
