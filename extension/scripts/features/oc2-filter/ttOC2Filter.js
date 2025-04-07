"use strict";

(async () => {
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"OC2 Filter",
		"faction",
		() => settings.pages.faction.oc2Filter,
		addListener,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.faction.oc2Filter"],
		},
		() => {
			if (hasOC1Data()) return "Still on OC1.";
		}
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2].push(() => {
			if (!feature.enabled()) return;

			addFilter();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH].push(() => {
			if (!feature.enabled()) return;

			applyFilters();
		});
	}

	const localFilters = {};

	async function addFilter() {
		const list = await requireElement(".tt-oc2-list");
		await requireElement("[class*='loader___']", { parent: list, invert: true });

		const { content } = createContainer("OC Filter", {
			class: "mt10 mb10",
			previousElement: list.parentElement.querySelector(".page-head-delimiter"),
			filter: true,
		});

		const statistics = createStatistics("crimes");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({ type: "div", class: "content" });
		content.appendChild(filterContent);

		const difficultyFilter = createFilterSection({
			title: "Difficulty",
			checkboxes: [
				{ id: 1, description: "Level 1" },
				{ id: 2, description: "Level 2" },
				{ id: 3, description: "Level 3" },
				{ id: 4, description: "Level 4" },
				{ id: 5, description: "Level 5" },
				{ id: 6, description: "Level 6" },
				{ id: 7, description: "Level 7" },
				{ id: 8, description: "Level 8" },
				{ id: 9, description: "Level 9" },
				{ id: 10, description: "Level 10" },
			],
			defaults: filters.oc2.difficulty,
			callback: applyFilters,
		});
		filterContent.appendChild(difficultyFilter.element);
		localFilters.difficulty = { getSelections: difficultyFilter.getSelections };

		await applyFilters();
	}

	async function applyFilters() {
		await requireElement(".page-head-delimiter + div:not([class*='manualSpawnerContainer___'])");

		// Get the set filters
		const content = findContainer("OC Filter", { selector: "main" });

		const difficulty = localFilters.difficulty.getSelections(content).map((l) => parseInt(l));

		const filters = { difficulty };

		// Save the filters
		await ttStorage.change({ filters: { oc2: filters } });

		document.findAll(".tt-oc2-list > [class*='wrapper___']").forEach((li) => filterRow(li, filters));

		localFilters["Statistics"].updateStatistics(
			document.findAll(".tt-oc2-list > [class*='wrapper___']:not(.tt-hidden)").length,
			document.findAll(".tt-oc2-list > [class*='wrapper___']").length,
			content
		);
	}

	function filterRow(row, filters) {
		const level = row.querySelector("[class*='levelValue___']").textContent.getNumber();
		if (filters.difficulty.length && !filters.difficulty.includes(level)) {
			hide("difficulty");
			return;
		}

		show();

		function show() {
			row.classList.remove("tt-hidden");
			row.removeAttribute("data-hide-reason");
		}

		function hide(reason) {
			row.classList.add("tt-hidden");
			row.dataset.hideReason = reason;
		}
	}

	function removeFilter() {
		removeContainer("OC Filter");
		document.findAll(".tt-oc2-list .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
