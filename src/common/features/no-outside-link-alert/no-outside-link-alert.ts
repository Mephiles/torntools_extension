import { settings } from "@common/utils/data/database";
import { executeScript } from "@common/utils/functions/dom";
import { ExecutionTiming, Feature } from "@features/feature";

export default class NoOutsideLinkAlertFeature extends Feature {
	constructor() {
		super("No Outside Link Alert", "global", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.global.noOutsideLinkAlert;
	}

	override initialise() {
		executeScript(browser.runtime.getURL("/no-outside-link-alert--inject.js"), false);
	}

	override storageKeys() {
		return ["settings.pages.global.noOutsideLinkAlert"];
	}
}
