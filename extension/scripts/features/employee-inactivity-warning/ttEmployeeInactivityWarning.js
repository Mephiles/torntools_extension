"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Employee Inactivity Warning",
		"companies",
		() => settings.employeeInactivityWarning.filter((warning) => warning.days !== undefined && warning.days !== false).length,
		addListener,
		addWarning,
		removeWarning,
		{
			storage: ["settings.employeeInactivityWarning"],
		},
		null,
		{ liveReload: true }
	);

	let lastActionState = isOwnCompany ? settings.scripts.lastAction.companyOwn : settings.scripts.lastAction.companyOther;

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
			if (!feature.enabled) return;

			await addWarning(true);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
			if (feature.enabled() && name === "Last Action") {
				lastActionState = true;
				await addWarning(true);
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
			if (!feature.enabled()) return;

			if (name === "Last Action") {
				lastActionState = false;
				await removeWarning();
			}
		});
	}

	async function addWarning(force) {
		if (!force || !lastActionState) return;

		await requireElement(".employee-list-wrap .employee-list > li + .tt-last-action, .employees-wrap .employees-list > li + .tt-last-action");

		for (const row of document.findAll(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li")) {
			if (!row.nextElementSibling.classList.contains("tt-last-action")) continue;

			const days = parseInt(row.nextElementSibling.dataset.days);

			for (const warning of settings.employeeInactivityWarning) {
				if (!(warning.days !== undefined && warning.days !== false) || days < warning.days) continue;

				row.style.setProperty("--tt-inactive-background", warning.color);
				row.classList.add("tt-inactive");
			}
		}
	}

	function removeWarning() {
		document.findAll(".tt-inactive").forEach((inactive) => {
			inactive.style.removeProperty("--tt-inactive-background");
			inactive.classList.remove("tt-inactive");
		});
	}
})();
