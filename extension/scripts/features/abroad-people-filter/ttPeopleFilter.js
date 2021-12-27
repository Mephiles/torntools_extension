"use strict";

(async () => {
	if (!isAbroad()) return;

	const feature = featureManager.registerFeature(
		"People Filter",
		"travel",
		() => settings.pages.travel.peopleFilter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.travel.peopleFilter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
			if (!feature.enabled()) return;

			const content = findContainer("People Filter", { selector: "main" });
			const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
			if (!statsEstimates?.length) return;

			filterRow(row, { statsEstimates }, true);
		});
	}

	const localFilters = {};

	async function addFilters() {
		await requireElement(".users-list");

		const { content } = createContainer("People Filter", {
			class: "mt10",
			nextElement: document.find(".users-list-title"),
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
			defaults: filters.abroadPeople.activity,
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const factionFilter = createFilterSection({
			title: "Faction",
			select: [...defaultFactionsItems, ...getFactions()],
			defaults: "",
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(factionFilter.element);
		localFilters["Faction"] = { getSelected: factionFilter.getSelected };

		const specialFilter = createFilterSection({
			title: "Special",
			ynCheckboxes: ["New Player", "In Company", "In Faction", "Is Donator"],
			defaults: filters.abroadPeople.special,
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(specialFilter.element);
		localFilters["Special"] = { getSelections: specialFilter.getSelections };

		const statusFilter = createFilterSection({
			title: "Status",
			checkboxes: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
			],
			defaults: filters.abroadPeople.status,
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
				valueLow: filters.abroadPeople.levelStart,
				valueHigh: filters.abroadPeople.levelEnd,
			},
			callback: () => applyFilters(true),
		});
		filterContent.appendChild(levelFilter.element);
		content.appendChild(filterContent);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()) {
			const estimatesFilter = createFilterSection({
				title: "Stats Estimates",
				checkboxes: [
					{ id: "none", description: "none" },
					...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
					{ id: "n/a", description: "N/A" },
				],
				defaults: filters.abroadPeople.estimates,
				callback: () => applyFilters(true),
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		await applyFilters();
	}

	async function applyFilters(includeEstimates) {
		await requireElement(".users-list > li");

		// Get the set filters
		const content = findContainer("People Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const faction = localFilters["Faction"].getSelected(content).trim();
		const special = localFilters["Special"].getSelections(content);
		const status = localFilters["Status"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			includeEstimates && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content)
				: undefined;

		// Update level slider counter
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				abroadPeople: {
					activity,
					faction,
					special,
					status,
					levelStart,
					levelEnd,
					estimates: statsEstimates ?? filters.abroadPeople.estimates,
				},
			},
		});

		// Actual Filtering
		for (const row of document.findAll(".users-list > li")) {
			filterRow(row, { activity, faction, special, status, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll(".users-list > li:not(.tt-hidden)").length,
			document.findAll(".users-list > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.activity?.length) {
			if (
				!filters.activity.some(
					(x) => x.trim() === row.find("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim()
				)
			) {
				hide("activity");
				return;
			}
		}
		if (filters.faction) {
			const factionElement = row.find(".user.faction");

			const hasFaction = !!factionElement.href;
			const factionName = hasFaction
				? factionElement.hasAttribute("rel")
					? factionElement.find(":scope > img").getAttribute("title").trim() || "N/A"
					: factionElement.textContent.trim()
				: false;
			const isUnknownFaction = hasFaction && factionName === "N/A";

			if (filters.faction === "No faction") {
				if (hasFaction) {
					hide("faction");
					return;
				}
			} else if (filters.faction === "Unknown faction") {
				if (!isUnknownFaction) {
					// Not "Unknown faction"
					hide("faction");
					return;
				}
			} else {
				if (
					!hasFaction || // No faction
					isUnknownFaction || // Unknown faction
					filters.faction !== factionName
				) {
					hide("faction");
					return;
				}
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
		if (filters.status?.length && filters.status.length !== 2) {
			const status = row.find(".status :last-child").textContent.toLowerCase().trim();

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
		if (filters.statsEstimates) {
			if (filters.statsEstimates.length) {
				const estimate = row.dataset.estimate?.toLowerCase();
				if ((estimate || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
					hide("stats-estimate");
					return;
				}
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
				const content = findContainer("People Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".users-list > li:not(.tt-hidden)").length,
					document.findAll(".users-list > li").length,
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
				const content = findContainer("People Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll(".users-list > li:not(.tt-hidden)").length,
					document.findAll(".users-list > li").length,
					content
				);
			}
		}
	}

	function getFactions() {
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const _factions = new Set(
			rows[0].find("img")
				? rows
						.map((row) => row.find("img"))
						.filter((img) => !!img)
						.map((img) => img.getAttribute("title").trim())
						.filter((tag) => !!tag)
				: rows.map((row) => row.textContent.trim()).filter((tag) => !!tag)
		);

		const factions = [];
		for (const faction of _factions) {
			factions.push({ value: faction, description: faction });
		}
		return factions;
	}

	function removeFilters() {
		removeContainer("People Filter");
		document.findAll(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
