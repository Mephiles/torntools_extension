"use strict";

(async () => {
	// if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Employee Inactivity Warning",
		"companies",
		() => settings.employeeInactivityWarning.filter((warning) => "days" in warning).length,
		addListener,
		addWarning,
		removeWarning,
		{
			storage: ["settings.employeeInactivityWarning"],
		},
		null,
		{ liveReload: true }
	);

	let lastActionState = settings.scripts.lastAction.companyOwn;
	function addListener() {
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
		if (!force) return;

		await requireElement(".employee-list-wrap .employee-list, .employees-wrap .employees-list");

		for (const row of document.findAll(".employee-list-wrap .employee-list > li, .employees-wrap .employees-list > li")) {
			if (!row.nextSibling.classList.contains("tt-last-action")) continue;

			const days = parseInt(row.nextSibling.dataset.days);

			for (const warning of settings.employeeInactivityWarning) {
				if (!("days" in warning) || days < warning.days) continue;

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
