import { settings } from "@common/utils/data/database";
import { executeScript } from "@common/utils/functions/dom";
import { ExecutionTiming, Feature } from "@features/feature";

export default class NoOutsideLinkAlertFeature extends Feature {
	constructor() {
		super("No Outside Link Alert", "global", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.global.noOutsideLinkAlert;
	}

	initialise() {
		executeScript(browser.runtime.getURL("/no-outside-link-alert--inject.js"), false);
	}

	storageKeys() {
		return ["settings.pages.global.noOutsideLinkAlert"];
	}
}
