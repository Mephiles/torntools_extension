import { filters, settings } from "@common/utils/data/database";
import "./ranked-war-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, getUserActivity } from "@common/utils/functions/filters";
import { addFetchListener, CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, RANK_TRIGGERS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { hasStatsEstimatesLoaded } from "@features/stats-estimate/stats-estimate";

function initialiseFilters() {
	document.addEventListener("click", async (event) => {
		const rankedWarItem = (event.target as Element).closest("[class*='warListItem__']");
		if (rankedWarItem?.querySelector(":scope > [data-warid]")) {
			addFilters(
				(await requireElement(".descriptions .faction-war .enemy-faction", { parent: rankedWarItem.parentElement })).closest(".faction-war"),
			).catch(console.error);
		}
	});

	CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
		if (!FEATURE_MANAGER.isEnabled(RankedWarFilterFeature)) return;

		if (!row.closest(".faction-war")) {
			// Estimate didn't happen in a ranked war list.
			return;
		}

		const content = findContainer("Ranked War Filter", { selector: "main" });
		if (!content) return;

		const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
		if (!statsEstimates?.length) return;

		filterRow(row, { statsEstimates }, true);
	});

	addFetchListener(async ({ detail: { page, fetch } }) => {
		if (!FEATURE_MANAGER.isEnabled(RankedWarFilterFeature)) return;
		if (!location.hash.includes("#/war/rank")) return;

		const params = new URL(fetch.url).searchParams;
		if ((page === "page" && params.get("sid") === "factionsUsers") || (page === "faction_wars" && params.get("step") === "getwarusers")) {
			await filtering();
		}
	});
}

let interval: number | undefined;
const localFilters: any = {};

async function addFilters(rankedWarList?: Element) {
	if (interval) {
		clearInterval(interval);
		interval = undefined;
	}

	if (location.hash.includes("#/war/rank")) rankedWarList = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war");
	if (!rankedWarList) return;

	interval = setInterval(() => filtering(), 2500);

	const { content, options } = createContainer("Ranked War Filter", {
		nextElement: rankedWarList,
		compact: true,
		filter: true,
		applyRounding: false,
	});

	const statistics = createStatistics("players");
	content.appendChild(statistics.element);
	localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

	const filterContent = elementBuilder({
		type: "div",
		class: "content",
	});

	const activityFilter = createFilterSection({
		type: "Activity",
		defaults: filters.factionRankedWar.activity,
		callback: () => filtering(),
	});
	filterContent.appendChild(activityFilter.element);
	localFilters["Activity"] = { getSelections: activityFilter.getSelections };

	const statusFilter = createFilterSection({
		title: "Status",
		checkboxes: [
			{ id: "okay", description: "Okay" },
			{ id: "hospital", description: "Hospital" },
			{ id: "abroad", description: "Abroad" },
			{ id: "traveling", description: "Traveling" },
		],
		defaults: filters.factionRankedWar.status,
		callback: () => filtering(),
	});
	filterContent.appendChild(statusFilter.element);
	localFilters["Status"] = { getSelections: statusFilter.getSelections };

	const levelFilter = createFilterSection({
		type: "LevelPlayer",
		typeData: {
			valueLow: filters.factionRankedWar.levelStart,
			valueHigh: filters.factionRankedWar.levelEnd,
		},
		callback: () => filtering(),
	});
	filterContent.appendChild(levelFilter.element);
	localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

	if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars && hasAPIData()) {
		const estimatesFilter = createFilterSection({
			title: "Stats Estimates",
			checkboxes: [
				{ id: "none", description: "none" },
				...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
				{ id: "n/a", description: "N/A" },
			],
			defaults: filters.factionRankedWar.estimates,
			callback: () => filtering(),
		});
		filterContent.appendChild(estimatesFilter.element);

		localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
	}

	if (settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData()) {
		const ffScoreFilterMin = createFilterSection({
			title: "FF Score Min",
			text: "number",
			default: filters.factionRankedWar.ffScoreMin?.toString(),
			callback: () => filtering(),
		});
		ffScoreFilterMin.element.querySelector("input").step = 0.1;
		filterContent.appendChild(ffScoreFilterMin.element);
		localFilters["FF Score Min"] = { getValue: ffScoreFilterMin.getValue };

		const ffScoreFilterMax = createTextbox({
			type: "number",
		});
		ffScoreFilterMax.setValue(filters.factionRankedWar.ffScoreMax?.toString());
		ffScoreFilterMax.onChange(filtering);
		ffScoreFilterMax.element.step = "0.1";

		ffScoreFilterMin.element.appendChild(elementBuilder({ type: "strong", text: "FF Score Max" }));
		ffScoreFilterMin.element.append(ffScoreFilterMax.element);
		localFilters["FF Score Max"] = { getValue: ffScoreFilterMax.getValue };
	}

	content.appendChild(filterContent);

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(() => filtering());
	enabledFunnel.setEnabled(filters.factionRankedWar.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

	await filtering();
}

async function filtering() {
	const membersWrap = await requireElement(".faction-war[class*='membersWrap__']");

	const content = findContainer("Ranked War Filter");
	if (!content) return;

	const activity = localFilters["Activity"].getSelections(content);
	const status = localFilters["Status"].getSelections(content);
	const levels = localFilters["Level Filter"].getStartEnd(content);
	const levelStart = parseInt(levels.start);
	const levelEnd = parseInt(levels.end);
	const statsEstimates =
		hasStatsEstimatesLoaded("Faction Ranked Wars") && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars && hasAPIData()
			? localFilters["Stats Estimate"]?.getSelections(content)
			: undefined;
	const ffScoreMin = parseFloat(localFilters["FF Score Min"]?.getValue()) ?? null;
	const ffScoreMax = parseFloat(localFilters["FF Score Max"]?.getValue()) ?? null;

	// Update level slider counters
	localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

	// Save filters
	await ttStorage.change({
		filters: {
			factionRankedWar: {
				enabled: localFilters.enabled.isEnabled(),
				activity: activity,
				levelStart: levelStart,
				levelEnd: levelEnd,
				status: status,
				estimates: statsEstimates ?? filters.factionRankedWar.estimates,
				ffScoreMax,
				ffScoreMin,
			},
		},
	});

	// Actual Filtering
	if (!localFilters.enabled.isEnabled()) {
		findAllElements(".members-list > li.tt-hidden").forEach((row) => {
			row.classList.remove("tt-hidden");
			delete row.dataset.hideReason;
		});
		localFilters["Statistics"].updateStatistics(
			findAllElements(".members-list > li:not(.tt-hidden)", membersWrap).length,
			findAllElements(".members-list > li", membersWrap).length,
			content,
		);
		return;
	}

	for (const li of findAllElements(".members-list > li", membersWrap)) {
		filterRow(li, { activity, status, level: { start: levelStart, end: levelEnd }, statsEstimates, ffScoreMin, ffScoreMax }, false);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Ranked War Filter" });

	localFilters["Statistics"].updateStatistics(
		findAllElements(".members-list > li:not(.tt-hidden)", membersWrap).length,
		findAllElements(".members-list > li", membersWrap).length,
		content,
	);
}

interface RankedWarFilters {
	activity: string[];
	status: string[];
	level: {
		start: number;
		end: number;
	};
	statsEstimates: string[];
	ffScoreMax: number;
	ffScoreMin: number;
}

function filterRow(row: HTMLElement, filters: Partial<RankedWarFilters>, individual: boolean) {
	if (filters.activity) {
		const activity = getUserActivity(row);
		if (filters.activity.length && !filters.activity.some((x) => x.trim() === activity)) {
			hide("activity");
			return;
		}
	}
	if (filters.status?.length) {
		const statusElement = row.querySelector(".status");

		if (!filters.status.some((s) => statusElement.classList.contains(s))) {
			hide("status");
			return;
		}
	}
	if (filters.level) {
		const level = parseInt(row.querySelector(".level").textContent);
		if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
			hide("level");
			return;
		}
	}
	if (filters.statsEstimates) {
		if (filters.statsEstimates.length) {
			const estimate = row.dataset.estimate?.toLowerCase() ?? "none";
			if ((estimate !== "none" || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
				hide("stats-estimate");
				return;
			}
		}
	}
	if (filters.ffScoreMax || filters.ffScoreMin) {
		try {
			const gauge = row.querySelector(".tt-ff-scouter-indicator.indicator-lines");
			if (gauge) {
				const ffFloat: number = parseFloat(gauge.getAttribute("data-ff-scout"));
				if (!Number.isNaN(ffFloat)) {
					if (filters.ffScoreMax && !Number.isNaN(filters.ffScoreMax) && ffFloat > filters.ffScoreMax) {
						hide("ff-score");
						return;
					}
					if (filters.ffScoreMin && !Number.isNaN(filters.ffScoreMin) && ffFloat < filters.ffScoreMin) {
						hide("ff-score");
						return;
					}
				}
			}
		} catch (error) {
			console.error("TT - Failed to filter row by FF Score.", error);
		}
	}

	show();

	function show() {
		row.classList.remove("tt-hidden");
		delete row.dataset.hideReason;

		if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
			row.nextElementSibling.classList.remove("tt-hidden");
		}

		if (individual) {
			const content = findContainer("Ranked War Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".faction-war[class*='membersWrap__'] .members-list > li:not(.tt-hidden)").length,
				findAllElements(".faction-war[class*='membersWrap__'] .members-list > li").length,
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
			const content = findContainer("Ranked War Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".faction-war[class*='membersWrap__'] .members-list > li:not(.tt-hidden)").length,
				findAllElements(".faction-war[class*='membersWrap__'] .members-list > li").length,
				content,
			);
		}
	}
}

function removeFilters() {
	removeContainer("Ranked War Filter");
	findAllElements(".faction-war[class*='membersWrap__'] .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class RankedWarFilterFeature extends Feature {
	constructor() {
		super("Ranked War Filter", "faction");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.faction.rankedWarFilter;
	}

	initialise(): void {
		initialiseFilters();
	}

	async execute() {
		await addFilters();
	}

	cleanup() {
		removeFilters();
	}

	storageKeys(): string[] {
		return ["settings.pages.faction.rankedWarFilter"];
	}
}
