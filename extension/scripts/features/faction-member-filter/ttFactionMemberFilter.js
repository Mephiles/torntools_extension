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
				lastActionState = true;
				await showLastAction();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
			if (!feature.enabled()) return;

			if (name === "Last Action") {
				lastActionState = false;
				await removeLastAction();
			}
		});
	}

	let localFilters = {};

	async function addFilter() {
		await requireElement("#faction-info-members .members-list .table-row");

		const { content } = createContainer("Member Filter", {
			class: "mt10",
			nextElement: document.getElementById("faction-info-members"),
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
			ynCheckboxes: ["Fedded", "New Player", "In Company", "Is Donator"],
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
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.faction.status,
			callback: applyFilter,
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
			lastActionState = true;
			showLastAction().then(() => {});
		}
	}

	async function showLastAction() {
		if (!lastActionState || (localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element)) return;

		await requireElement(".members-list .table-body.tt-modified > .tt-last-action");

		if (filterContent.find(".lastActiveFilter__section-class")) return;

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
			localFilters["Last Active Filter"].element.remove();
			document.findAll(".members-list .table-body > li.hidden.last-action").forEach((x) => {
				x.classList.remove("tt-hidden");
				x.classList.remove("last-action");
			});
			localFilters["Last Active Filter"] = undefined;
			await applyFilter();
		}
	}

	async function applyFilter() {
		_applyFilter().then(() => {});
	}

	async function _applyFilter() {
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
			if (
				activity.length &&
				!activity.some((x) => x.trim() === li.find("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim())
			) {
				hideRow(li);
				continue;
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
			if (status && status.length > 0 && status.length !== 4) {
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

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

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
			document.findAll(".members-list .table-body > li:not(.hidden)").length,
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
		document.findAll(".members-list .table-body > li.hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
