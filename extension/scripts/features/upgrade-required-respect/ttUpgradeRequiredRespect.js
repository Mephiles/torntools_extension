"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Upgrade Required Respect",
		"faction",
		() => settings.pages.faction.upgradeRequiredRespect,
		addListener,
		showRequiredRespect,
		removeRequiredRespect,
		{
			storage: ["settings.pages.faction.upgradeRequiredRespect"],
		},
		null,
		{ liveReload: true },
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_UPGRADE_INFO].push(() => {
			if (feature.enabled()) showRequiredRespect(true);
		});
	}

	async function showRequiredRespect(force) {
		if (!force) return;
		await requireElement("#faction-upgrades #stu-confirmation div[role] > :nth-child(3)");

		const availableRespect = parseInt(
			document
				.find("#faction-upgrades .skill-tree .residue-respect")
				.textContent.replace(/[\n, ]/g, "")
				.trim(),
		);
		const requiredNode = document.find("#faction-upgrades #stu-confirmation div[role] .required .text");
		if (!requiredNode || requiredNode.textContent.includes("Challenge:")) return;
		let diff;
		if (requiredNode.parentElement.classList.contains("completed")) {
			diff = 0;
		} else {
			const upgradeRespect = parseInt(requiredNode.textContent.replace(/.*Requires: |.*Assigned: | respect.*|,/g, ""));
			diff = upgradeRespect - availableRespect;
			if (diff < 0) diff = 0;
		}
		requiredNode.parentElement.classList.add("tt-modified");
		requiredNode.textContent += ` (${formatNumber(diff)} needed to go)`;
	}

	function removeRequiredRespect() {
		const requiredNode = document.find("#faction-upgrades #stu-confirmation div[role] > .tt-modified > .text");
		if (requiredNode) {
			requiredNode.textContent = requiredNode.textContent.replace(/ \(.*\)/, "");
			requiredNode.parentElement.classList.remove("tt-modified");
		}
	}
})();
