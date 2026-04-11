import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isOwnCompany, readCompanyDetails } from "@/pages/company-page";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialise() {
	if (!isOwnCompany) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(CompanyIDFeature) || !settings.pages.companies.idBesideCompanyName) return;

			await addID();
		});
	}
}

async function addID() {
	if (document.getElementById("tt-company-id")) return; // Element has already been added - second check in-case feature reinjects

	const container: HTMLElement = await requireElement(
		isOwnCompany ? "div.company-wrap > div.title-black" : "div.company-details-wrap > div.company-details > div.title-black",
	);

	const details = await readCompanyDetails();
	if (!details) throw new Error("Company ID could not be found.");

	container.appendChild(elementBuilder({ type: "span", text: ` [${details.id}]`, id: "tt-company-id" }));
}

function removeID() {
	findAllElements("#tt-company-id").forEach((element) => element.remove());
}

export default class CompanyIDFeature extends Feature {
	constructor() {
		super("Company ID", "companies");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.companies.idBesideCompanyName;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await addID();
	}

	cleanup() {
		removeID();
	}

	storageKeys() {
		return ["settings.pages.companies.idBesideCompanyName"];
	}
}
