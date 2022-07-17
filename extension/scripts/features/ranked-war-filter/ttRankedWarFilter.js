"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Ranked War Filter",
		"faction",
		() => settings.pages.faction.rankedWarFilter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.faction.rankedWarFilter"],
		},
		null
	);

	function initialiseFilters() {
		document.addEventListener("click", async (event) => {
			const rankedWarItem = event.target.closest("[class*='warListItem__']");
			if (rankedWarItem && rankedWarItem.find(":scope > [data-warid]")) {
				addFilters(
					(await requireElement(".descriptions .faction-war .enemy-faction", { parent: rankedWarItem.parentElement })).closest(".faction-war")
				).catch(console.error);
			}
		});

		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Ranked War Filter", { selector: "main" });
			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});

		addFetchListener(({ detail: { page, fetch } }) => {
			if (!feature.enabled()) return;

			if (page === "page" && new URL(fetch.url).searchParams.get("sid") === "factionsRankedWarring") filtering();
		});
	}

	const localFilters = {};
	async function addFilters(rankedWarList) {
		if (location.hash.includes("#/war/rank")) rankedWarList = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war");
		if (!rankedWarList) return;

		const { content } = createContainer("Ranked War Filter", {
			nextElement: rankedWarList,
			compact: true,
			filter: true,
			applyRounding: false,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.factionRankedWar.activity,
			callback: () => filtering(true),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const statusFilter = createFilterSection({
			title: "Status",
			checkboxes: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.factionRankedWar.status,
			callback: () => filtering(true),
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
				valueLow: filters.factionRankedWar.levelStart,
				valueHigh: filters.factionRankedWar.levelEnd,
			},
			callback: () => filtering(true),
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.factionRankedWar.estimates,
				callback: () => filtering(true),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		content.appendChild(filterContent);

		await filtering(false);
	}

	async function filtering(includeEstimates) {
		const membersWrap = await requireElement(".faction-war[class*='membersWrap__']");

		const content = findContainer("Ranked War Filter");
		const activity = localFilters["Activity"].getSelections(content);
		const status = localFilters["Status"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			includeEstimates && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level slider counters
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				factionRankedWar: {
					activity: activity,
					levelStart: levelStart,
					levelEnd: levelEnd,
					status: status,
					estimates: statsEstimates ?? filters.factionRankedWar.estimates,
				},
			},
		});

		// Actual Filtering
		for (const li of membersWrap.findAll(".members-list > li")) {
			filterRow(li, { activity, status, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			membersWrap.findAll(".members-list > li:not(.tt-hidden)").length,
			membersWrap.findAll(".members-list > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.activity) {
			const activity = row.find(".member.icons [class*='userStatusWrap___']").id.split("_")[1].split("-")[0].trim();
			if (filters.activity.length && !filters.activity.some((x) => x.trim() === activity)) {
				hide("activity");
				return;
			}
		}
		if (filters.status?.length) {
			let status = row.find(".status").textContent.toLowerCase().trim();
			if (status.includes(":")) status = "hospital";

			if (!filters.status.includes(status)) {
				hide("status");
				return;
			}
		}
		if (filters.level) {
			const level = parseInt(row.find(".level").textContent);
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
				const content = findContainer("Ranked War Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".faction-war[class*='membersWrap__'] .members-list > li:not(.tt-hidden)").length,
					document.findAll(".faction-war[class*='membersWrap__'] .members-list > li").length,
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
				const content = findContainer("Ranked War Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".faction-war[class*='membersWrap__'] .members-list > li:not(.tt-hidden)").length,
					document.findAll(".faction-war[class*='membersWrap__'] .members-list > li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Ranked War Filter");
		document.findAll(".faction-war[class*='membersWrap__'] .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
