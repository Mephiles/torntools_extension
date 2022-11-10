"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Fair Attack",
		"attack",
		() => settings.pages.attack.fairAttack && settings.pages.global.keepAttackHistory,
		null,
		showFF,
		removeFF,
		{
			storage: ["settings.pages.attack.fairAttack", "settings.pages.global.keepAttackHistory"],
		},
		async () => {
			if (!hasAPIData()) return "No API access.";

			await checkDevice();
		},
	);

	async function showFF() {
		await requireElement("div[class*='textEntries___']");

		const id = parseInt(getSearchParameters().get("user2ID"));
		const ff = attackHistory.history[id]?.latestFairFightModifier;
		if (!ff) return;

		const entries = document.find(
			mobile || tablet ?
				"div[class*='playersModelWrap___'] div[class*='header___']:nth-child(2) div[class*='textEntries___']" :
				"#defender div[class*='textEntries___']",
		);

		entries.classList.add("tt-fair-attack");
		entries.insertAdjacentElement(
			"afterbegin",
			document.newElement({
				type: "div",
				class: "tt-fair-attack",
				text: `FF: ${formatNumber(ff, { decimals: 2 })}`,
			}),
		);
	}

	function removeFF() {
		document.findAll(".tt-fair-attack").forEach((ff) => ff.remove());
	}
})();
