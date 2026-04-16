import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { filters, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, defaultFactionsItems, FILTER_REGEXES } from "@/utils/common/functions/filters";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

const localFilters: any = {};

function initialiseFilters() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(HospitalFilterFeature)) return;

		await filtering(true);
	});
}

async function addFilters() {
	await requireElement(".userlist-wrapper.hospital-list-wrapper .users-list .time");

	const { content, options } = createContainer("Hospital Filter", {
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
		defaults: filters.hospital.activity,
		callback: filtering,
	});
	filterContent.appendChild(activityFilter.element);
	localFilters["Activity"] = { getSelections: activityFilter.getSelections };

	const reviveFilter = createFilterSection({
		title: "Revives On",
		checkbox: "Enabled",
		default: filters.hospital.revivesOn,
		callback: filtering,
	});
	filterContent.appendChild(reviveFilter.element);
	localFilters["Revives On"] = { isChecked: reviveFilter.isChecked };

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(filtering);
	enabledFunnel.setEnabled(filters.hospital.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

	const factionFilter = createFilterSection({
		title: "Faction",
		select: [...defaultFactionsItems, ...getFactions()],
		default: "",
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
			valueLow: filters.hospital.timeStart,
			valueHigh: filters.hospital.timeEnd,
		},
		callback: filtering,
	});
	filterContent.appendChild(timeFilter.element);
	localFilters["Time Filter"] = { getStartEnd: timeFilter.getStartEnd, updateCounter: timeFilter.updateCounter };

	const levelFilter = createFilterSection({
		type: "LevelAll",
		typeData: {
			valueLow: filters.hospital.levelStart,
			valueHigh: filters.hospital.levelEnd,
		},
		callback: filtering,
	});
	filterContent.appendChild(levelFilter.element);
	localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

	content.appendChild(filterContent);

	await filtering();
}

async function filtering(pageChange: boolean = false) {
	await requireElement(".users-list > li");
	const content = findContainer("Hospital Filter").querySelector("main");
	const activity: string[] = localFilters["Activity"].getSelections(content);
	const revivesOn = localFilters["Revives On"].isChecked(content);

	const faction: string = localFilters["Faction"].getSelected(content).trim();
	const times = localFilters["Time Filter"].getStartEnd(content);
	const timeStart = parseInt(times.start);
	const timeEnd = parseInt(times.end);
	const levels = localFilters["Level Filter"].getStartEnd(content);
	const levelStart = parseInt(levels.start);
	const levelEnd = parseInt(levels.end);
	if (pageChange) {
		localFilters["Faction"].updateOptions([...defaultFactionsItems, ...getFactions()], content);
	}

	// Update level and time slider counters
	localFilters["Time Filter"].updateCounter(`Time ${timeStart}h - ${timeEnd}h`, content);
	localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

	// Save filters
	await ttStorage.change({
		filters: {
			hospital: {
				enabled: localFilters.enabled.isEnabled(),
				activity: activity,
				revivesOn: revivesOn,
				faction: faction,
				timeStart: timeStart,
				timeEnd: timeEnd,
				levelStart: levelStart,
				levelEnd: levelEnd,
			},
		},
	});

	// Actual Filtering
	if (!localFilters.enabled.isEnabled()) {
		findAllElements(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
		localFilters["Statistics"].updateStatistics(
			findAllElements(".users-list > li:not(.tt-hidden)").length,
			findAllElements(".users-list > li").length,
			content,
		);
		return;
	}

	for (const li of findAllElements(".users-list > li")) {
		showRow(li);

		// Activity
		if (
			activity.length &&
			!activity.some((x) => x.trim() === li.querySelector("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim())
		) {
			hideRow(li);
			continue;
		}

		// Revives On
		if (revivesOn && li.querySelector(".revive")?.classList?.contains("reviveNotAvailable")) {
			hideRow(li);
			continue;
		}

		// Faction

		const rowFaction = li.querySelector<HTMLAnchorElement>(".user.faction");
		const hasFaction = !!rowFaction.href;
		const factionName = rowFaction.hasAttribute("rel")
			? rowFaction.querySelector(":scope > img").getAttribute("title").trim() || "N/A"
			: rowFaction.textContent.trim();

		if (faction && faction !== "No faction" && faction !== "Unknown faction" && faction !== "In a faction") {
			if (!hasFaction || factionName === "N/A" || factionName !== faction) {
				hideRow(li);
				continue;
			}
		} else if (faction === "In a faction") {
			if (!hasFaction) {
				hideRow(li);
				continue;
			}
		} else if (faction === "No faction") {
			if (hasFaction) {
				hideRow(li);
				continue;
			}
		} else if (faction === "Unknown faction") {
			if (!hasFaction || factionName !== "N/A") {
				// Not "Unknown faction"
				hideRow(li);
				continue;
			}
		}

		// Time
		const timeLeftHrs = parseInt(li.querySelector(".info-wrap .time").lastChild.textContent?.match(/(\d*)h/)?.[1]) || 0;
		if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs >= timeEnd)) {
			hideRow(li);
			continue;
		}
		// Level
		const level = convertToNumber(li.querySelector(".info-wrap .level").textContent);
		if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
			hideRow(li);
		}
	}

	function showRow(li: Element) {
		li.classList.remove("tt-hidden");
	}

	function hideRow(li: Element) {
		li.classList.add("tt-hidden");
	}

	localFilters["Statistics"].updateStatistics(
		findAllElements(".users-list > li:not(.tt-hidden)").length,
		findAllElements(".users-list > li").length,
		content,
	);
}

function getFactions() {
	const rows = findAllElements(".users-list > li .user.faction");
	const _factions = new Set(
		findAllElements(".users-list > li .user.faction img").length
			? rows
					.map((row) => row.querySelector("img"))
					.filter((img) => !!img)
					.map((img) => img.getAttribute("title").trim())
					.filter((tag) => !!tag)
			: rows.map((row) => row.textContent.trim()).filter((tag) => !!tag),
	);

	const factions = [];
	for (const faction of _factions) {
		factions.push({ value: faction, description: faction });
	}
	return factions;
}

function removeFilters() {
	removeContainer("Hospital Filter");
	findAllElements(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class HospitalFilterFeature extends Feature {
	constructor() {
		super("Hospital Filter", "hospital");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.hospital.filter;
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
		return ["settings.pages.hospital.filter"];
	}
}
