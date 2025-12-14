"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate("HOF", true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.hof,
		registerListeners,
		showEstimates,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.hof"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function registerListeners() {
		addXHRListener(async ({ detail: { page, xhr } }) => {
			if (!feature.enabled()) return;
			if (page !== "halloffame") return;

			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");
			if (step !== "getListHallOfFame") return;

			const type = params.get("type");
			if (type === "battlestats" || type === "respect") return;

			await requireElement(".players-list .ajax-placeholder", { invert: true });

			showEstimates().catch(() => console.error(`Failed to load stats estimate for the '${type}' list.`));
		});
	}

	async function showEstimates() {
		await requireElement(".players-list > li");
		await requireElement(".players-list > li .ajax-preloader", { invert: true });

		const hofType = document.find(".hall-of-fame-list-wrap .hall-of-fame-wrap").classList[1];
		if (["battle", "respect", "factionchains", "factionrank"].includes(hofType)) return;

		const levelIndex = [...document.querySelector(".table-titles").children].findIndex((title) => title.textContent === "Level");
		if (levelIndex === -1) return;

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(".players-list > li:not(.empty)", (row) => ({
			id: parseInt(row.find(".user.name[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
			level: parseInt(row.find(`.player-info > li:nth-child(${levelIndex + 1})`).textContent),
		}));
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
