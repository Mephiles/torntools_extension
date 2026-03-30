import { Feature } from "@/features/feature-manager";
import { isAbroad, RANK_TRIGGERS, SPECIAL_FILTER_ICONS } from "@/utils/common/functions/torn";
import { filters, settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { ttStorage } from "@/utils/common/data/storage";
import {
	createFilterSection,
	createStatistics,
	defaultFactionsItems,
	FILTER_REGEXES,
	getSpecialIcons,
	type SpecialFilterValue,
} from "@/utils/common/functions/filters";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { createTextbox } from "@/utils/common/elements/textbox/textbox";
import { hasStatsEstimatesLoaded } from "@/features/stats-estimate/stats-estimate";

const localFilters = {};

function initialiseFilters() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.STATS_ESTIMATED].push(({ row }) => {
		const content = findContainer("People Filter", { selector: "main" });
		const statsEstimates = localFilters["Stats Estimate"]?.getSelections(content);
		if (!statsEstimates?.length) return;

		filterRow(row, { statsEstimates }, true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FF_SCOUTER_GAUGE].push(async () => {
		if (!localFilters["FF Score Max"].getValue() && !localFilters["FF Score Min"].getValue()) return;

		await applyFilters();
	});
}

async function addFilters() {
	await requireElement(".users-list");

	const { content } = createContainer("People Filter", {
		class: "mt10",
		nextElement: document.querySelector(".users-list-title"),
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
		defaults: filters.abroadPeople.activity,
		callback: () => applyFilters(),
	});
	filterContent.appendChild(activityFilter.element);
	localFilters["Activity"] = { getSelections: activityFilter.getSelections };

	const onPageFactions = getFactions();
	const isPreviousFactionSelectionPresent =
		!["", "No faction", "Unknown faction", "In a faction"].includes(filters.abroadPeople.faction) &&
		onPageFactions.some((option) => option.value === filters.abroadPeople.faction);
	const factionFilter = createFilterSection({
		title: "Faction",
		select: [
			...(isPreviousFactionSelectionPresent ? [] : [{ value: filters.abroadPeople.faction, description: filters.abroadPeople.faction }]),
			...defaultFactionsItems,
			...onPageFactions,
		],
		default: filters.abroadPeople.faction,
		callback: () => applyFilters(),
	});
	filterContent.appendChild(factionFilter.element);
	localFilters["Faction"] = { getSelected: factionFilter.getSelected };

	const specialFilter = createFilterSection({
		title: "Special",
		ynCheckboxes: ["New Player", "In Company", "In Faction", "Is Donator", "Has Bounties"],
		defaults: filters.abroadPeople.special,
		callback: () => applyFilters(),
	});
	filterContent.appendChild(specialFilter.element);
	localFilters["Special"] = { getSelections: specialFilter.getSelections };

	const statusFilter = createFilterSection({
		title: "Status",
		checkboxes: [
			{ id: "okay", description: "Okay" },
			{ id: "hospital", description: "Hospital" },
		],
		defaults: filters.abroadPeople.status,
		callback: () => applyFilters(),
	});
	filterContent.appendChild(statusFilter.element);
	localFilters["Status"] = { getSelections: statusFilter.getSelections };

	const levelFilter = createFilterSection({
		type: "LevelAll",
		typeData: {
			valueLow: filters.abroadPeople.levelStart,
			valueHigh: filters.abroadPeople.levelEnd,
		},
		callback: () => applyFilters(),
	});
	filterContent.appendChild(levelFilter.element);
	content.appendChild(filterContent);
	localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

	if (settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()) {
		const estimatesFilter = createFilterSection({
			title: "Stats Estimates",
			checkboxes: [
				{ id: "none", description: "none" },
				...RANK_TRIGGERS.stats.map((trigger) => ({ id: trigger, description: trigger })),
				{ id: "n/a", description: "N/A" },
			],
			defaults: filters.abroadPeople.estimates,
			callback: () => applyFilters(),
		});
		filterContent.appendChild(estimatesFilter.element);

		localFilters["Stats Estimate"] = { getSelections: estimatesFilter.getSelections };
	}

	if (settings.scripts.ffScouter.gauge && hasAPIData()) {
		const ffScoreFilterMin = createFilterSection({
			title: "FF Score Min",
			text: "number",
			default: filters.userlist.ffScoreMin?.toString(),
			callback: () => applyFilters(),
		});
		ffScoreFilterMin.element.querySelector("input").step = 0.1;
		filterContent.appendChild(ffScoreFilterMin.element);
		localFilters["FF Score Min"] = { getValue: ffScoreFilterMin.getValue };

		const ffScoreFilterMax = createTextbox({
			type: "number",
		});
		ffScoreFilterMax.setValue(filters.userlist.ffScoreMax?.toString());
		ffScoreFilterMax.onChange(applyFilters);
		ffScoreFilterMax.element.step = "0.1";

		ffScoreFilterMin.element.appendChild(elementBuilder({ type: "strong", text: "FF Score Max" }));
		ffScoreFilterMin.element.append(ffScoreFilterMax.element);
		localFilters["FF Score Max"] = { getValue: ffScoreFilterMax.getValue };
	}

	await applyFilters();
}

async function applyFilters() {
	await requireElement(".users-list > li");

	// Get the set filters
	const content = findContainer("People Filter", { selector: "main" });
	const activity = localFilters["Activity"].getSelections(content);
	const faction = localFilters["Faction"].getSelected(content).trim();
	const special = localFilters["Special"].getSelections(content);
	const status = localFilters["Status"].getSelections(content);
	const levels = localFilters["Level Filter"].getStartEnd(content);
	const levelStart = parseInt(levels.start);
	const levelEnd = parseInt(levels.end);
	const statsEstimates =
		hasStatsEstimatesLoaded("Abroad People") && settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData()
			? localFilters["Stats Estimate"]?.getSelections(content)
			: undefined;

	// Update level slider counter
	localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

	const ffScoreMin = parseFloat(localFilters["FF Score Min"].getValue()) || null;
	const ffScoreMax = parseFloat(localFilters["FF Score Max"].getValue()) || null;

	// Save filters
	await ttStorage.change({
		filters: {
			abroadPeople: {
				activity,
				faction,
				special,
				status,
				levelStart,
				levelEnd,
				estimates: statsEstimates ?? filters.abroadPeople.estimates,
				ffScoreMax,
				ffScoreMin,
			},
		},
	});

	// Actual Filtering
	for (const row of findAllElements(".users-list > li")) {
		filterRow(row, { activity, faction, special, status, level: { start: levelStart, end: levelEnd }, statsEstimates, ffScoreMin, ffScoreMax }, false);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "People Filter" });

	localFilters["Statistics"].updateStatistics(
		findAllElements(".users-list > li:not(.tt-hidden)").length,
		findAllElements(".users-list > li").length,
		content
	);
}

type AbroadPeopleFilters = {
	activity: string[];
	status: string[];
	level: {
		start: number;
		end: number;
	};
	faction: string;
	special: {
		newPlayer: SpecialFilterValue;
		inCompany: SpecialFilterValue;
		inFaction: SpecialFilterValue;
		isDonator: SpecialFilterValue;
		hasBounties: SpecialFilterValue;
	};
	statsEstimates: string[];
	ffScoreMax: number;
	ffScoreMin: number;
};

function filterRow(row: HTMLElement, filters: Partial<AbroadPeopleFilters>, individual: boolean) {
	if (filters.activity?.length) {
		if (
			!filters.activity.some(
				(x) => x.trim() === row.querySelector("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim()
			)
		) {
			hide("activity");
			return;
		}
	}
	if (filters.faction) {
		const factionElement = row.querySelector<HTMLAnchorElement>(".user.faction");

		const hasFaction = !!factionElement.href;
		const factionName = hasFaction
			? factionElement.hasAttribute("rel")
				? factionElement.querySelector(":scope > img").getAttribute("title").trim() || "N/A"
				: factionElement.textContent.trim()
			: false;
		const isUnknownFaction = hasFaction && factionName === "N/A";

		if (filters.faction === "No faction") {
			if (hasFaction) {
				hide("faction");
				return;
			}
		} else if (filters.faction === "Unknown faction") {
			if (!isUnknownFaction) {
				// Not "Unknown faction"
				hide("faction");
				return;
			}
		} else if (filters.faction === "In a faction") {
			if (!hasFaction) {
				hide("faction");
				return;
			}
		} else {
			if (
				!hasFaction || // No faction
				isUnknownFaction || // Unknown faction
				filters.faction !== factionName
			) {
				hide("faction");
				return;
			}
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
	if (filters.status?.length && filters.status.length !== 2) {
		const status = row.querySelector(".status :last-child").textContent.toLowerCase().trim();

		if (!filters.status.includes(status)) {
			hide("status");
			return;
		}
	}
	if (filters.level?.start || filters.level?.end) {
		const level = convertToNumber(row.querySelector(".level").textContent);
		if ((filters.level.start && level < filters.level.start) || (filters.level.end !== 100 && level > filters.level.end)) {
			hide("level");
			return;
		}
	}
	if (filters.statsEstimates) {
		if (filters.statsEstimates.length) {
			const estimate = row.dataset.estimate?.toLowerCase();
			if ((estimate || !row.classList.contains("tt-estimated")) && !filters.statsEstimates.includes(estimate)) {
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
		row.removeAttribute("data-hide-reason");

		if (row.nextElementSibling?.classList.contains("tt-stats-estimate")) {
			row.nextElementSibling.classList.remove("tt-hidden");
		}

		if (individual) {
			const content = findContainer("People Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".users-list > li:not(.tt-hidden)").length,
				findAllElements(".users-list > li").length,
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
			const content = findContainer("People Filter", { selector: "main" });

			localFilters["Statistics"].updateStatistics(
				findAllElements(".users-list > li:not(.tt-hidden)").length,
				findAllElements(".users-list > li").length,
				content
			);
		}
	}
}

function getFactions() {
	const rows = findAllElements(".users-list > li .user.faction");
	const _factions = new Set(
		rows[0].querySelector("img")
			? rows
					.map((row) => row.querySelector("img"))
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
	removeContainer("People Filter");
	findAllElements(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class AbroadPeopleFilterFeature extends Feature {
	constructor() {
		super("People Filter", "travel");
	}

	precondition() {
		return isAbroad();
	}

	isEnabled() {
		return settings.pages.travel.peopleFilter;
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
		return ["settings.pages.travel.peopleFilter"];
	}
}
