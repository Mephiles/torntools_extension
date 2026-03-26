import "./employee-effectiveness.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { isOwnCompany } from "@/pages/company-page";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { findAllElements, getHashParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";

let observer: MutationObserver | undefined;

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(EmployeeEffectivenessFeature)) return;

		await showEffectiveness();
	});
}

async function startFeature() {
	await showEffectiveness();

	observer?.disconnect();

	observer = new MutationObserver((mutations) => {
		const firstAdditionMutation = mutations.filter((x) => x.addedNodes.length)[0];
		if ((firstAdditionMutation.target as Element).matches("#employees.employees")) showEffectiveness();
	});
	observer.observe(await requireElement(".company-wrap > .manage-company"), { childList: true, subtree: true });
}

async function showEffectiveness() {
	if (getHashParameters().get("option") !== "employees") return;

	const list: Element = await requireElement(".employee-list");

	for (const row of findAllElements(".effectiveness[data-multipliers]", list)) {
		const multipliers = JSON.parse(row.dataset.multipliers) || [];
		const reduction = multipliers.filter((multiplier: any) => multiplier < 0).reduce((a, b) => a + b, 0) * -1;

		const element = row.querySelector(".effectiveness-value");

		if (reduction < settings.pages.companies.employeeEffectiveness) {
			element.classList.remove("tt-employee-effectiveness"); // Live reload
			continue;
		}

		element.classList.add("tt-employee-effectiveness");
	}
}

function removeEffectiveness() {
	for (const effectiveness of findAllElements(".tt-employee-effectiveness")) effectiveness.classList.remove("tt-employee-effectiveness");
	observer?.disconnect();
	observer = null;
}

export default class EmployeeEffectivenessFeature extends Feature {
	constructor() {
		super("Employee Effectiveness", "companies");
	}

	precondition() {
		return getPageStatus().access && isOwnCompany;
	}

	isEnabled() {
		return !!settings.pages.companies.employeeEffectiveness;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeEffectiveness();
	}

	storageKeys() {
		return ["settings.pages.companies.employeeEffectiveness"];
	}
}
