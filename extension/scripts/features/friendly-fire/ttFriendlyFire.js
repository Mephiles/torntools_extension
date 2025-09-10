"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Friendly Fire",
		"profile",
		() => settings.pages.profile.showAllyWarning,
		null,
		addWarning,
		removeWarning,
		{
			storage: ["settings.pages.profile.showAllyWarning", "settings.allyFactionsIDs"],
		},
		null
	);

	async function addWarning() {
		if (document.find(".tt-ally-warning")) document.find(".tt-ally-warning").remove();

		const factionNode = await requireElement(".user-info-value [href*='/factions.php']");
		const factionID = parseInt(new URLSearchParams(factionNode.href).get("ID"));
		const factionName = factionNode.textContent.trim();

		let warning;
		if (hasAPIData() && factionID === userdata.faction?.id) warning = "This user is in your faction!";
		else if (
			settings.alliedFactions.some((ally) => {
				if (isIntNumber(ally)) return ally === factionID || ally.toString() === factionName;
				else return ally.trim() === factionName;
			})
		)
			warning = "This user is an ally!";
		document.find(".profile-left-wrapper .title-black").appendChild(
			document.newElement({
				type: "span",
				class: "tt-ally-warning",
				text: warning,
			})
		);
	}

	function removeWarning() {
		document.findAll(".tt-ally-warning").forEach((x) => x.remove());
	}
})();
