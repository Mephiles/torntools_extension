import { isOwnCompany, readCompanyDetails } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements.ts";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialise() {
	if (!isOwnCompany) {
		addCustomListener(EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE, async () => {
			if (!FEATURE_MANAGER.isEnabled(CompanyIDFeature) || !settings.pages.companies.idBesideCompanyName) return;

			await addID();
		});
	}
}

async function addID() {
	if (findElement("#tt-company-id", true)) return; // Element has already been added - second check in-case feature reinjects

	const container = await requireElement(
		isOwnCompany ? "div.company-wrap > div.title-black" : "div.company-details-wrap > div.company-details > div.title-black",
	);

	const details = await readCompanyDetails();
	if (!details) throw new Error("Company ID could not be found.");

	container.appendChild(elementBuilder({ type: "span", text: ` [${details.id}]`, id: "tt-company-id" }));
}

export default class CompanyIDFeature extends Feature {
	constructor() {
		super("Company ID", "companies");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.companies.idBesideCompanyName;
	}

	override initialise() {
		initialise();
	}

	override async execute() {
		await addID();
	}

	override storageKeys() {
		return ["settings.pages.companies.idBesideCompanyName"];
	}
}
