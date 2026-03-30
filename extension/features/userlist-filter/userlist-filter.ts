import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, HOSPITALIZATION_REASONS, RANK_TRIGGERS, SPECIAL_FILTER_ICONS } from "@/utils/common/functions/torn";
import { filters, settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { requireCondition, requireElement } from "@/utils/common/functions/requires";
import { createFilterSection, createStatistics, getSpecialIcons, SpecialFilterValue } from "@/utils/common/functions/filters";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { hasAPIData } from "@/utils/common/functions/api";
import { createTextbox } from "@/utils/common/elements/textbox/textbox";
import { ttStorage } from "@/utils/common/data/storage";
import { hasStatsEstimatesLoaded } from "@/features/stats-estimate/stats-estimate";

function initialiseFilters() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.USERLIST_SWITCH_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;

		await filtering();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;

		const content = findContainer("Userlist Filter", { selector: "main" });
		const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
		if (!statsEstimates?.length) return;

		filterRow(row, { statsEstimates }, true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FF_SCOUTER_GAUGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;
		if (!localFilters["FF Score Max"].getValue() && !localFilters["FF Score Min"].getValue()) return;

		await filtering();
	});
}

const localFilters: any = {};
async function addFilters() {
	await requireElement(".userlist-wrapper .user-info-list-wrap");

	const { content } = createContainer("Userlist Filter", {
		class: "mt10",
		nextElement: document.querySelector(".users-list-title"),
		compact: true,
		filter: true,
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
		defaults: filters.userlist.activity,
		callback: () => filtering(),
	});
	filterContent.appendChild(activityFilter.element);
	localFilters["Activity"] = { getSelections: activityFilter.getSelections };

	const specialFilter = createFilterSection({
		title: "Special",
		ynCheckboxes: [
			"Fedded",
			"Fallen",
			"Traveling",
			"New Player",
			"On Wall",
			"In Company",
			"In Faction",
			"Is Donator",
			"In Hospital",
			"In Jail",
			"Early Discharge",
		],
		defaults: filters.userlist.special,
		callback: () => filtering(),
	});
	filterContent.appendChild(specialFilter.element);
	localFilters["Special"] = { getSelections: specialFilter.getSelections };

	const hospReasonFilter = createFilterSection({
		title: "Hosp Reason",
		ynCheckboxes: ["Attacked By", "Mugged By", "Hospitalized By", "Other"],
		defaults: filters.userlist.hospReason,
		callback: () => filtering(),
	});
	filterContent.appendChild(hospReasonFilter.element);
	localFilters["Hosp Reason"] = { getSelections: hospReasonFilter.getSelections };

	const levelFilter = createFilterSection({
		type: "LevelAll",
		typeData: {
			valueLow: filters.userlist.levelStart,
			valueHigh: filters.userlist.levelEnd,
		},
		callback: () => filtering(),
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
			callback: () => filtering(),
		});
		filterContent.appendChild(estimatesFilter.element);

		localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
	}
	if (settings.scripts.ffScouter.gauge && hasAPIData()) {
		const ffScoreFilterMin = createFilterSection({
			title: "FF Score Min",
			text: "number",
			default: filters.userlist.ffScoreMin?.toString(),
			callback: () => filtering(),
		});
		ffScoreFilterMin.element.querySelector("input").step = 0.1;
		filterContent.appendChild(ffScoreFilterMin.element);
		localFilters["FF Score Min"] = { getValue: ffScoreFilterMin.getValue };

		const ffScoreFilterMax = createTextbox({
			type: "number",
		});
		ffScoreFilterMax.setValue(filters.userlist.ffScoreMax?.toString());
		ffScoreFilterMax.onChange(filtering);
		ffScoreFilterMax.element.step = "0.1";

		ffScoreFilterMin.element.appendChild(elementBuilder({ type: "strong", text: "FF Score Max" }));
		ffScoreFilterMin.element.append(ffScoreFilterMax.element);
		localFilters["FF Score Max"] = { getValue: ffScoreFilterMax.getValue };
	}

	content.appendChild(filterContent);

	await filtering();
}

async function filtering() {
	await requireElement(".user-info-list-wrap");
	await requireCondition(() => {
		return (
			!document.querySelector(".user-info-list-wrap .ajax-placeholder, .user-info-list-wrap .ajax-preloader") ||
			document.evaluate(
				"//*[contains(@class, 'userlist-wrapper')][.//*[contains(text(), 'No users found')]]",
				document,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue
		);
	}, {});

	const content = findContainer("Userlist Filter", { selector: "main" });
	const activity: string[] = localFilters["Activity"].getSelections(content);
	const special: Record<string, SpecialFilterValue> = localFilters["Special"].getSelections(content);
	const hospReason: Record<string, SpecialFilterValue> = localFilters["Hosp Reason"].getSelections(content);
	const levels = localFilters["Level Filter"].getStartEnd(content);
	const levelStart = parseInt(levels.start);
	const levelEnd = parseInt(levels.end);
	const statsEstimates: string[] =
		hasStatsEstimatesLoaded("Userlist") && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()
			? localFilters["Stats Estimate"]?.getSelections(content)
			: undefined;

	// Update level and time slider counters
	localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

	const ffScoreMin = parseFloat(localFilters["FF Score Min"].getValue()) || null;
	const ffScoreMax = parseFloat(localFilters["FF Score Max"].getValue()) || null;

	// Save filters
	await ttStorage.change({
		filters: {
			userlist: {
				activity: activity,
				levelStart: levelStart,
				levelEnd: levelEnd,
				special: special,
				hospReason: hospReason,
				estimates: statsEstimates ?? filters.userlist.estimates,
				ffScoreMax,
				ffScoreMin,
			},
		},
	});

	// Actual Filtering
	for (const li of findAllElements(".user-info-list-wrap > li")) {
		filterRow(li, { activity, special, hospReason, level: { start: levelStart, end: levelEnd }, statsEstimates, ffScoreMin, ffScoreMax }, false);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Userlist Filter" });

	localFilters["Statistics"].updateStatistics(
		findAllElements(".user-info-list-wrap > li:not(.tt-hidden)").length,
		findAllElements(".user-info-list-wrap > li").length,
		content
	);
}

interface UserlistFilters {
	activity: string[];
	special: Record<string, SpecialFilterValue>;
	hospReason: Record<string, SpecialFilterValue>;
	level: {
		start: number;
		end: number;
	};
	statsEstimates: string[];
	ffScoreMin: number;
	ffScoreMax: number;
}

function filterRow(row: HTMLElement, filters: Partial<UserlistFilters>, individual: boolean) {
	if (row.querySelector(".ajax-preloader")) return;

	if (filters.activity) {
		if (
			filters.activity.length &&
			!filters.activity.some(
				(x) =>
					x.trim() ===
					row
						.querySelector("#iconTray li")
						.getAttribute("title")
						.match(/(?<=<b>).*(?=<\/b>)/g)[0]
						.toLowerCase()
						.trim()
			)
		) {
			hide("activity");
			return;
		}
	}
	if (filters.special) {
		const match = Object.entries(filters.special)
			.filter(([, value]) => value !== "both" && value !== "none")
			.find(([key, value]) => {
				const icons = getSpecialIcons(row);
				const filterIcons = SPECIAL_FILTER_ICONS[key];

				return (
					(value === "yes" && !icons.some((foundIcon) => filterIcons.includes(foundIcon))) ||
					(value === "no" && icons.some((foundIcon) => filterIcons.includes(foundIcon)))
				);
			});

		if (match) {
			hide(`special-${match[0]}`);
			return;
		}
	}

	if (filters.hospReason) {
		const match = Object.entries(filters.hospReason)
			.filter(([, value]) => value !== "both" && value !== "none")
			.find(([key, value]) => {
				const isHospitalized = row.querySelector("li[title*='Hospital']");

				if (isHospitalized) {
					const hospitalizationReason = isHospitalized.getAttribute("title").split("<br>")[1];

					if (key === "other") {
						return (
							(value === "yes" && HOSPITALIZATION_REASONS[key].some((reason) => hospitalizationReason.match(reason))) ||
							(value === "no" && !HOSPITALIZATION_REASONS[key].some((reason) => hospitalizationReason.match(reason)))
						);
					} else {
						return (
							(value === "yes" && !hospitalizationReason.includes(HOSPITALIZATION_REASONS[key])) ||
							(value === "no" && hospitalizationReason.includes(HOSPITALIZATION_REASONS[key]))
						);
					}
				}

				return false;
			});

		if (match) {
			hide(`hospReason-${match[0]}`);
			return;
		}
	}
	if (filters.level) {
		const level = parseInt(row.querySelector(".level .value").textContent);
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
				if (!isNaN(ffFloat)) {
					if (filters.ffScoreMax && !isNaN(filters.ffScoreMax) && ffFloat > filters.ffScoreMax) {
						hide("ff-score");
						return;
					}
					if (filters.ffScoreMin && !isNaN(filters.ffScoreMin) && ffFloat < filters.ffScoreMin) {
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
			const content = findContainer("Userlist Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".user-info-list-wrap > li:not(.tt-hidden)").length,
				findAllElements(".user-info-list-wrap > li").length,
				content
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
			const content = findContainer("Userlist Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".user-info-list-wrap > li:not(.tt-hidden)").length,
				findAllElements(".user-info-list-wrap > li").length,
				content
			);
		}
	}
}

function removeFilters() {
	removeContainer("Userlist Filter");
	findAllElements(".user-info-list-wrap > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class UserlistFilterFeature extends Feature {
	constructor() {
		super("Userlist Filter", "userlist");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.userlist.filter;
	}

	initialise() {
		initialiseFilters();
	}

	async execute() {
		await addFilters();
	}

	cleanup() {
		removeFilters();
	}

	storageKeys() {
		return ["settings.pages.userlist.filter"];
	}
}
