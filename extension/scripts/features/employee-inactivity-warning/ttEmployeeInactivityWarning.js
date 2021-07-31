"use strict";

(async () => {
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Employee Inactivity Warning",
		"companies",
		() => isOwnCompany && settings.employeeInactivityWarning.filter((warning) => "days" in warning).length,
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

		document.findAll(".employee-list-wrap .employee-list > li").forEach((li) => {
			if (li.nextSibling.className.includes("tt-last-action")) {
				const days = parseInt(li.nextSibling.dataset.days);
				settings.employeeInactivityWarning.forEach((warning) => {
					if (!("days" in warning) || days < warning.days) return;

					li.style.setProperty("--tt-inactive-background", warning.color);
					li.classList.add("tt-inactive");
				});
			}
		});
	}

	function removeWarning() {
		document.findAll(".tt-inactive").forEach((inactive) => {
			inactive.style.removeProperty("--tt-inactive-background");
			inactive.classList.remove("tt-inactive");
		});
	}
})();
