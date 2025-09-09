"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Company Addiction Level",
		"sidebar",
		() => settings.pages.sidebar.companyAddictionLevel,
		null,
		showCompanyAddictionLevel,
		removeCompanyAddictionLevel,
		{
			storage: ["settings.pages.sidebar.companyAddictionLevel", "userdata.job.id"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!userdata.job?.id || userdata.job?.id === 0 || !userdata.job?.type_id || userdata.job?.type_id === 0)
				return "City jobs do not have addiction effects.";
			else if (userdata.job?.position === "Director") return "Company directors do not have addiction.";
		}
	);

	async function showCompanyAddictionLevel() {
		await requireSidebar();

		removeCompanyAddictionLevel();
		await addInformationSection();
		showInformationSection();

		const addiction = await getCompanyAddiction();

		const companyAddictionElement = document.newElement({ type: "span", dataset: { addiction } });

		companyAddictionElement.textContent = addiction.toString();

		document.find(".tt-sidebar-information").appendChild(
			document.newElement({
				type: "section",
				id: "companyAddictionLevel",
				children: [
					document.newElement({ type: "a", class: "title", text: "Company Addiction: ", href: LINKS.companyEmployees }),
					companyAddictionElement,
				],
				style: { order: 3 },
			})
		);
	}

	async function getCompanyAddiction() {
		if (ttCache.hasValue("company", "addiction")) {
			return ttCache.get("company", "addiction");
		} else {
			const id = userdata.profile.id;
			const company_id = userdata.job?.id;

			try {
				const response = // TODO - Migrate to V2 (company/employees).
				(
					await fetchData("torn", {
						section: "company",
						id: company_id,
						selections: ["employees"],
						silent: true,
						succeedOnError: true,
					})
				).company_employees;

				const addiction = response[id].effectiveness.addiction ?? 0;

				ttCache.set({ addiction: addiction }, getTimeUntilNextJobUpdate(), "company").then(() => {});

				return addiction;
			} catch (error) {
				console.error("TT - An error occurred when fetching company employees data, Error: " + error);
				throw new Error("An error occurred when fetching company employees data, Error: " + error);
			}
		}
	}

	function removeCompanyAddictionLevel() {
		const addictionLevel = document.find("#companyAddictionLevel");
		if (addictionLevel) addictionLevel.remove();
	}
})();
