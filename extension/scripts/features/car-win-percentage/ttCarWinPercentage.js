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
			if (
				feature.enabled() &&
				(page === "loader" || page === "page") &&
				(xhr.responseURL.includes("tab=parts") || xhr.responseURL.includes("tab=cars") || xhr.responseURL.includes("race_carlist.js"))
			)
				addPercentage();
		});
	}

	async function addPercentage() {
		await requireElement(".enlisted-stat");

		if (document.find(".tt-win-percentage")) return;

		const REGEX = /(Races won:) (\d)*|(Races entered:) (\d)*/;

		document.findAll(".enlist-info").forEach((stat) => {
			const values = [...stat.findAll(".enlisted-stat > li")]
				.map((item) => item.textContent.replace(/[^\d\w :]/g, "").trim())
				.filter((text) => REGEX.test(text))
				.map((text) => text.getNumber());

			let text;
			if (values[0] === 0) text = "• Win Percentage: 0%";
			else text = `• Win Percentage: ${((values[0] / values[1]) * 100).toFixed(2)}%`;

			stat.find(".enlisted-stat").insertAdjacentElement("beforeend", document.newElement({ type: "li", class: "tt-win-percentage", text: text }));
		});
	}

	function removePercentage() {
		document.findAll(".tt-win-percentage").forEach((x) => x.remove());
	}
})();
