"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Recommended NNB",
		"faction",
		() => settings.pages.faction.recommendedNnb,
		initialiseListeners,
		null,
		null,
		{
			storage: ["settings.pages.faction.recommendedNnb"],
		},
		async () => {
			await checkMobile();
		}
	);

	const ORGANIZED_CRIMES = {
		Blackmail: "anyone",
		Kidnapping: "~20",
		"Bomb Threat": "25-30",
		"Planned Robbery": "30-40",
		"Rob a money train": "40-50",
		"Take over a cruise liner": "40-50",
		"Hijack a plane": "55-60",
		"Political Assassination": "~60",
	};

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showRecommendedNNB();
		});
	}

	async function showRecommendedNNB() {
		const parent = document.find(".faction-crimes-wrap .begin-wrap");

		const heading = parent.find(".plan-crimes[role=heading]");
		heading.appendChild(document.newElement({ type: "span", class: "tt-recommended-nnb", text: mobile ? "NNB" : "Recommended NNB" }));

		for (const crime of parent.findAll(".crimes-list .item-wrap .plan-crimes")) {
			crime.appendChild(document.newElement({ type: "span", class: "tt-recommended-nnb", text: ORGANIZED_CRIMES[crime.innerText] }));
		}
	}
})();
