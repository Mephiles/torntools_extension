"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Member Inactivity Warning",
		"faction",
		() => settings.factionInactivityWarning.filter((warning) => "days" in warning).length,
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
	}

	async function addWarning(force) {
		if (!force) return;

		if (lastActionState) {
			await requireElement(".tt-last-action");
			document.findAll(".members-list .table-body > li").forEach((li) => {
				if (li.nextSibling?.className?.includes("tt-last-action")) {
					// noinspection JSCheckFunctionSignatures
					const days = parseInt(li.nextSibling.getAttribute("hours") / 24);

					settings.factionInactivityWarning.forEach((warning) => {
						if (!("days" in warning) || days < warning.days) return;

						li.style.setProperty("--tt-inactive-background", warning.color);
						li.classList.add("tt-inactive");
					});
				}
			});
		}
	}

	function removeWarning() {
		document.findAll(".tt-inactive").forEach((inactive) => {
			inactive.style.removeProperty("--tt-inactive-background");
			inactive.classList.remove("tt-inactive");
		});
	}
})();
