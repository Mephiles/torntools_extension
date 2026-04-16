import { DisabledUntilNoticeFeature, FEATURE_MANAGER } from "@/features/feature-manager";
import { hasStatsEstimatesLoaded } from "@/features/stats-estimate/stats-estimate";
import { filters, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { hasAPIData } from "@/utils/common/functions/api";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, FILTER_REGEXES } from "@/utils/common/functions/filters";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, RANK_TRIGGERS } from "@/utils/common/functions/torn";

let filterSetupComplete: boolean = false;

async function initialiseFilters() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
		if (!FEATURE_MANAGER.isEnabled(TargetFilterFeature)) return;

		const content = findContainer("Target Filter", { selector: "main" });
		if (!content) return;

		const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
		if (!statsEstimates?.length) return;

		filterRow(row, { statsEstimates }, true);
	});

	const listObserver = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.matches("li[class*='tableRow__']")))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(TargetFilterFeature)) applyFilters();
		}
	});

	const tableObserver = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.tagName === "UL"))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(TargetFilterFeature)) {
				applyFilters();
				listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
			}
		}
	});

	tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
	listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
}

const localFilters: any = {};

async function addFilters() {
	const { content, options } = createContainer("Target Filter", {
		class: "mt10",
		nextElement: await requireElement(".wrapper[role='alert']"),
		compact: true,
		filter: true,
	});

	const statistics = createStatistics("targets");
	content.appendChild(statistics.element);
	localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

	const filterContent = elementBuilder({
		type: "div",
		class: "content",
	});

	const activityFilter = createFilterSection({
		type: "Activity",
		defaults: filters.targets.activity,
		callback: () => applyFilters(),
	});
	filterContent.appendChild(activityFilter.element);
	localFilters["Activity"] = { getSelections: activityFilter.getSelections };

	const levelFilter = createFilterSection({
		type: "LevelAll",
		typeData: {
			valueLow: filters.targets.levelStart,
			valueHigh: filters.targets.levelEnd,
		},
		callback: () => applyFilters(),
	});
	filterContent.appendChild(levelFilter.element);
	content.appendChild(filterContent);
	localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

	if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets && hasAPIData()) {
		const estimatesFilter = createFilterSection({
			title: "Stats Estimates",
			checkboxes: [
				{ id: "none", description: "none" },
				...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
				{ id: "n/a", description: "N/A" },
			],
			defaults: filters.targets.estimates,
			callback: () => applyFilters(),
		});
		filterContent.appendChild(estimatesFilter.element);

		localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
	}

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(() => applyFilters());
	enabledFunnel.setEnabled(filters.targets.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

	await applyFilters();

	filterSetupComplete = true;
}

async function applyFilters() {
	await requireElement(".tableWrapper ul > li");

	// Get the set filters
	const content = findContainer("Target Filter", { selector: "main" });
	const activity = localFilters["Activity"].getSelections(content);
	const levels = localFilters["Level Filter"].getStartEnd(content);
	const levelStart = parseInt(levels.start);
	const levelEnd = parseInt(levels.end);
	const statsEstimates =
		hasStatsEstimatesLoaded("Targets") && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets && hasAPIData()
			? localFilters["Stats Estimate"]?.getSelections(content)
			: undefined;

	// Update level slider counter
	localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

	// Save filters
	await ttStorage.change({
		filters: {
			targets: {
				enabled: localFilters.enabled.isEnabled(),
				activity,
				levelStart,
				levelEnd,
				estimates: statsEstimates ?? filters.targets.estimates,
			},
		},
	});

	// Actual Filtering
	if (!localFilters.enabled.isEnabled()) {
		findAllElements(".tableWrapper ul > li.tt-hidden").forEach((row) => {
			row.classList.remove("tt-hidden");
			delete row.dataset.hideReason;
		});
		localFilters["Statistics"].updateStatistics(
			findAllElements(".tableWrapper ul > li:not(.tt-hidden)").length,
			findAllElements(".tableWrapper ul > li").length,
			content,
		);
		return;
	}

	for (const row of findAllElements(".tableWrapper ul > li")) {
		filterRow(row, { activity, level: { start: levelStart, end: levelEnd }, statsEstimates }, false);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Target Filter" });

	localFilters["Statistics"].updateStatistics(
		findAllElements(".tableWrapper ul > li:not(.tt-hidden)").length,
		findAllElements(".tableWrapper ul > li").length,
		content,
	);
}

interface TargetFilters {
	activity: string[];
	level: {
		start: number | null;
		end: number | null;
	};
	statsEstimates: string[];
}

function filterRow(row: HTMLElement, filters: Partial<TargetFilters>, individual: boolean) {
	if (filters.activity) {
		const activity = row.querySelector("[class*='userStatusWrap___'] svg").getAttribute("fill").match(FILTER_REGEXES.activity_v2_svg)[0];
		if (filters.activity.length && !filters.activity.some((x) => x.trim() === activity)) {
			hide("activity");
			return;
		}
	}
	if (filters.level?.start || filters.level?.end) {
		const level = convertToNumber(row.querySelector("[class*='level__']").textContent);
		if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
			hide("level");
			return;
		}
	}
	if (filters.statsEstimates?.length) {
		const estimate = row.dataset.estimate?.toLowerCase();
		if ((estimate || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
			hide("stats-estimate");
			return;
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
			const content = findContainer("Target Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
				findAllElements("ul.user-info-blacklist-wrap > li").length,
				content,
			);
		}
	}

	function hide(reason: string) {
		row.classList.add("tt-hidden");
		row.dataset.hideReason = reason;

		if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
			row.nextElementSibling.classList.add("tt-hidden");
		}

		if (individual) {
			const content = findContainer("Target Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
				findAllElements("ul.user-info-blacklist-wrap> li").length,
				content,
			);
		}
	}
}

function removeFilters() {
	removeContainer("Target Filter");
	findAllElements("ul.user-info-blacklist-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class TargetFilterFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Target Filter", "targets");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.targets.filter;
	}

	async initialise() {
		await initialiseFilters();
	}

	async execute() {
		await addFilters();
	}

	cleanup() {
		removeFilters();
	}

	storageKeys() {
		return ["settings.pages.targets.filter"];
	}
}
