"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"FF Scouter Attack",
		"ff-scouter",
		() => settings.scripts.ffScouter.attack,
		null,
		showFF,
		removeFF,
		{
			storage: ["settings.scripts.ffScouter.attack", "settings.external.tornpal"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.tornpal) return "TornPal not enabled";
		}
	);

	async function showFF() {
		const id = getUserID();
		if (!id) return;

		const scout = await scoutFF(id);
		const { message, className, detailMessage } = buildScoutInformation(scout);

		const element = document.newElement({
			type: "span",
			class: ["tt-ff-scouter-attack", className],
			text: detailMessage ? `${message}: ${detailMessage}` : message,
		});

		const title = document.find("[class*='topSection___']");
		title.insertAdjacentElement("afterend", element);
	}

	function removeFF() {
		document.find(".tt-ff-scouter-attack")?.remove();
	}

	function getUserID() {
		const params = new URL(location.href).searchParams;
		const id = params.get("user2ID");
		if (!id) return null;

		return parseInt(id);
	}
})();
