"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Faction Member Filter",
		"faction",
		() => settings.pages.faction.memberFilter,
		addListener,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.faction.memberFilter"],
		},
		null
	);

	let filterContent, lastActionState;

	function addListener() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
				if (!feature.enabled()) return;

				await addFilter();
				await showLastAction();
			});
		}
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
			if (!feature.enabled() || (localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element)) return;

			if (name === "Last Action") {
				await showLastAction();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
			if (!feature.enabled()) return;

			if (name === "Last Action") {
				await removeLastAction();
			}
		});

		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
			if (!feature.enabled()) return;

			await applyFilter();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE].push(async () => {
			if (!feature.enabled()) return;

			await applyFilter();
		});
	}

	let localFilters = {};

	async function addFilter() {
		if (isOwnFaction && getFactionSubpage() !== "info") return;

		await requireElement(".faction-info-wrap .members-list .table-row");

		const { content } = createContainer("Member Filter", {
			class: "mt10",
			nextElement: document.find(".faction-info-wrap > .members-list"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.faction.activity,
			callback: applyFilter,
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const specialFilter = createFilterSection({
			title: "Special",
			ynCheckboxes: ["Fedded", "Fallen", "New Player", "In Company", "Is Donator", "Is Recruit"],
			defaults: filters.faction.special,
			callback: applyFilter,
		});
		filterContent.appendChild(specialFilter.element);
		localFilters["Special"] = { getSelections: specialFilter.getSelections };

		const positionFilter = createFilterSection({
			title: "Position",
			select: getPositions(),
			defaults: "",
			callback: applyFilter,
		});
		filterContent.appendChild(positionFilter.element);
		localFilters["Position"] = { getSelected: positionFilter.getSelected };

		const statusFilter = createFilterSection({
			title: "Status",
			checkboxes: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
				{ id: "jail", description: "Jail" },
				{ id: "abroad", description: "Abroad" },
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.faction.status,
			callback: applyFilter,
		});
		filterContent.appendChild(statusFilter.element);
		localFilters["Status"] = { getSelections: statusFilter.getSelections };

		const levelFilter = createFilterSection({
			type: "LevelPlayer",
			typeData: {
				valueLow: filters.faction.levelStart,
				valueHigh: filters.faction.levelEnd,
			},
			callback: applyFilter,
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		content.appendChild(filterContent);

		applyFilter().then(() => {});

		if (settings.scripts.lastAction.factionMember && !lastActionState) {
			showLastAction().then(() => {});
		}
	}

	async function showLastAction() {
		if (lastActionState || (localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element)) return;

		await requireElement(".members-list .table-body.tt-modified > .tt-last-action");

		if (!filterContent || filterContent.find(".lastActiveFilter__section-class")) return;

		lastActionState = true;

		const upperLimit = parseInt(document.find(".members-list .table-body.tt-modified").getAttribute("max-hours")) || 1000;

		// noinspection JSIncompatibleTypesComparison
		const lastActiveFilter = createFilterSection({
			title: "Last Active Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: upperLimit,
				step: 1,
				valueLow: filters.faction.lastActionStart > upperLimit ? 0 : filters.faction.lastActionStart,
				valueHigh: filters.faction.lastActionEnd === -1 || filters.faction.lastActionEnd > upperLimit ? upperLimit : filters.faction.lastActionEnd,
			},
			callback: applyFilter,
		});
		filterContent.appendChild(lastActiveFilter.element);
		localFilters["Last Active Filter"] = {
			getStartEnd: lastActiveFilter.getStartEnd,
			updateCounter: lastActiveFilter.updateCounter,
			upperLimit,
			element: lastActiveFilter.element,
		};
		applyFilter().then(() => {});
	}

	async function removeLastAction() {
		if (!lastActionState && localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element) {
			lastActionState = false;
			localFilters["Last Active Filter"].element.remove();
			document.findAll(".members-list .table-body > li.tt-hidden.last-action").forEach((x) => {
				x.classList.remove("tt-hidden");
				x.classList.remove("last-action");
			});
			localFilters["Last Active Filter"] = undefined;
			await applyFilter();
		}
	}

	async function applyFilter() {
		await requireElement(".members-list .table-body > li");

		const content = findContainer("Member Filter").find("main");
		const activity = localFilters["Activity"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		const lastActionLimits =
			lastActionState && localFilters["Last Active Filter"]
				? localFilters["Last Active Filter"].getStartEnd(content)
				: { start: filters.faction.lastActionStart, end: filters.faction.lastActionEnd };
		const lastActionStart = parseInt(lastActionLimits.start);
		const lastActionEnd = parseInt(lastActionLimits.end);
		const position = localFilters["Position"].getSelected(content);
		const status = localFilters["Status"].getSelections(content);
		const special = localFilters["Special"].getSelections(content);

		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);
		if (lastActionState && localFilters["Last Active Filter"]) {
			await requireElement(".members-list .table-body.tt-modified > .tt-last-action");
			if (localFilters["Last Active Filter"])
				localFilters["Last Active Filter"].updateCounter(`Last action ${lastActionStart}h - ${lastActionEnd}h`, content);
		}

		// Save filters
		await ttStorage.change({
			filters: {
				faction: {
					activity,
					status,
					levelStart,
					levelEnd,
					lastActionStart,
					lastActionEnd:
						lastActionState && localFilters["Last Active Filter"] && lastActionEnd === localFilters["Last Active Filter"].upperLimit
							? -1
							: filters.faction.lastActionEnd,
					special,
				},
			},
		});

		for (const li of document.findAll(".members-list .table-body > li")) {
			// Activity
			if (activity.length) {
				const userActivity = li.find("[class*='userStatusWrap___'] svg").getAttribute("fill").match(FILTER_REGEXES.activity_v2_svg)[0];

				if (!activity.some((x) => x.trim() === userActivity)) {
					hideRow(li);
					continue;
				}
			}

			// Level
			const level = parseInt(li.find(".lvl").textContent);
			if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
				hideRow(li);
				continue;
			}

			// Position
			if (position) {
				const liPosition = li.find(".position .ellipsis").textContent.trim();
				if (liPosition !== position) {
					hideRow(li);
					continue;
				}
			}

			// Status
			if (status && status.length > 0 && status.length !== 5) {
				const liStatus = li.find(".status .ellipsis").textContent.trim().toLowerCase();
				if (!status.includes(liStatus)) {
					hideRow(li);
					continue;
				}
			}

			// Special
			let hideSpecial = false;
			for (const key in special) {
				const value = special[key];
				if (value === "both" || value === "none") continue;

				const foundIcons = getSpecialIcons(li);
				const definedIcons = SPECIAL_FILTER_ICONS[key];
				if (value === "yes") {
					if (!foundIcons.some((foundIcon) => definedIcons.includes(foundIcon))) {
						hideSpecial = true;
						break;
					}
				} else if (value === "no") {
					if (foundIcons.some((foundIcon) => definedIcons.includes(foundIcon))) {
						hideSpecial = true;
						break;
					}
				}
			}
			if (hideSpecial) {
				hideRow(li);
				continue;
			}

			// Last Action
			if (lastActionState && li.nextSibling && li.nextSibling.className && li.nextSibling.className.includes("tt-last-action")) {
				const liLastAction = parseInt(li.nextElementSibling.getAttribute("hours"));
				if ((lastActionStart && liLastAction < lastActionStart) || (lastActionEnd !== -1 && liLastAction > lastActionEnd)) {
					hideRow(li, "last-action");
					continue;
				}
			}

			showRow(li);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Faction Member Filter" });

		function showRow(li) {
			li.classList.remove("tt-hidden");
			li.classList.remove("last-action");
			if (li.nextElementSibling?.classList.contains("tt-last-action") || li.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				li.nextElementSibling.classList.remove("tt-hidden");

				if (
					li.nextElementSibling.nextElementSibling?.classList.contains("tt-last-action") ||
					li.nextElementSibling.nextElementSibling?.classList.contains("tt-stats-estimate")
				)
					li.nextElementSibling.nextElementSibling.classList.remove("tt-hidden");
			}
		}

		function hideRow(li, customClass = "") {
			li.classList.add("tt-hidden");
			if (customClass) li.classList.add(customClass);

			if (li.nextElementSibling?.classList.contains("tt-last-action") || li.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				li.nextElementSibling.classList.add("tt-hidden");

				if (
					li.nextElementSibling.nextElementSibling?.classList.contains("tt-last-action") ||
					li.nextElementSibling.nextElementSibling?.classList.contains("tt-stats-estimate")
				)
					li.nextElementSibling.nextElementSibling.classList.add("tt-hidden");
			}
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".members-list .table-body > li:not(.tt-hidden)").length,
			document.findAll(".members-list .table-body > li").length,
			content
		);
	}

	function getPositions() {
		const _positions = [];
		document.findAll(".members-list .table-body > li > .position .ellipsis").forEach((x) => {
			const position = x.textContent.trim();
			if (!_positions.includes(position)) _positions.push(position);
		});
		const positions = [
			{
				value: "",
				description: "All",
			},
			{
				value: "------",
				description: "------",
				disabled: true,
			},
		];
		_positions.forEach((position) => positions.push({ value: position, description: position }));
		return positions;
	}

	function removeFilter() {
		localFilters = {};
		filterContent = undefined;
		removeContainer("Member Filter");
		document.findAll(".members-list .table-body > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
