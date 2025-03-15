"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Enemy Filter",
		"enemies",
		() => settings.pages.enemies.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.enemies.filter"],
		},
		null
	);

	let filterSetupComplete;
	async function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Enemy Filter", { selector: "main" });
			if (!content) return;

			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});

		const observer = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => node.tagName === "UL"))) {
				if (filterSetupComplete && feature.enabled())
					applyFilters(true);
			}
		});
		observer.observe(await requireElement(".tableWrapper"), { childList: true });
	}

	const localFilters = {};

	async function addFilters() {
		const { content } = createContainer("Enemy Filter", {
			class: "mt10",
			nextElement: await requireElement(".wrapper[role='alert']"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("enemies");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.enemies.activity,
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.enemies.levelStart,
				valueHigh: filters.enemies.levelEnd,
			},
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(levelFilter.element);
		content.appendChild(filterContent);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.enemies && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.enemies.estimates,
				callback: () => applyFilters(true),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		await applyFilters();

		filterSetupComplete = true;
	}

	async function applyFilters(includeEstimates) {
		await requireElement(".tableWrapper ul > li");

		// Get the set filters
		const content = findContainer("Enemy Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			includeEstimates && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.enemies && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level slider counter
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				enemies: {
					activity,
					levelStart,
					levelEnd,
					estimates: statsEstimates ?? filters.enemies.estimates,
				},
			},
		});

		// Actual Filtering
		for (const row of document.findAll(".tableWrapper ul > li")) {
			filterRow(row, { activity, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll(".tableWrapper ul > li:not(.tt-hidden)").length,
			document.findAll(".tableWrapper ul > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.activity) {
			const activity = row.find("[class*='userStatusWrap___'] svg").getAttribute("fill").match(FILTER_REGEXES.activity_v2_svg)[0];
			if (
				filters.activity.length &&
				!filters.activity.some(
					(x) =>
						x.trim() === activity
				)
			) {
				hide("activity");
				return;
			}
		}
		if (filters.level?.start || filters.level?.end) {
			const level = row.find("[class*='level__']").textContent.getNumber();
			if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
				hide("level");
				return;
			}
		}
		if (filters.statsEstimates && filters.statsEstimates.length) {
			// TODO - Implement for the enemy filter. Make sure to put the required data on the dataset first.
			const estimate = row.dataset.estimate?.toLowerCase();
			if ((estimate || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
				hide("stats-estimate");
				return;
			}
		}

		show();

		function show() {
			row.classList.remove("tt-hidden");
			row.removeAttribute("data-hide-reason");

			if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				row.nextElementSibling.classList.remove("tt-hidden");
			}

			if (individual) {
				const content = findContainer("Enemy Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
					document.findAll("ul.user-info-blacklist-wrap > li").length,
					content
				);
			}
		}

		function hide(reason) {
			row.classList.add("tt-hidden");
			row.dataset.hideReason = reason;

			if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				row.nextElementSibling.classList.add("tt-hidden");
			}

			if (individual) {
				const content = findContainer("Enemy Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
					document.findAll("ul.user-info-blacklist-wrap> li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Enemy Filter");
		document.findAll("ul.user-info-blacklist-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
