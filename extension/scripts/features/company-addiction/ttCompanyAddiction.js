"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Company Addiction Level",
		"sidebar",
		() => settings.pages.sidebar.companyAddictionLevel,
		null,
		showCompanyAddictionLevel,
		removeCompanyAddictionLevel,
		{
			storage: ["settings.pages.sidebar.companyAddictionLevel", "userdata.job.company_id"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!userdata.job.company_id || userdata.job.company_id === 0 || !userdata.job.company_type || userdata.job.company_type === 0)
				return "City jobs do not have addiction effects.";
			else if (userdata.job.position === "Director") return "Company directors do not have addiction.";
		}
	);

	async function showCompanyAddictionLevel() {
		await requireSidebar();

		removeCompanyAddictionLevel();
		addInformationSection();
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
			})
		);
	}

	async function getCompanyAddiction() {
		if (ttCache.hasValue("company", "addiction")) {
			return ttCache.get("company", "addiction");
		} else {
			const id = userdata.player_id;
			const company_id = userdata.job.company_id;

			try {
				const response = (
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

	function addInformationSection() {
		if (document.find(".tt-sidebar-information")) return;

		const parent = document.find("#sidebarroot div[class*='user-information_'] div[class*='toggle-content_'] div[class*='content_']");

		parent.appendChild(document.newElement({ type: "hr", class: "tt-sidebar-information-divider tt-delimiter tt-hidden" }));
		parent.appendChild(document.newElement({ type: "div", class: "tt-sidebar-information tt-hidden" }));
	}

	function showInformationSection() {
		document.find(".tt-sidebar-information-divider").classList.remove("tt-hidden");
		document.find(".tt-sidebar-information").classList.remove("tt-hidden");
	}
})();
