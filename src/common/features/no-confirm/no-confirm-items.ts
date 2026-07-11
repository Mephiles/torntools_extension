import { settings } from "@common/utils/data/database";
import { executeScript } from "@common/utils/functions/dom";
import { injectXHR } from "@common/utils/functions/listeners";
import { ExecutionTiming, Feature } from "@features/feature";

function injectAdjustments() {
	injectXHR();

	executeScript(browser.runtime.getURL("/item-no-confirm--inject.js"), false);
}

export default class ItemNoConfirmItemsFeature extends Feature {
	constructor() {
		super("Item No Confirm", "items", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.scripts.noConfirm.itemEquip;
	}

	execute() {
		injectAdjustments();
	}
}
