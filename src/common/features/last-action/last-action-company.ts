import "./last-action.css";
import { isOwnCompany } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { elementBuilder, findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { dropDecimals } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getUsername } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { CompanyEmployeesResponse, CompanyProfileResponse, UserJobResponse } from "tornapi-typescript";

function addListener() {
	addCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionCompanyFeature)) return;

		await addLastAction(isOwnCompany);
	});
}

type FetchedCompany = CompanyEmployeesResponse & CompanyProfileResponse;

async function addLastAction(force: boolean) {
	if (isOwnCompany && getHashParameters().get("option") !== "employees" && !force) return;
	if (document.querySelector(".tt-last-action")) return;
	if (isOwnCompany && !settings.scripts.lastAction.companyOwn) return;
	if (!isOwnCompany && !settings.scripts.lastAction.companyOther) return;

	await requireElement(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li");

	const id = await extractCompanyId();

	let company: FetchedCompany;
	if (ttCache.hasValue("company", id)) {
		company = ttCache.get("company", id);
	} else {
		company = await fetchData<FetchedCompany>("tornv2", { section: "company", id: id, selections: ["employees", "profile"], silent: true });

		ttCache.set({ [id]: company }, TO_MILLIS.SECONDS * 30, "company-employees");
	}

	const now = Date.now();
	const list = document.querySelector(".employee-list-wrap .employee-list, .employees-wrap .employees-list");
	for (const row of findAllElements(":scope > li", list)) {
		const { id } = getUsername(row);

		const employee = resolveEmployee(id, company);
		if (!employee) {
			console.warn(`TT - Couldn't find the employee information for ${id}!`, company);
			continue;
		}

		const days = dropDecimals((now - employee.last_action.timestamp) / TO_MILLIS.DAYS);

		row.insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: `tt-last-action ${isOwnCompany ? "" : "joblist"}`,
				text: `Last action: ${employee.last_action.relative}`,
				dataset: { days },
			}),
		);
	}
	list.classList.add("tt-modified");
}

interface ResolvedEmployee {
	id: number;
	last_action: {
		timestamp: number;
		relative: string;
	};
}

function resolveEmployee(id: number, company: FetchedCompany): ResolvedEmployee | null {
	if (id === company.profile.director.id) {
		return {
			id,
			last_action: { timestamp: company.profile.director.last_action.timestamp * 1000, relative: company.profile.director.last_action.relative },
		};
	}

	const employee = company.employees.find((e) => e.id === id);
	if (!employee) return null;

	return { id, last_action: { timestamp: employee.last_action.timestamp * 1000, relative: employee.last_action.relative } };
}

async function extractCompanyId(): Promise<number> {
	if (isOwnCompany && userdata.job?.type === "company") {
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

		if (directorData.job?.type === "company") {
			const companyId = directorData.job.id;
			ttCache.set({ [companyName]: companyId }, TO_MILLIS.SECONDS * 30, "company-ids");
			return companyId;
		}
	}

	throw new Error("Failed to extract company id.");
}

export default class LastActionCompanyFeature extends Feature {
	constructor() {
		super("Last Action Company", "last action");
	}

	override isEnabled(): boolean {
		return (isOwnCompany && settings.scripts.lastAction.companyOwn) || (!isOwnCompany && settings.scripts.lastAction.companyOther);
	}

	override requirements() {
		if (!hasAPIData()) return "No API access!";

		return true;
	}

	override initialise() {
		addListener();
	}

	override async execute() {
		await addLastAction(false);
	}

	override storageKeys(): string[] {
		return ["settings.scripts.lastAction.companyOwn", "settings.scripts.lastAction.companyOther"];
	}

	override shouldTriggerEvents(): boolean {
		return true;
	}
}
