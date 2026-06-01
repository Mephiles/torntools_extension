import { ExecutionTiming, Feature } from "@features/feature";
import { settings } from "@utils/data/database";
import { executeScript } from "@utils/functions/dom";

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
