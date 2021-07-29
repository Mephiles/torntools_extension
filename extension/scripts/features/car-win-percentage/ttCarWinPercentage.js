"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Car Win Percentage",
		"racing",
		() => settings.pages.racing.winPercentage,
		initialiseListener,
		addPercentage,
		removePercentage,
		{
			storage: ["settings.pages.racing.winPercentage"],
		},
		null
	);

	function initialiseListener() {
		addXHRListener(({ detail: { page, xhr } }) => {
			if (feature.enabled() && page === "loader" && xhr.responseURL.includes("tab=parts")) addPercentage();
		});
	}

	async function addPercentage() {
		await requireElement(".enlisted-stat");
		if (document.find(".tt-win-percentage")) return;
		document.findAll(".enlist-info").forEach((stat) => {
			const values = stat.find(".enlisted-stat").innerText.match(/(?<=• Races won: )\d*(?= • W)|(?<=• Races entered: )\d*(?= • )/g);
			const percentage = ((values[0] / values[1]) * 100).toFixed(2);
			if (percentage !== "NaN")
				stat.find(".enlisted-stat").insertAdjacentHTML(
					"beforeend",
					`<li class="tt-win-percentage">• Win Percentage: ${((values[0] / values[1]) * 100).toFixed(2)}% </li>`
				);
		});
	}

	function removePercentage() {
		document.findAll(".tt-win-percentage").forEach((x) => x.remove());
	}
})();
