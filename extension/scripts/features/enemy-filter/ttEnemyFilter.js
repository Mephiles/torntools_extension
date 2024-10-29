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

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Enemy Filter", { selector: "main" });
			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});
		addXHRListener(async ({ detail: { page, xhr } }) => {
			if (!feature.enabled()) return;
			if (page !== "userlist") return;

			const step = new URLSearchParams(xhr.requestBody).get("step");
			if (step !== "blackList") return;

			new MutationObserver((mutations, observer) => {
				addFilters();
				observer.disconnect();
			}).observe(document.find(".blacklist"), { childList: true });
		});
	}

	const localFilters = {};

	async function addFilters() {
		await requireElement("ul.user-info-blacklist-wrap");

		const { content } = createContainer("Enemy Filter", {
			class: "mt10",
			nextElement: document.find(".pagination-wrapper"),
			filter: true,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const statusFilter = createFilterSection({
			title: "Status",
			checkboxes: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
				{ id: "abroad", description: "Abroad" },
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.enemies.status,
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(statusFilter.element);
		localFilters["Status"] = { getSelections: statusFilter.getSelections };

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
	}

	async function applyFilters(includeEstimates) {
		await requireElement("ul.user-info-blacklist-wrap > li");

		// Get the set filters
		const content = findContainer("Enemy Filter", { selector: "main" });
		const status = localFilters["Status"].getSelections(content);
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
					status,
					levelStart,
					levelEnd,
					estimates: statsEstimates ?? filters.enemies.estimates,
				},
			},
		});

		// Actual Filtering
		for (const row of document.findAll("ul.user-info-blacklist-wrap > li")) {
			filterRow(row, { status, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
			document.findAll("ul.user-info-blacklist-wrap > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.status?.length && filters.status.length !== 2) {
			let status = row.find(".status :last-child").textContent.toLowerCase().trim();

			if (!filters.status.includes(status)) {
				hide("status");
				return;
			}
		}
		if (filters.level?.start || filters.level?.end) {
			const level = row.find(".level").textContent.getNumber();
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
