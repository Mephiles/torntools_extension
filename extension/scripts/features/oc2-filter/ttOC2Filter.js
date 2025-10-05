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

		// Crime Status Filter (always create if on completed crimes tab)
		if (isCompletedCrimesTab()) {
			const statusFilter = createFilterSection({
				title: "Crime Status",
				checkboxes: [
					{ id: "paid", description: "Paid" },
					{ id: "unpaid", description: "Unpaid" },
					{ id: "chain", description: "Chain" },
					{ id: "failed", description: "Failed" },
				],
				defaults: filters.oc2.status || ["paid", "unpaid", "chain", "failed"],
				callback: applyFilters,
			});
			filterContent.appendChild(statusFilter.element);
			localFilters.status = { getSelections: statusFilter.getSelections };
		}

		await applyFilters();
	}

	async function applyFilters() {
		await requireElement(".page-head-delimiter + div:not([class*='manualSpawnerContainer___'])");

		// Get the set filters
		const content = findContainer("OC Filter", { selector: "main" });

		const difficulty = localFilters.difficulty.getSelections(content).map((l) => parseInt(l));
		const status = localFilters.status ? localFilters.status.getSelections(content) : [];

		const filters = { difficulty, status };

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

		// Check crime status filter (only apply if we're on completed crimes tab and filters are set)
		if (localFilters.status && filters.status.length && isCompletedCrimesTab()) {
			const crimeStatus = getCrimeStatus(row);
			if (crimeStatus && !filters.status.includes(crimeStatus)) {
				hide("status");
				return;
			}
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

	// Helper function to determine if we're on the completed crimes tab
	function isCompletedCrimesTab() {
		// Check if we're viewing completed crimes
		const activeTab = document.querySelector("#faction-crimes-root [class*='buttonsContainer___'] > [class*='active___']");

		if (!activeTab) {
			return false; // Default to false if we can't determine tab
		}

		const tabText = activeTab.textContent.trim().toLowerCase();

		// Check if the active tab is "completed"
		return tabText.includes("completed");
	}

	// Helper function to determine crime status from the row element
	function getCrimeStatus(row) {
		// Check for failed crimes - look for div with class containing "failed"
		const failedDiv = row.querySelector('div[class*="failed"]');
		if (failedDiv) {
			return "failed";
		}

		// Check for success crimes - look for div with class containing "success"
		const successDiv = row.querySelector('div[class*="success"]');
		if (successDiv) {
			// For successful crimes, check if it's paid, unpaid, or chain

			// Check for paid crimes - look for span with aria-label="Paid"
			const paidSpan = row.querySelector('span[aria-label="Paid"]');
			if (paidSpan) {
				return "paid";
			}

			// Check for unpaid crimes - look for button with class containing "payoutBtn" and text "PayOut"
			const payoutButton = row.querySelector('button[class*="payoutBtn"]');
			if (payoutButton && payoutButton.textContent.includes("PayOut")) {
				return "unpaid";
			}

			// Check for chain crimes - look for div with class containing "nextCrimeContainer"
			const nextCrimeDiv = row.querySelector('div[class*="nextCrimeContainer"]');
			if (nextCrimeDiv) {
				return "chain";
			}

			return "unpaid";
		}

		return null;
	}
})();
