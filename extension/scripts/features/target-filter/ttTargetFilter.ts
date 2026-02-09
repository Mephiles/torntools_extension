(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Target Filter",
		"targets",
		() => settings.pages.targets.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.targets.filter"],
		},
		() => "Disabled until further notice."
	);

	let filterSetupComplete: boolean = false;

	async function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Target Filter", { selector: "main" });
			if (!content) return;

			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});

		const listObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => isElement(node) && node.matches("li[class*='tableRow__']")))) {
				if (filterSetupComplete && feature.enabled()) applyFilters();
			}
		});

		const tableObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => isElement(node) && node.tagName === "UL"))) {
				if (filterSetupComplete && feature.enabled()) {
					applyFilters();
					listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
				}
			}
		});

		tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
		listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
	}

	const localFilters: any = {};

	async function addFilters() {
		const { content } = createContainer("Target Filter", {
			class: "mt10",
			nextElement: await requireElement(".wrapper[role='alert']"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("targets");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = elementBuilder({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.targets.activity,
			callback: () => applyFilters(),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const levelFilter = createFilterSection({
			type: "LevelAll",
			typeData: {
				valueLow: filters.targets.levelStart,
				valueHigh: filters.targets.levelEnd,
			},
			callback: () => applyFilters(),
		});
		filterContent.appendChild(levelFilter.element);
		content.appendChild(filterContent);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.targets.estimates,
				callback: () => applyFilters(),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		await applyFilters();

		filterSetupComplete = true;
	}

	async function applyFilters() {
		await requireElement(".tableWrapper ul > li");

		// Get the set filters
		const content = findContainer("Target Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			hasStatsEstimatesLoaded("Targets") && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level slider counter
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				targets: {
					activity,
					levelStart,
					levelEnd,
					estimates: statsEstimates ?? filters.targets.estimates,
				},
			},
		});

		// Actual Filtering
		for (const row of findAllElements(".tableWrapper ul > li")) {
			filterRow(row, { activity, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Target Filter" });

		localFilters["Statistics"].updateStatistics(
			findAllElements(".tableWrapper ul > li:not(.tt-hidden)").length,
			findAllElements(".tableWrapper ul > li").length,
			content
		);
	}

	interface TargetFilters {
		activity: string[];
		level: {
			start: number | null;
			end: number | null;
		};
		statsEstimates: string[];
	}

	function filterRow(row: HTMLElement, filters: Partial<TargetFilters>, individual: boolean) {
		if (filters.activity) {
			const activity = row.querySelector("[class*='userStatusWrap___'] svg").getAttribute("fill").match(FILTER_REGEXES.activity_v2_svg)[0];
			if (filters.activity.length && !filters.activity.some((x) => x.trim() === activity)) {
				hide("activity");
				return;
			}
		}
		if (filters.level?.start || filters.level?.end) {
			const level = convertToNumber(row.querySelector("[class*='level__']").textContent);
			if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
				hide("level");
				return;
			}
		}
		if (filters.statsEstimates && filters.statsEstimates.length) {
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
				const content = findContainer("Target Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					findAllElements("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
					findAllElements("ul.user-info-blacklist-wrap > li").length,
					content
				);
			}
		}

		function hide(reason: string) {
			row.classList.add("tt-hidden");
			row.dataset.hideReason = reason;

			if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				row.nextElementSibling.classList.add("tt-hidden");
			}

			if (individual) {
				const content = findContainer("Target Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					findAllElements("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
					findAllElements("ul.user-info-blacklist-wrap> li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Target Filter");
		findAllElements("ul.user-info-blacklist-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
