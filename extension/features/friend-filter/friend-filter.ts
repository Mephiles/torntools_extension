import { DisabledUntilNoticeFeature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, FILTER_REGEXES } from "@/utils/common/functions/filters";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

let filterSetupComplete: boolean = false;
let listObserver: MutationObserver;
let tableObserver: MutationObserver;
const localFilters: Record<string, any> = {};

async function initialiseFilters() {
	listObserver = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.matches("li[class*='tableRow__']")))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(FriendFilterFeature)) applyFilters();
		}
	});

	tableObserver = new MutationObserver((mutations) => {
		if (mutations.some((mutation) => Array.from(mutation.addedNodes).some((node) => isElement(node) && node.tagName === "UL"))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(FriendFilterFeature)) {
				applyFilters();
				listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
			}
		}
	});

	tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
	listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
}

async function addFilters() {
	const { content, options } = createContainer("Friend Filter", {
		class: "mt10",
		nextElement: await requireElement(".wrapper[role='alert']"),
		compact: true,
		filter: true,
	});

	const statistics = createStatistics("friends");
	content.appendChild(statistics.element);
	localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

	const filterContent = elementBuilder({
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
		type: "LevelAll",
		typeData: {
			valueLow: filters.friends.levelStart,
			valueHigh: filters.friends.levelEnd,
		},
		callback: () => applyFilters(),
	});
	filterContent.appendChild(levelFilter.element);
	content.appendChild(filterContent);
	localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(() => applyFilters());
	enabledFunnel.setEnabled(filters.friends.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

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
	await ttStorage.change({ filters: { friends: { enabled: localFilters.enabled.isEnabled(), activity, levelStart, levelEnd } } });

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
		filterRow(row, { activity, level: { start: levelStart, end: levelEnd } }, false);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Friend Filter" });

	localFilters["Statistics"].updateStatistics(
		findAllElements(".tableWrapper ul > li:not(.tt-hidden)").length,
		findAllElements(".tableWrapper ul > li").length,
		content,
	);
}

interface FriendFilters {
	activity: string[];
	level: {
		start: number | null;
		end: number | null;
	};
}

function filterRow(row: HTMLElement, filters: Partial<FriendFilters>, individual: boolean) {
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

	show();

	function show() {
		row.classList.remove("tt-hidden");
		row.removeAttribute("data-hide-reason");

		if (individual) {
			const content = findContainer("Friend Filter", { selector: "main" });

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
		if (individual) {
			const content = findContainer("Friend Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements("ul.user-info-blacklist-wrap > li:not(.tt-hidden)").length,
				findAllElements("ul.user-info-blacklist-wrap> li").length,
				content,
			);
		}
	}
}

function removeFilters() {
	removeContainer("Friend Filter");
	findAllElements("ul.user-info-blacklist-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	if (listObserver) listObserver.disconnect();
	if (tableObserver) tableObserver.disconnect();
	filterSetupComplete = false;
}

export default class FriendFilterFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Friend Filter", "friends");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.friends.filter;
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
		return ["settings.pages.friends.filter"];
	}
}
