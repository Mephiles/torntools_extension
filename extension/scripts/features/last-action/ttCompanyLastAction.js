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
		if (isOwnCompany) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
				if (!feature.enabled) return;
				addLastAction(true);
			});
		} else {
			await requireElement(".content #mainContainer .employees-wrap");
			new MutationObserver(async (mutations) => {
				if (
					!(mutations.length > 1) ||
					!feature.enabled() ||
					(isOwnCompany && getHashParameters().get("option") !== "employees") ||
					!mutations.some((mutation) => mutation.addedNodes && mutation.addedNodes.length && [...mutation.addedNodes].some(x => x.classList && x.classList.contains("employees-wrap")))
				)
					return;

				await addLastAction();
			}).observe(document.find(".content #mainContainer .content-wrapper"), { childList: true });
		}
	}

	async function addLastAction(force) {
		if (isOwnCompany && getHashParameters().get("option") !== "employees" && !force) return;
		if (document.find(".tt-last-action")) return;
		if (isOwnCompany && !settings.scripts.lastAction.companyOwn) return;
		if (!isOwnCompany && !settings.scripts.lastAction.companyOther) return;

		await requireElement(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li");

		let id;
		if (isOwnCompany) {
			id = userdata.job.company_id;
		} else {
			id = parseInt(getHashParameters().get("ID"));
			if (isNaN(id)) {
				const companyName = document.find(".company-details").dataset.name;
				if (ttCache.hasValue("company-ids", companyName)) {
					id = ttCache.get("company-ids", companyName);
				} else {
					const directorID = document.find(".company-details-wrap [href*='profiles.php']").href.split("=")[1];
					const directorData = await fetchData("torn", { section: "user", selections: ["profile"], id: directorID });
					id = directorData.job.company_id;
					ttCache.set({ [companyName]: id }, TO_MILLIS.SECONDS * 30, "company-ids").then(() => {});
				}
			}
		}

		let employees;
		if (ttCache.hasValue("company-employees", id)) {
			employees = ttCache.get("company-employees", id);
		} else {
			employees = (
				await fetchData("torn", {
					section: "company",
					id: id,
					selections: ["profile"],
					silent: true,
					succeedOnError: true,
				})
			).company.employees;

			ttCache.set({ [id]: employees }, TO_MILLIS.SECONDS * 30, "company-employees").then(() => {});
		}

		let list;
		if (isOwnCompany) {
			list = document.find(".employee-list-wrap .employee-list");
			const nowDate = Date.now();
			list.findAll(":scope > li").forEach((li) => {
				const employeeID = li.dataset.user;
				const days = ((nowDate - employees[employeeID].last_action.timestamp * 1000) / TO_MILLIS.DAYS).dropDecimals();
				li.insertAdjacentElement(
					"afterend",
					document.newElement({
						type: "div",
						class: "tt-last-action",
						text: `Last action: ${employees[employeeID].last_action.relative}`,
						dataset: { days },
					})
				);
			});
		} else {
			list = document.find(".employees-wrap .employees-list");
			list.findAll(":scope > li").forEach((li) => {
				const employeeID = li.find(".user.name").dataset.placeholder.match(/(?<=\[)\d+(?=]$)/g)[0];
				li.insertAdjacentElement(
					"afterend",
					document.newElement({
						type: "div",
						class: "tt-last-action joblist",
						text: `Last action: ${employees[employeeID].last_action.relative}`,
					})
				);
			});
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
