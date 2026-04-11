import "./last-action.css";
import type { UserJobResponse } from "tornapi-typescript";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isOwnCompany } from "@/pages/company-page";
import { ttCache } from "@/utils/common/data/cache";
import { settings, userdata } from "@/utils/common/data/database";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import type { CompanyV1Employees, CompanyV1ProfileResponse } from "@/utils/common/functions/api-v1.types";
import { elementBuilder, findAllElements, getHashParameters } from "@/utils/common/functions/dom";
import { dropDecimals } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getUsername } from "@/utils/common/functions/torn";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionCompanyFeature)) return;

		await addLastAction(isOwnCompany);
	});
}

async function addLastAction(force: boolean) {
	if (isOwnCompany && getHashParameters().get("option") !== "employees" && !force) return;
	if (document.querySelector(".tt-last-action")) return;
	if (isOwnCompany && !settings.scripts.lastAction.companyOwn) return;
	if (!isOwnCompany && !settings.scripts.lastAction.companyOther) return;

	await requireElement(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li");

	const id = await extractCompanyId();

	let employees: CompanyV1Employees;
	if (ttCache.hasValue("company-employees", id)) {
		employees = ttCache.get("company-employees", id);
	} else {
		employees = (
			await fetchData<CompanyV1ProfileResponse>("tornv2", {
				section: "company",
				id: id,
				selections: ["profile"],
				legacySelections: ["profile"],
				silent: true,
				succeedOnError: true,
			})
		).company.employees;

		ttCache.set({ [id]: employees }, TO_MILLIS.SECONDS * 30, "company-employees").then(() => {});
	}

	const now = Date.now();
	const list = document.querySelector(".employee-list-wrap .employee-list, .employees-wrap .employees-list");
	for (const row of findAllElements(":scope > li", list)) {
		const { id } = getUsername(row);
		const days = dropDecimals((now - employees[id].last_action.timestamp * 1000) / TO_MILLIS.DAYS);

		row.insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: `tt-last-action ${isOwnCompany ? "" : "joblist"}`,
				text: `Last action: ${employees[id].last_action.relative}`,
				dataset: { days },
			}),
		);
	}
	list.classList.add("tt-modified");
}

async function extractCompanyId(): Promise<number> {
	if (isOwnCompany && userdata.job && userdata.job.type === "company") {
		return userdata.job.id;
	}

	const id = parseInt(getHashParameters().get("ID"));
	if (!Number.isNaN(id)) {
		return id;
	}

	const companyName = document.querySelector<HTMLElement>(".company-details").dataset.name;
	if (ttCache.hasValue("company-ids", companyName)) {
		return ttCache.get<number>("company-ids", companyName);
	} else {
		const directorID = document.querySelector<HTMLAnchorElement>(".company-details-wrap [href*='profiles.php']").href.split("=")[1];
		const directorData = await fetchData<UserJobResponse>("tornv2", { section: "user", selections: ["job"], id: directorID });

		if (directorData.job && directorData.job.type === "company") {
			const companyId = directorData.job.id;
			ttCache.set({ [companyName]: companyId }, TO_MILLIS.SECONDS * 30, "company-ids").then(() => {});
			return companyId;
		}
	}

	throw new Error("Failed to extract company id.");
}

function removeLastAction() {
	const list = document.querySelector(".employee-list-wrap .employee-list.tt-modified, .employees-wrap .employees-list.tt-modified");
	if (list) {
		findAllElements(":scope > div.tt-last-action", list).forEach((x) => x.remove());
		list.classList.remove("tt-modified");
	}
}

export default class LastActionCompanyFeature extends Feature {
	constructor() {
		super("Last Action Company", "last action");
	}

	isEnabled(): boolean {
		return (isOwnCompany && settings.scripts.lastAction.companyOwn) || (!isOwnCompany && settings.scripts.lastAction.companyOther);
	}

	requirements() {
		if (!hasAPIData()) return "No API access!";

		return true;
	}

	initialise() {
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addLastAction(liveReload);
	}

	cleanup() {
		removeLastAction();
	}

	storageKeys(): string[] {
		return ["settings.scripts.lastAction.companyOwn", "settings.scripts.lastAction.companyOther"];
	}

	shouldTriggerEvents(): boolean {
		return true;
	}
}
