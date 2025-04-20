"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Competition Filter",
		"competition",
		() => settings.pages.competition.filter,
		initialiseFilters,
		startFeature,
		removeFilters,
		{
			storage: ["settings.pages.competition.filter"],
		},
		undefined,
		{ liveReload: true }
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.SWITCH_PAGE].push(() => {
			if (!feature.enabled()) return;

			const container = findContainer("Competition Filter");
			if (container)
				new MutationObserver((mutations, observer) => {
					if (
						![...mutations]
							.filter((mutation) => mutation.addedNodes.length)
							.some((mutation) => [...mutation.addedNodes].some((node) => node.classList?.contains("team-list-wrap")))
					)
						return;

					addFilters();
					observer.disconnect();
				}).observe(container.parentElement, { childList: true });
			else {
				addFilters();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Competition Filter", { selector: "main" });
			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});
	}

	const localFilters = {};

	function startFeature(forced) {
		if (!forced) return;

		if (document.find(".team-list-wrap")) addFilters();
	}

	async function addFilters() {
		await requireElement(".team-list-wrap");

		const { content } = createContainer("Competition Filter", {
			class: "mb10",
			nextElement: document.find(".show-available-members"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const levelFilter = createFilterSection({
			type: "LevelPlayer",
			typeData: {
				valueLow: filters.competition.levelStart,
				valueHigh: filters.competition.levelEnd,
			},
			callback: () => applyFilter(true),
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.competition && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.competition.estimates,
				callback: () => applyFilter(true),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		content.appendChild(filterContent);

		await applyFilter(false);
	}

	async function applyFilter(includeEstimates) {
		await requireElement(".team-list-wrap");

		const content = findContainer("Competition Filter", { selector: "main" });
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			includeEstimates && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.competition && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level and time slider counters
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				competition: {
					levelStart,
					levelEnd,
					estimates: statsEstimates ?? filters.competition.estimates,
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".competition-list > li")) {
			filterRow(li, { level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll(".competition-list > li:not(.tt-hidden)").length,
			document.findAll(".competition-list > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.level) {
			const level = row.find(".level").textContent.getNumber();
			if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
				hide("level");
				return;
			}
		}
		if (filters.statsEstimates) {
			if (filters.statsEstimates.length) {
				const estimate = row.dataset.estimate?.toLowerCase() ?? "none";
				if ((estimate !== "none" || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
					hide("stats-estimate");
					return;
				}
			}
		}

		show();

		function show() {
			row.classList.remove("tt-hidden");
			delete row.dataset.hideReason;

			if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				row.nextElementSibling.classList.remove("tt-hidden");
			}

			if (individual) {
				const content = findContainer("Competition Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".competition-list > li:not(.tt-hidden)").length,
					document.findAll(".competition-list > li").length,
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
				const content = findContainer("Competition Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".competition-list > li:not(.tt-hidden)").length,
					document.findAll(".competition-list > li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Competition Filter");
		document.findAll(".team-list-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
