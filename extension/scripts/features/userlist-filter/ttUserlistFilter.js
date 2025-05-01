"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Userlist Filter",
		"userlist",
		() => settings.pages.userlist.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.userlist.filter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.USERLIST_SWITCH_PAGE].push(() => {
			if (!feature.enabled()) return;

			filtering(false);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("Userlist Filter", { selector: "main" });
			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});
	}

	const localFilters = {};
	async function addFilters() {
		await requireElement(".userlist-wrapper .user-info-list-wrap");

		const { content } = createContainer("Userlist Filter", {
			class: "mt10",
			nextElement: document.find(".users-list-title"),
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

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.userlist.activity,
			callback: () => filtering(true),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const specialFilter = createFilterSection({
			title: "Special",
			ynCheckboxes: [
				"Fedded",
				"Fallen",
				"Traveling",
				"New Player",
				"On Wall",
				"In Company",
				"In Faction",
				"Is Donator",
				"In Hospital",
				"In Jail",
				"Early Discharge",
			],
			defaults: filters.userlist.special,
			callback: () => filtering(true),
		});
		filterContent.appendChild(specialFilter.element);
		localFilters["Special"] = { getSelections: specialFilter.getSelections };

		const hospReasonFilter = createFilterSection({
			title: "Hosp Reason",
			ynCheckboxes: ["Attacked By", "Mugged By", "Hospitalized By", "Other"],
			defaults: filters.userlist.hospReason,
			callback: () => filtering(true),
		});
		filterContent.appendChild(hospReasonFilter.element);
		localFilters["Hosp Reason"] = { getSelections: hospReasonFilter.getSelections };

		const levelFilter = createFilterSection({
			type: "LevelAll",
			typeData: {
				valueLow: filters.userlist.levelStart,
				valueHigh: filters.userlist.levelEnd,
			},
			callback: () => filtering(true),
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.userlist.estimates,
				callback: () => filtering(true),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		content.appendChild(filterContent);

		await filtering(false);
	}

	async function filtering(includeEstimates) {
		await requireElement(".user-info-list-wrap");
		await requireCondition(
			() =>
				!document.find(".user-info-list-wrap .ajax-placeholder, .user-info-list-wrap .ajax-preloader") ||
				document.find(".userlist-wrapper div=No users found"),
			{}
		);

		const content = findContainer("Userlist Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const special = localFilters["Special"].getSelections(content);
		const hospReason = localFilters["Hosp Reason"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			includeEstimates && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level and time slider counters
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				userlist: {
					activity: activity,
					levelStart: levelStart,
					levelEnd: levelEnd,
					special: special,
					hospReason: hospReason,
					estimates: statsEstimates ?? filters.userlist.estimates,
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".user-info-list-wrap > li")) {
			filterRow(li, { activity, special, hospReason, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Userlist Filter" });

		localFilters["Statistics"].updateStatistics(
			document.findAll(".user-info-list-wrap > li:not(.tt-hidden)").length,
			document.findAll(".user-info-list-wrap > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (row.find(".ajax-preloader")) return;

		if (filters.activity) {
			if (
				filters.activity.length &&
				!filters.activity.some(
					(x) =>
						x.trim() ===
						row
							.find("#iconTray li")
							.getAttribute("title")
							.match(/(?<=<b>).*(?=<\/b>)/g)[0]
							.toLowerCase()
							.trim()
				)
			) {
				hide("activity");
				return;
			}
		}
		if (filters.special) {
			const match = Object.entries(filters.special)
				.filter(([, value]) => value !== "both" && value !== "none")
				.find(([key, value]) => {
					const icons = getSpecialIcons(row);
					const filterIcons = SPECIAL_FILTER_ICONS[key];

					return (
						(value === "yes" && !icons.some((foundIcon) => filterIcons.includes(foundIcon))) ||
						(value === "no" && icons.some((foundIcon) => filterIcons.includes(foundIcon)))
					);
				});

			if (match) {
				hide(`special-${match[0]}`);
				return;
			}
		}

		if (filters.hospReason) {
			const match = Object.entries(filters.hospReason)
				.filter(([, value]) => value !== "both" && value !== "none")
				.find(([key, value]) => {
					const isHospitalized = row.querySelector("li[title*='Hospital']");

					if (isHospitalized) {
						const hospitalizationReason = isHospitalized.title.split("<br>")[1];

						if (key === "other") {
							return (
								(value === "yes" && HOSPITALIZATION_REASONS[key].some((reason) => hospitalizationReason.match(reason))) ||
								(value === "no" && !HOSPITALIZATION_REASONS[key].some((reason) => hospitalizationReason.match(reason)))
							);
						} else {
							return (
								(value === "yes" && !hospitalizationReason.includes(HOSPITALIZATION_REASONS[key])) ||
								(value === "no" && hospitalizationReason.includes(HOSPITALIZATION_REASONS[key]))
							);
						}
					}
				});

			if (match) {
				hide(`hospReason-${match[0]}`);
				return;
			}
		}
		if (filters.level) {
			const level = parseInt(row.find(".level .value").textContent);
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
				const content = findContainer("Userlist Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".user-info-list-wrap > li:not(.tt-hidden)").length,
					document.findAll(".user-info-list-wrap > li").length,
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
				const content = findContainer("Userlist Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".user-info-list-wrap > li:not(.tt-hidden)").length,
					document.findAll(".user-info-list-wrap > li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Userlist Filter");
		document.findAll(".user-info-list-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
