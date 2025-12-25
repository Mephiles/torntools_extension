(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Employee Effectiveness",
		"companies",
		() => !!settings.pages.companies.employeeEffectiveness,
		initialiseListeners,
		startFeature,
		removeEffectiveness,
		{
			storage: ["settings.pages.companies.employeeEffectiveness"],
		}
	);

	let observer: MutationObserver | undefined;
	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
			if (!feature.enabled()) return;

			showEffectiveness();
		});
	}

	async function startFeature() {
		void showEffectiveness();

		observer?.disconnect();

		observer = new MutationObserver((mutations) => {
			const firstAdditionMutation = mutations.filter((x) => x.addedNodes.length)[0];
			if ((firstAdditionMutation.target as Element).matches("#employees.employees")) showEffectiveness();
		});
		observer.observe(await requireElement(".company-wrap > .manage-company"), { childList: true, subtree: true });
	}

	async function showEffectiveness() {
		if (getHashParameters().get("option") !== "employees") return;

		const list: Element = await requireElement(".employee-list");

		for (const row of list.findAll(".effectiveness[data-multipliers]")) {
			const multipliers = JSON.parse(row.dataset.multipliers) || [];
			const reduction = multipliers.filter((multiplier: any) => multiplier < 0).totalSum() * -1;

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
		observer?.disconnect();
		observer = null;
	}
})();
