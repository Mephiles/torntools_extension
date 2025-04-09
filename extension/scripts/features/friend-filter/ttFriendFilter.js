"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Friend Filter",
		"friends",
		() => settings.pages.friends.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.friends.filter"],
		},
		null
	);

	let filterSetupComplete;
	async function initialiseFilters() {
		const listObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => node.matches("li[class*='tableRow__']")))) {
				if (filterSetupComplete && feature.enabled()) applyFilters();
			}
		});

		const tableObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].some((node) => node.tagName === "UL"))) {
				if (filterSetupComplete && feature.enabled()) {
					applyFilters();
					listObserver.observe(document.find(".tableWrapper > ul"), { childList: true });
				}
			}
		});

		tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
		listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
	}

	const localFilters = {};

	async function addFilters() {
		const { content } = createContainer("Friend Filter", {
			class: "mt10",
			nextElement: await requireElement(".wrapper[role='alert']"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("friends");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.friends.activity,
			callback: () => applyFilters(),
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.friends.levelStart,
				valueHigh: filters.friends.levelEnd,
			},
			callback: () => applyFilters(),
		});
		filterContent.appendChild(levelFilter.element);
		content.appendChild(filterContent);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		await applyFilters();

		filterSetupComplete = true;
	}

	async function applyFilters() {
		await requireElement(".tableWrapper ul > li");

		// Get the set filters
		const content = findContainer("Friend Filter", { selector: "main" });
		const activity = localFilters["Activity"].getSelections(content);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);

		// Update level slider counter
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({ filters: { friends: { activity, levelStart, levelEnd } } });

		// Actual Filtering
		for (const row of document.findAll(".tableWrapper ul > li")) {
			filterRow(row, { activity, level: { start: levelStart, end: levelEnd } }, false);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll(".tableWrapper ul > li:not(.tt-hidden)").length,
			document.findAll(".tableWrapper ul > li").length,
			content
		);
	}

	function filterRow(row, filters, individual) {
		if (filters.activity) {
			const activity = row.find("[class*='userStatusWrap___'] svg").getAttribute("fill").match(FILTER_REGEXES.activity_v2_svg)[0];
			if (filters.activity.length && !filters.activity.some((x) => x.trim() === activity)) {
				hide("activity");
				return;
			}
		}
		if (filters.level?.start || filters.level?.end) {
			const level = row.find("[class*='level__']").textContent.getNumber();
			if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
				hide("level");
				return;
			}
		}

		show();

		function show() {
			row.classList.remove("tt-hidden");
			row.removeAttribute("data-hide-reason");

			if (individual) {
				const content = findContainer("Friend Filter", { selector: "main" });

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
			if (individual) {
				const content = findContainer("Friend Filter", { selector: "main" });

				localFilters["Statistics"].updateStatistics(
					document.findAll("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
					document.findAll("ul.user-info-blacklist-wrap> li").length,
					content
				);
			}
		}
	}

	function removeFilters() {
		removeContainer("Friend Filter");
		document.findAll("ul.user-info-blacklist-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
