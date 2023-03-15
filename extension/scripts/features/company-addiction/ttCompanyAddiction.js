"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Company Addicition Level",
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
		}
	);

	async function showCompanyAddictionLevel() {

		let id = userdata.player_id;
		let company_id = userdata?.job?.company_id;
		if (company_id == 0 || company_id == null || company_id == undefined)
			return;

		await requireSidebar();

		removeCompanyAddictionLevel();
		addInformationSection();
		showInformationSection();

		let addiction;
		if (ttCache.hasValue("company", "addiction")) {
			addiction = ttCache.get("company", "addiction");

            console.log(" from cache ");
		} else {
			const company_employees = (
				await fetchData("torn", {
					section: "company",
					id: company_id,
					selections: ["employees"],
					silent: true,
					succeedOnError: true,
				})
			).company_employees;

			let timeUntilNextUpdate = timeTillNextUpdate();

            console.log(" from fetch ");

			addiction = company_employees[id].effectiveness.addiction;

			ttCache.set({ addiction: addiction }, timeUntilNextUpdate, "company").then(() => {});
		}

		let companyAddictionElement = document.newElement({ type: "span", dataset: { addiction } })

		companyAddictionElement.textContent = addiction.toString();

		document.find(".tt-sidebar-information").appendChild(
			document.newElement({
				type: "section",
				id: "companyAddictionLevel",
				children: [document.newElement({ type: "a", class: "title", text: "Company Addiction: ", href: LINKS.companyEmployees }), companyAddictionElement],
			})
		);
	}

	function timeTillNextUpdate() {
		const now = new Date().getTime();

		const next630pm = new Date();
		next630pm.setUTCHours(18);
		next630pm.setUTCMinutes(30);
		next630pm.setUTCSeconds(0);
		next630pm.setUTCMilliseconds(0);

		// If the current time is after 6:30 PM, add 1 day to the target time
		if (next630pm.getTime() <= now) {
			next630pm.setDate(next630pm.getDate() + 1);
		}

		const timeUntil630pm = next630pm.getTime() - now;

		return timeUntil630pm;
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