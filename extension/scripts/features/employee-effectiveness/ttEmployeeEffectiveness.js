"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Employee Effectiveness",
		"companies",
		() => settings.pages.companies.employeeEffectiveness,
		initialiseListeners,
		startFeature,
		removeEffectiveness,
		{
			storage: ["settings.pages.companies.employeeEffectiveness"],
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
			if (!feature.enabled()) return;

			showEffectiveness();
		});
	}

	function startFeature() {
		if (getHashParameters().get("option") !== "employees") return;

		showEffectiveness();
	}

	async function showEffectiveness() {
		const list = await requireElement(".employee-list");

		for (const row of list.findAll(".effectiveness[data-multipliers]")) {
			const multipliers = JSON.parse(row.dataset.multipliers) || [];
			const reduction = multipliers.filter((multiplier) => multiplier < 0).totalSum() * -1;

			const element = row.find(".effectiveness-value");

			if (reduction < settings.pages.companies.employeeEffectiveness) {
				element.classList.remove("tt-employee-effectiveness"); // Live reload
				continue;
			}

			element.classList.add("tt-employee-effectiveness");
		}
	}

	function removeEffectiveness() {
		for (const effectiveness of document.findAll(".tt-employee-effectiveness")) effectiveness.classList.remove("tt-employee-effectiveness");
	}
})();
