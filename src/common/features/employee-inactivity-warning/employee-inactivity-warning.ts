import "./employee-inactivity-warning.css";
import { isOwnCompany } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

let lastActionState: boolean;

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(EmployeeInactivityWarningFeature)) return;

		await addWarning(true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
		if (FEATURE_MANAGER.isEnabled(EmployeeInactivityWarningFeature) && name === "Last Action") {
			lastActionState = true;
			await addWarning(true);
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(EmployeeInactivityWarningFeature)) return;

		if (name === "Last Action") {
			lastActionState = false;
			removeWarning();
		}
	});
}

async function addWarning(force: boolean | undefined) {
	if (!force || !lastActionState) return;

	await requireElement(".employee-list-wrap .employee-list > li + .tt-last-action, .employees-wrap .employees-list > li + .tt-last-action");

	for (const row of findAllElements(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li")) {
		if (!row.nextElementSibling.classList.contains("tt-last-action")) continue;

		const days = parseInt((row.nextElementSibling as HTMLElement).dataset.days);

		for (const warning of settings.employeeInactivityWarning) {
			if (warning.days === null || days < warning.days) continue;

			row.style.setProperty("--tt-inactive-background", warning.color);
			row.classList.add("tt-inactive");
		}
	}
}

function removeWarning() {
	findAllElements(".tt-inactive").forEach((inactive) => {
		inactive.style.removeProperty("--tt-inactive-background");
		inactive.classList.remove("tt-inactive");
	});
}

export default class EmployeeInactivityWarningFeature extends Feature {
	constructor() {
		super("Employee Inactivity Warning", "companies");
	}

	isEnabled(): boolean {
		return !!settings.employeeInactivityWarning.filter((warning) => warning.days !== null).length;
	}

	initialise() {
		lastActionState = isOwnCompany ? settings.scripts.lastAction.companyOwn : settings.scripts.lastAction.companyOther;
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addWarning(liveReload);
	}

	cleanup() {
		removeWarning();
	}

	storageKeys(): string[] {
		return ["settings.employeeInactivityWarning"];
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
