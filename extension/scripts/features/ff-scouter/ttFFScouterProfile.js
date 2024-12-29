"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"FF Scouter Profile",
		"ff-scouter",
		() => settings.scripts.ffScouter.profile,
		null,
		showFF,
		removeFF,
		{
			storage: ["settings.scripts.ffScouter.profile", "settings.external.tornpal"],
		},
		() => {
			if (!settings.external.tornpal) return "TornPal not enabled";
		}
	);

	async function showFF() {
		await requireElement(".basic-info .info-table > *:first-child");

		const id = getUserID();

		const scout = await scoutFF(id);
		const element = buildScoutElement(scout, "tt-ff-scouter-profile");

		const title = document.find(".profile-right-wrapper > .profile-action .title-black");
		title.appendChild(element);
	}

	function removeFF() {
		document.find(".tt-ff-scouter")?.remove();
	}

	function getUserID() {
		return parseInt(
			document.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").textContent.match(/(?<=\[)\d*(?=])/i)[0]
		);
	}
})();
