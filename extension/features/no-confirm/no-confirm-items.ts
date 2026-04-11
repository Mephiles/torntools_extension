import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { executeScript } from "@/utils/common/functions/dom";
import { injectXHR } from "@/utils/common/functions/listeners";

declare global {
	interface Window {
		xhrSendAdjustments?: { [key: string]: (xhr: any, body: string) => string };
	}
}

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
