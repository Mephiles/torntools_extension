"use strict";

(async () => {
	if (!isOwnCompany) return;

	const feature = featureManager.registerFeature(
		"Employee Inactivity Warning",
		"companies",
		() => isOwnCompany && Object.keys(settings.employeeInactivityWarning).length,
		addListener,
		addWarning,
		removeWarning,
		{
			storage: ["settings.employeeInactivityWarning"],
		},
		null
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
				const days = li.nextSibling.dataset.days;
				Object.entries(settings.employeeInactivityWarning).forEach(([checkpoint, background]) => {
					if (checkpoint === "" || days < checkpoint) return;

					li.style.setProperty("--tt-inactive-background", background);
					li.classList.add("tt-inactive");
				});
			}
		});
	}

	function removeWarning() {
		document
			.findAll(".employee-list-wrap .employee-list > li.tt-modified")
			.forEach((x) => x.classList.remove("tt-modified", "inactive-one", "inactive-two"));
	}
})();
