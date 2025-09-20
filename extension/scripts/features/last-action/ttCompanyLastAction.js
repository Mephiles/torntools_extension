"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Last Action",
		"last action",
		() => (isOwnCompany && settings.scripts.lastAction.companyOwn) || (!isOwnCompany && settings.scripts.lastAction.companyOther),
		addListener,
		addLastAction,
		removeLastAction,
		{
			storage: ["settings.scripts.lastAction.companyOwn", "settings.scripts.lastAction.companyOther"],
		},
		() => {
			if (!hasAPIData()) return "No API access!";
		},
		{ triggerCallback: true }
	);

	async function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
			if (!feature.enabled) return;

			addLastAction(isOwnCompany);
		});
	}

	async function addLastAction(force) {
		if (isOwnCompany && getHashParameters().get("option") !== "employees" && !force) return;
		if (document.find(".tt-last-action")) return;
		if (isOwnCompany && !settings.scripts.lastAction.companyOwn) return;
		if (!isOwnCompany && !settings.scripts.lastAction.companyOther) return;

		await requireElement(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li");

		let id;
		if (isOwnCompany) {
			id = userdata.job?.id;
		} else {
			id = parseInt(getHashParameters().get("ID"));
			if (isNaN(id)) {
				const companyName = document.find(".company-details").dataset.name;
				if (ttCache.hasValue("company-ids", companyName)) {
					id = ttCache.get("company-ids", companyName);
				} else {
					const directorID = document.find(".company-details-wrap [href*='profiles.php']").href.split("=")[1];
					const directorData = await fetchData("tornv2", { section: "user", selections: ["job"], id: directorID });
					id = directorData.job?.id;
					ttCache.set({ [companyName]: id }, TO_MILLIS.SECONDS * 30, "company-ids").then(() => {});
				}
			}
		}

		let employees;
		if (ttCache.hasValue("company-employees", id)) {
			employees = ttCache.get("company-employees", id);
		} else {
			employees = (
				await fetchData("tornv2", {
					section: "company",
					id: id,
					selections: ["profile"],
					legacySelections: ["profile"],
					silent: true,
					succeedOnError: true,
				})
			).company.employees;

			ttCache.set({ [id]: employees }, TO_MILLIS.SECONDS * 30, "company-employees").then(() => {});
		}

		const now = Date.now();
		const list = document.find(".employee-list-wrap .employee-list, .employees-wrap .employees-list");
		for (const row of list.findAll(":scope > li")) {
			const { id } = getUsername(row);
			const days = ((now - employees[id].last_action.timestamp * 1000) / TO_MILLIS.DAYS).dropDecimals();

			row.insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "div",
					class: `tt-last-action ${isOwnCompany ? "" : "joblist"}`,
					text: `Last action: ${employees[id].last_action.relative}`,
					dataset: { days },
				})
			);
		}
		list.classList.add("tt-modified");
	}

	function removeLastAction() {
		const list = document.find(".employee-list-wrap .employee-list.tt-modified, .employees-wrap .employees-list.tt-modified");
		if (list) {
			list.findAll(":scope > div.tt-last-action").forEach((x) => x.remove());
			list.classList.remove("tt-modified");
		}
	}
})();
