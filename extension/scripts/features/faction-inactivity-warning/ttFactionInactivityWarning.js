"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Member Inactivity Warning",
		"faction",
		() => settings.factionInactivityWarning.filter((warning) => warning.days !== undefined && warning.days !== false).length,
		addListener,
		addWarning,
		removeWarning,
		{
			storage: ["settings.factionInactivityWarning"],
		},
		null,
		{ liveReload: true }
	);

	let lastActionState = settings.scripts.lastAction.factionMember;

	function addListener() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
				if (!feature.enabled()) return;

				await addWarning(true);
			});
		}
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

		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
			if (!feature.enabled()) return;

			await addWarning(true);
		});
	}

	async function addWarning(force) {
		if (!force || !lastActionState) return;

		await requireElement(".tt-last-action");

		for (const row of document.findAll(".members-list .table-body > li")) {
			if (!row.nextElementSibling.classList.contains("tt-last-action")) continue;
			// Skip users that are confirmed to be dead IRL.
			if (row.find("[id*='icon77___']")) continue;

			const days = (row.nextElementSibling.getAttribute("hours") / 24).dropDecimals();

			for (const warning of settings.factionInactivityWarning) {
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
