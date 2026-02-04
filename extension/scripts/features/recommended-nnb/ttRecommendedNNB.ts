(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Recommended NNB",
		"faction",
		() => settings.pages.faction.recommendedNnb,
		initialiseListeners,
		startFeature,
		removeRecommendedNNB,
		{
			storage: ["settings.pages.faction.recommendedNnb"],
		},
		async () => {
			await checkDevice();
			return true;
		}
	);

	const ORGANIZED_CRIMES = {
		Blackmail: "anyone",
		Kidnapping: "~20",
		"Bomb Threat": "25-30",
		"Planned Robbery": "30-40",
		"Rob a money train": "40-50",
		"Take over a cruise liner": "40-55",
		"Hijack a plane": "55-60",
		"Political Assassination": "~60",
	};

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showRecommendedNNB();
		});
	}

	function startFeature() {
		if (!document.querySelector(".faction-crimes-wrap")) return;

		showRecommendedNNB();
	}

	async function showRecommendedNNB() {
		const parent = document.querySelector(".faction-crimes-wrap .begin-wrap");
		if (!parent) return;
		parent.classList.add("tt-modified");

		const heading = parent.querySelector(".plan-crimes[role=heading]");
		heading.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: mobile ? "NNB" : "Recommended NNB" }));

		for (const crime of findAllElements(".crimes-list .item-wrap .plan-crimes", parent)) {
			crime.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: ORGANIZED_CRIMES[crime.textContent] }));
		}
	}

	function removeRecommendedNNB() {
		document.querySelector(".faction-crimes-wrap .begin-wrap")?.classList.remove("tt-modified");

		for (const nnb of findAllElements(".tt-recommended-nnb")) {
			nnb.remove();
		}
	}
})();
