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

			filtering();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(() => {
			if (!feature.enabled()) return;

			const content = findContainer("Userlist Filter", { selector: "main" });
			if (!localFilters["Stats Estimate"]?.getSelections(content).length) return;

			filtering();
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
			callback: filtering,
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const specialFilter = createFilterSection({
			title: "Special",
			ynCheckboxes: ["Fedded", "Traveling", "New Player", "On Wall", "In Company", "In Faction", "Is Donator", "In Hospital", "In Jail"],
			defaults: filters.userlist.special,
			callback: filtering,
		});
		filterContent.appendChild(specialFilter.element);
		localFilters["Special"] = { getSelections: specialFilter.getSelections };

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.userlist.levelStart,
				valueHigh: filters.userlist.levelEnd,
			},
			callback: filtering,
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
				callback: filtering,
			});
			filterContent.appendChild(estimatesFilter.element);

			localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
		}

		content.appendChild(filterContent);

		await filtering();
	}

	async function filtering() {
		await requireElement(".user-info-list-wrap > li #iconTray");
		const content = findContainer("Userlist Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const special = localFilters["Special"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const statsEstimates =
			settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()
				? localFilters["Stats Estimate"]?.getSelections(content) ?? filters.userlist.estimates
				: filters.userlist.estimates;

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
					estimates: statsEstimates,
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".user-info-list-wrap > li")) {
			// Activity
			if (
				activity.length &&
				!activity.some(
					(x) =>
						x.trim() ===
						li
							.find("#iconTray li")
							.getAttribute("title")
							.match(/(?<=<b>).*(?=<\/b>)/g)[0]
							.toLowerCase()
							.trim()
				)
			) {
				hideRow(li);
				continue;
			}

			let hidden = false;
			for (const key in special) {
				const value = special[key];
				if (value === "both") continue;

				const foundIcons = getSpecialIcons(li);
				const definedIcons = SPECIAL_FILTER_ICONS[key];
				if (value === "yes") {
					if (!foundIcons.some((foundIcon) => definedIcons.includes(foundIcon))) {
						hidden = true;
						hideRow(li);
						break;
					}
				} else if (value === "no") {
					if (foundIcons.some((foundIcon) => definedIcons.includes(foundIcon))) {
						hidden = true;
						hideRow(li);
						break;
					}
				}
			}
			if (hidden) continue;

			// Level
			const level = parseInt(li.find(".level .value").innerText);
			if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
				hideRow(li);
				continue;
			}

			// Stats Estimates
			if (statsEstimates.length) {
				const estimate = li.dataset.estimate?.toLowerCase() ?? "none";
				if ((estimate !== "none" || !li.classList.contains("tt-estimated")) && !statsEstimates.includes(estimate)) {
					hideRow(li);
					continue;
				}
			}

			showRow(li);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		function showRow(li) {
			li.classList.remove("hidden");

			if (li.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				li.nextElementSibling.classList.remove("hidden");
			}
		}

		function hideRow(li) {
			li.classList.add("hidden");

			if (li.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				li.nextElementSibling.classList.add("hidden");
			}
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".user-info-list-wrap > li:not(.hidden)").length,
			document.findAll(".user-info-list-wrap > li").length,
			content
		);
	}

	function removeFilters() {
		removeContainer("Userlist Filter");
		document.findAll(".user-info-list-wrap > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
