import { ttCache } from "@common/utils/data/cache";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { CompanyV1EmployeesResponse } from "@common/utils/functions/api-v1.types";
import { addInformationSection, checkDevice, elementBuilder, showInformationSection } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { getUserDetails, isPageWithSidebar, LINKS } from "@common/utils/functions/torn";
import { getTimeUntilNextJobUpdate } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { UserCompany } from "tornapi-typescript";

async function showCompanyAddictionLevel() {
	await requireSidebar();

	removeCompanyAddictionLevel();
	await addInformationSection();
	showInformationSection();

	const addiction = await getCompanyAddiction();

	const companyAddictionElement = elementBuilder({ type: "span", dataset: { addiction } });

	companyAddictionElement.textContent = addiction.toString();

	document.querySelector(".tt-sidebar-information").appendChild(
		elementBuilder({
			type: "section",
			id: "companyAddictionLevel",
			children: [elementBuilder({ type: "a", class: "title", text: "Company Addiction: ", href: LINKS.companyEmployees }), companyAddictionElement],
			style: { order: "4" },
		}),
	);
}

async function getCompanyAddiction() {
	if (ttCache.hasValue("company", "addiction")) {
		return ttCache.get<number>("company", "addiction");
	} else {
		const id = getUserDetails().id;
		const company_id = (userdata.job as UserCompany).id;

		try {
			const response = // TODO - Migrate to V2 (company/employees).
				(
					await fetchData<CompanyV1EmployeesResponse>("tornv2", {
						section: "company",
						id: company_id,
						legacySelections: ["employees"],
						silent: true,
					})
				).company_employees;

			const addiction = response[id].effectiveness.addiction ?? 0;

			ttCache.set({ addiction: addiction }, getTimeUntilNextJobUpdate(), "company").then(() => {});

			return addiction;
		} catch (error) {
			console.error(`TT - An error occurred when fetching company employees data, Error: ${error}`);
			throw new Error(`An error occurred when fetching company employees data, Error: ${error}`);
		}
	}
}

function removeCompanyAddictionLevel() {
	document.querySelector("#companyAddictionLevel")?.remove();
}

export default class CompanyAddictionFeature extends Feature {
	constructor() {
		super("Company Addiction Level", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (userdata.job === null) return "You need to have a company job.";
		else if (userdata.job.type === "job") return "City jobs do not have addiction effects.";
		else if (userdata.job.position === "Director") return "Company directors do not have addiction.";
		else if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.companyAddictionLevel;
	}

	async execute() {
		await showCompanyAddictionLevel();
	}

	cleanup() {
		removeCompanyAddictionLevel();
	}

	storageKeys() {
		return ["settings.pages.sidebar.companyAddictionLevel", "userdata.job.id"];
	}
}
