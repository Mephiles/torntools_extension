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
				step: 25,
				valueLow: filters.jail.scoreStart,
				valueHigh: filters.jail.scoreEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(scoreFilter.element);
		localFilters["Score Filter"] = { getStartEnd: scoreFilter.getStartEnd, updateCounter: scoreFilter.updateCounter };

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
		const timeStart = parseInt(times.start);
		const timeEnd = parseInt(times.end);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const scores = localFilters["Score Filter"].getStartEnd(content);
		const scoreStart = parseInt(scores.start);
		const scoreEnd = parseInt(scores.end);
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
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".users-list > li")) {
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

			// Faction
			const rowFaction = li.find(".user.faction");
			const factionImg = rowFaction.find(":scope > img");
			if (faction && faction !== "No faction" && faction !== "Unknown faction") {
				if (
					!rowFaction.href || // No faction
					(rowFaction.href && factionImg && factionImg.src === "https://factiontags.torn.com/0-0.png") || // Unknown faction
					(rowFaction.href && factionImg && faction !== factionImg.getAttribute("title").trim())
				) {
					hideRow(li);
					continue;
				}
			} else if (faction === "No faction") {
				if (rowFaction.href) {
					// Not "No faction"
					hideRow(li);
					continue;
				}
			} else if (faction === "Unknown faction") {
				if (!factionImg || (factionImg && factionImg.src !== "https://factiontags.torn.com/0-0.png")) {
					// Not "Unknown faction"
					hideRow(li);
					continue;
				}
			}

			// Time
			const timeLeftHrs = parseInt(li.find(".info-wrap .time").innerText.match(/[0-9]*(?=h)/g)[0]);
			if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs > timeEnd)) {
				hideRow(li);
				continue;
			}

			// Level
			const level = parseInt(li.find(".info-wrap .level").innerText.replace(/\D+/g, ""));
			if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
				hideRow(li);
				continue;
			}

			// Score
			const score = level * (timeLeftHrs + 3);
			if ((scoreStart && score < scoreStart) || (scoreEnd !== 100 && score > scoreEnd)) {
				hideRow(li);
				continue;
			}

			showRow(li);
		}

		function showRow(li) {
			li.classList.remove("hidden");
		}

		function hideRow(li) {
			li.classList.add("hidden");
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".users-list > li:not(.hidden)").length,
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
			if (document.find(".users-list > li:not(.hidden)")) {
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
				class: `fas fa-redo tt-quick-refresh ${customClass}`,
				events: {
					click: () => location.reload(),
				},
			});
		}

		function addQAndHref(iconNode) {
			if (iconNode.find(":scope > .tt-quick-q")) return;
			iconNode.appendChild(document.newElement({ type: "span", class: "tt-quick-q", text: "Q" }));
			iconNode.href = iconNode.href + "1";
		}

		function removeQAndHref(iconNode) {
			const quickQ = iconNode.find(":scope > .tt-quick-q");
			if (quickQ) quickQ.remove();
			if (iconNode.href.slice(-1) === "1") iconNode.href = iconNode.href.slice(0, -1);
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
				: rows.map((row) => row.innerText.trim()).filter((tag) => !!tag)
		);

		const factions = [];
		for (const faction of _factions) {
			factions.push({ value: faction, description: faction });
		}
		return factions;
	}

	function removeFilters() {
		removeContainer("Jail Filter");
		document.findAll(".users-list > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
