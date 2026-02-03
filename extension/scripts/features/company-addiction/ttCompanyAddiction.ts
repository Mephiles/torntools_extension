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
			else if (userdata.job === null) return "You need to have a company job.";
			else if (userdata.job.type === "job") return "City jobs do not have addiction effects.";
			else if (userdata.job.position === "Director") return "Company directors do not have addiction.";

			return true;
		}
	);

	async function showCompanyAddictionLevel() {
		await requireSidebar();

		removeCompanyAddictionLevel();
		await addInformationSection();
		showInformationSection();

		const addiction = await getCompanyAddiction();

		const companyAddictionElement = elementBuilder({ type: "span", dataset: { addiction } });

		companyAddictionElement.textContent = addiction.toString();

		document.find(".tt-sidebar-information").appendChild(
			elementBuilder({
				type: "section",
				id: "companyAddictionLevel",
				children: [elementBuilder({ type: "a", class: "title", text: "Company Addiction: ", href: LINKS.companyEmployees }), companyAddictionElement],
				style: { order: "3" },
			})
		);
	}

	async function getCompanyAddiction() {
		if (ttCache.hasValue("company", "addiction")) {
			return ttCache.get<number>("company", "addiction");
		} else {
			const id = userdata.profile.id;
			const company_id = (userdata.job as UserCompany).id;

			try {
				const response = // TODO - Migrate to V2 (company/employees).
					(
						await fetchData<CompanyV1EmployeesResponse>("tornv2", {
							section: "company",
							id: company_id,
							selections: ["employees"],
							legacySelections: ["employees"],
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

	return true;
})();
