"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Jail Filter",
		"jail",
		() => settings.pages.jail.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.jail.filter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.JAIL_SWITCH_PAGE].push(() => {
			if (!feature.enabled()) return;

			filtering(true);
		});
	}

	const localFilters = {};
	const JAIL_FILTER_TIME_REGEX = /(\d+)(?=h)|(\d+)(?=m)/g;

	async function addFilters() {
		await requireElement(".userlist-wrapper .user-info-list-wrap .bust-icon");

		const { content, options } = createContainer("Jail Filter", {
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
			defaults: filters.jail.activity,
			callback: filtering,
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const factionFilter = createFilterSection({
			title: "Faction",
			select: [...defaultFactionsItems, ...getFactions()],
			defaults: "",
			callback: filtering,
		});
		filterContent.appendChild(factionFilter.element);
		localFilters["Faction"] = { getSelected: factionFilter.getSelected, updateOptions: factionFilter.updateOptions };

		const timeFilter = createFilterSection({
			title: "Time Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: 100,
				step: 1,
				valueLow: filters.jail.timeStart,
				valueHigh: filters.jail.timeEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(timeFilter.element);
		localFilters["Time Filter"] = { getStartEnd: timeFilter.getStartEnd, updateCounter: timeFilter.updateCounter };

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.jail.levelStart,
				valueHigh: filters.jail.levelEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		const scoreFilter = createFilterSection({
			title: "Score Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: 5000,
				step: 10,
				valueLow: filters.jail.scoreStart,
				valueHigh: filters.jail.scoreEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(scoreFilter.element);
		localFilters["Score Filter"] = { getStartEnd: scoreFilter.getStartEnd, updateCounter: scoreFilter.updateCounter };

		const bailCostFilter = createTextbox({ type: "number", description: "Maximum Bail Cost", min: 0 });
		bailCostFilter.setValue(filters.jail.bailCost || "");
		bailCostFilter.onChange(filtering);

		filterContent.appendChild(bailCostFilter.element);
		localFilters["Bail Cost"] = { getValue: bailCostFilter.getValue };

		content.appendChild(filterContent);

		const quickBust = createCheckbox({ description: "Quick Bust" });
		quickBust.onChange(applyQuickBustAndBail);
		quickBust.setChecked(quick.jail.includes("bust"));
		options.appendChild(quickBust.element);
		localFilters["Quick Bust"] = { isChecked: quickBust.isChecked };

		const quickBail = createCheckbox({ description: "Quick Bail" });
		quickBail.onChange(applyQuickBustAndBail);
		quickBail.setChecked(quick.jail.includes("bail"));
		options.appendChild(quickBail.element);
		localFilters["Quick Bail"] = { isChecked: quickBail.isChecked };

		await filtering();
	}

	async function filtering(pageChange) {
		await requireElement(".users-list > li");
		const content = findContainer("Jail Filter").find("main");
		const activity = localFilters["Activity"].getSelections(content);
		const faction = localFilters["Faction"].getSelected(content).trim();
		const times = localFilters["Time Filter"].getStartEnd(content);
		const bailCost = parseInt(localFilters["Bail Cost"].getValue());
		const timeStart = parseInt(times.start);
		const timeEnd = parseInt(times.end);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const scores = localFilters["Score Filter"].getStartEnd(content);
		const scoreStart = parseInt(scores.start);
		const scoreEnd = parseInt(scores.end);

		const educationBailPerk = userdata.education_perks.filter((perk) => perk.includes("bail cost reduction"));
		const jobBailPerk = userdata.job_perks.filter((perk) => perk.includes("bail cost reduction"));

		let bailMultiplier = 1;

		if (educationBailPerk.length > 0) {
			const eduReduction = parseFloat(educationBailPerk[0].split(" ")[1].replace("%", "")) / 100;
			bailMultiplier *= 1 - eduReduction;
		}
		if (jobBailPerk.length > 0) {
			const jobReduction = parseFloat(jobBailPerk[0].split(" ")[1].replace("%", "")) / 100;
			bailMultiplier *= 1 - jobReduction;
		}

		if (pageChange) {
			localFilters["Faction"].updateOptions([...defaultFactionsItems, ...getFactions()], content);
		}

		// Update level and time slider counters
		localFilters["Time Filter"].updateCounter(`Time ${timeStart}h - ${timeEnd}h`, content);
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);
		localFilters["Score Filter"].updateCounter(`Score ${scoreStart} - ${scoreEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				jail: {
					activity: activity,
					faction: faction,
					timeStart: timeStart,
					timeEnd: timeEnd,
					levelStart: levelStart,
					levelEnd: levelEnd,
					scoreStart: scoreStart,
					scoreEnd: scoreEnd,
					bailCost: bailCost,
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".users-list > li")) {
			// Activity
			if (activity.length && !activity.includes(li.find("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim())) {
				hideRow(li);
				continue;
			}

			// Faction
			const rowFaction = li.find(".user.faction");
			const hasFaction = !!rowFaction.href;
			const factionName = rowFaction.hasAttribute("rel")
				? rowFaction.find(":scope > img").getAttribute("title").trim() || "N/A"
				: rowFaction.textContent.trim();

			if (faction && faction !== "No faction" && faction !== "Unknown faction" && faction !== "In a faction") {
				if (!hasFaction || factionName === "N/A" || factionName !== faction) {
					hideRow(li);
					continue;
				}
			} else if (faction === "In a faction") {
				if (!hasFaction) {
					hideRow(li);
					continue;
				}
			} else if (faction === "No faction") {
				if (hasFaction) {
					hideRow(li);
					continue;
				}
			} else if (faction === "Unknown faction") {
				if (!hasFaction || factionName !== "N/A") {
					// Not "Unknown faction"
					hideRow(li);
					continue;
				}
			}

			// Time
			const timeText = li.find(".info-wrap .time").textContent;
			const timeLeft = timeText.match(JAIL_FILTER_TIME_REGEX);

			const timeLeftHrs = timeLeft.length > 1 ? parseInt(timeLeft[0]) : 0;

			if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs >= timeEnd)) {
				hideRow(li);
				continue;
			}

			// Level
			const level = li.find(".info-wrap .level").textContent.getNumber();
			if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
				hideRow(li);
				continue;
			}

			// bail cost
			if (bailCost) {
				const timeLeftMins = parseInt(timeLeft.length > 1 ? timeLeft[1] : timeLeft[0]);
				const totalMinutes = timeLeftMins + timeLeftHrs * 60;
				const bailTotalCost = totalMinutes * level * bailMultiplier * 100;
				if (bailTotalCost > bailCost) {
					hideRow(li);
					continue;
				}
			}

			// Score
			const score = level * (timeLeftHrs + 3);
			if ((scoreStart && score < scoreStart) || (scoreEnd !== 5000 && score > scoreEnd)) {
				hideRow(li);
				continue;
			}

			showRow(li);
		}

		function showRow(li) {
			li.classList.remove("tt-hidden");
		}

		function hideRow(li) {
			li.classList.add("tt-hidden");
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".users-list > li:not(.tt-hidden)").length,
			document.findAll(".users-list > li").length,
			content
		);

		await applyQuickBustAndBail();
	}

	async function applyQuickBustAndBail() {
		await requireElement(".users-list > li");

		const quickModes = [];
		const quickBust = localFilters["Quick Bust"].isChecked();
		const quickBail = localFilters["Quick Bail"].isChecked();

		if (quickBust) quickModes.push("bust");
		if (quickBail) quickModes.push("bail");

		await ttStorage.change({
			quick: {
				jail: quickModes,
			},
		});

		document.findAll(".tt-quick-refresh, .tt-quick-refresh-wrap").forEach((x) => x.remove());
		if (quickBust || quickBail) {
			if (document.find(".users-list > li:not(.tt-hidden)")) {
				if (!document.find(".users-list-title .tt-quick-refresh")) {
					document.find(".users-list-title").appendChild(newRefreshButton());
				}
			} else {
				document.find(".users-list").appendChild(
					document.newElement({
						type: "div",
						class: "tt-quick-refresh-wrap",
						children: [...(quickBail ? [newRefreshButton("tt-bail")] : []), ...(quickBust ? [newRefreshButton("tt-bust")] : [])],
					})
				);
			}
		}

		document.findAll(".users-list > li").forEach((li) => {
			if (quickBust) addQAndHref(li.find(":scope > [href*='breakout']"));
			else removeQAndHref(li.find(":scope > [href*='breakout']"));
			if (quickBail) addQAndHref(li.find(":scope > [href*='buy']"));
			else removeQAndHref(li.find(":scope > [href*='buy']"));
		});

		function newRefreshButton(customClass = "") {
			return document.newElement({
				type: "i",
				class: `fa-solid fa-arrow-rotate-right tt-quick-refresh ${customClass}`,
				events: {
					click: () => location.reload(),
				},
			});
		}

		function addQAndHref(iconNode) {
			if (iconNode.find(":scope > .tt-quick-q")) return;
			iconNode.appendChild(document.newElement({ type: "span", class: "tt-quick-q", text: "Q" }));
			iconNode.href = iconNode.getAttribute("href") + "1";
		}

		function removeQAndHref(iconNode) {
			const quickQ = iconNode.find(":scope > .tt-quick-q");
			if (quickQ) quickQ.remove();
			if (iconNode.href.slice(-1) === "1") iconNode.href = iconNode.getAttribute("href").slice(0, -1);
		}
	}

	function getFactions() {
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const _factions = new Set(
			document.findAll(".users-list > li .user.faction img").length
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
		removeContainer("Jail Filter");
		document.findAll(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
