"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Company ID",
		"companies",
		() => settings.pages.companies.idBesideCompanyName,
		initialise,
		addID,
		removeID,
		{
			storage: ["settings.pages.companies.idBesideCompanyName"],
		},
		null
	);

	function initialise() {
		if (!isOwnCompany) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
				if (!feature.enabled() || !settings.pages.companies.idBesideCompanyName) return;

				addID();
			});
		}
	}

	async function addID() {
		if (document.getElementById("tt-company-id")) return; // Element has already been added - second check in-case feature reinjects

		const container = await requireElement(
			isOwnCompany ? "div.company-wrap > div.title-black" : "div.company-details-wrap > div.company-details > div.title-black"
		);

		const id = await readCompanyDetails();
		if (!id) throw new Error("Company ID could not be found.");

		container.appendChild(document.newElement({ type: "span", text: ` [${id}]`, id: "tt-company-id" }));
	}

	function removeID() {
		document.findAll("#tt-company-id").forEach((element) => element.remove());
	}
})();
