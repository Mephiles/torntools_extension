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

	let filterContent;
	let lastActionState = settings.scripts.lastAction.factionMember;
	function addListener() {
		if (isOwnFaction()) {
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

		const statistics = createStatistics("users");
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

		/* const newDiv = document.newElement({ type: "div" }); */

		const positionFilter = createFilterSection({
			title: "Position",
			select: getPositions(),
			defaults: "",
			callback: applyFilter,
		});
		/* newDiv.appendChild(positionFilter.element); */
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
		/* newDiv.appendChild(statusFilter.element); */
		filterContent.appendChild(statusFilter.element);
		localFilters["Status"] = { getSelections: statusFilter.getSelections };

		/* filterContent.appendChild(newDiv); */

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

		await applyFilter();
	}

	async function showLastAction() {
		if (!lastActionState || (localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element)) return;

		await requireElement(".members-list .table-body.tt-modified > .tt-last-action");
		let lastActionEndLimit = parseInt(document.find(".members-list .table-body.tt-modified").getAttribute("max-hours"));
		if (!lastActionEndLimit || lastActionEndLimit === filters.faction.lastActionStart || lastActionEndLimit > 1000) lastActionEndLimit = 1000;
		const lastActiveFilter = createFilterSection({
			title: "Last Active Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: lastActionEndLimit,
				step: 1,
				valueLow: filters.faction.lastActionStart >= lastActionEndLimit ? 0 : filters.faction.lastActionStart,
				valueHigh: filters.faction.lastActionEnd >= lastActionEndLimit ? lastActionEndLimit : filters.faction.lastActionEnd,
			},
			callback: applyFilter,
		});
		filterContent.appendChild(lastActiveFilter.element);
		localFilters["Last Active Filter"] = {
			getStartEnd: lastActiveFilter.getStartEnd,
			updateCounter: lastActiveFilter.updateCounter,
			element: lastActiveFilter.element,
		};
		await applyFilter();
	}

	async function removeLastAction() {
		if (!lastActionState && localFilters["Last Active Filter"] && localFilters["Last Active Filter"].element) {
			localFilters["Last Active Filter"].element.remove();
			document.findAll(".members-list .table-body > li.hidden.last-action").forEach((x) => {
				x.classList.remove("hidden");
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
		if (lastActionState) {
			await requireElement(".members-list .table-body.tt-modified > .tt-last-action");
			if (localFilters["Last Active Filter"])
				localFilters["Last Active Filter"].updateCounter(`Last action ${lastActionStart}h - ${lastActionEnd}h`, content);
		}

		// Save filters
		await ttStorage.change({ filters: { faction: { activity, status, levelStart, levelEnd, lastActionStart, lastActionEnd, special } } });

		for (const li of document.findAll(".members-list .table-body > li")) {
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

			// Level
			const level = parseInt(li.find(".lvl").innerText);
			if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
				hideRow(li);
				continue;
			}

			// Position
			if (position) {
				const liPosition = li.find(".position").innerText;
				if (liPosition !== position) {
					hideRow(li);
					continue;
				}
			}

			// Status
			if (status && status.length > 0 && status.length !== 4) {
				const liStatus = li.find(".status").innerText.toLowerCase().trim();
				if (!status.includes(liStatus)) {
					hideRow(li);
					continue;
				}
			}

			// Special
			let hideSpecial = false;
			for (const key in special) {
				const value = special[key];
				if (value === "both") continue;

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
				if ((lastActionStart && liLastAction < lastActionStart) || (lastActionEnd !== 1000 && liLastAction > lastActionEnd)) {
					hideRow(li, "last-action");
					continue;
				}
			}

			showRow(li);
		}

		function showRow(li) {
			li.classList.remove("hidden");
			li.classList.remove("last-action");
			if (li.nextSibling.className && li.nextSibling.className.includes("tt-last-action")) li.nextSibling.classList.remove("hidden");
		}

		function hideRow(li, customClass = "") {
			li.classList.add("hidden");
			if (customClass) li.classList.add(customClass);
			if (li.nextSibling.className && li.nextSibling.className.includes("tt-last-action")) li.nextSibling.classList.add("hidden");
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".members-list .table-body > li:not(.hidden)").length,
			document.findAll(".members-list .table-body > li").length,
			content
		);
	}

	function getPositions() {
		const _positions = new Set();
		document.findAll(".members-list .table-body > li > .position").forEach((x) => _positions.add(x.innerText));
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
		[..._positions].forEach((position) => positions.push({ value: position, description: position }));
		return positions;
	}

	function removeFilter() {
		localFilters = {};
		filterContent = undefined;
		removeContainer("Member Filter");
		document.findAll(".members-list .table-body > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
