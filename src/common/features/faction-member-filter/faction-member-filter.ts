import "./faction-member-filter.css";
import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer, findContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements, isElement } from "@common/utils/functions/dom";
import { createFilterEnabledFunnel, createFilterSection, createStatistics, getSpecialIcons } from "@common/utils/functions/filters";
import { CUSTOM_LISTENERS, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { SPECIAL_FILTER_ICONS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filterContent: Element, lastActionState: boolean;
let localFilters: any = {};

function addListener() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

			await addFilter();
			await showLastAction();
		});
	}
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature) || localFilters["Last Active Filter"]?.element) return;

		if (name === "Last Action") {
			await showLastAction();
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		if (name === "Last Action") {
			await removeLastAction();
		}
	});

	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		await applyFilter();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		await applyFilter();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FF_SCOUTER_GAUGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;
		if (!localFilters["FF Score Max"]?.getValue() && !localFilters["FF Score Min"]?.getValue()) return;

		await applyFilter();
	});
}

async function addFilter() {
	if (isInternalFaction && getFactionSubpage() !== "info") return;

	await requireElement(".faction-info-wrap .members-list .table-row");

	const { content, options } = createContainer("Member Filter", {
		class: "mt10",
		nextElement: document.querySelector(".faction-info-wrap > .members-list"),
		compact: true,
		filter: true,
	});

	const statistics = createStatistics("players");
	content.appendChild(statistics.element);
	localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

	filterContent = elementBuilder({
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
		default: "",
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

	if (settings.scripts.ffScouter.gauge && hasAPIData()) {
		const ffScoreFilterMin = createFilterSection({
			title: "FF Score Min",
			text: "number",
			default: filters.faction.ffScoreMin?.toString(),
			callback: applyFilter,
		});
		ffScoreFilterMin.element.querySelector("input").step = 0.1;
		filterContent.appendChild(ffScoreFilterMin.element);
		localFilters["FF Score Min"] = { getValue: ffScoreFilterMin.getValue };

		const ffScoreFilterMax = createTextbox({
			type: "number",
		});
		ffScoreFilterMax.setValue(filters.faction.ffScoreMax?.toString());
		ffScoreFilterMax.onChange(applyFilter);
		ffScoreFilterMax.element.step = "0.1";

		ffScoreFilterMin.element.appendChild(elementBuilder({ type: "strong", text: "FF Score Max" }));
		ffScoreFilterMin.element.append(ffScoreFilterMax.element);
		localFilters["FF Score Max"] = { getValue: ffScoreFilterMax.getValue };
	}

	content.appendChild(filterContent);

	const enabledFunnel = createFilterEnabledFunnel();
	enabledFunnel.onChange(applyFilter);
	enabledFunnel.setEnabled(filters.faction.enabled);
	options.appendChild(enabledFunnel.element);
	localFilters.enabled = { isEnabled: enabledFunnel.isEnabled };

	applyFilter().then(() => {});

	if (settings.scripts.lastAction.factionMember && !lastActionState) {
		showLastAction().then(() => {});
	}
}

async function showLastAction() {
	if (lastActionState || localFilters["Last Active Filter"]?.element) return;

	await requireElement(".members-list .table-body.tt-modified > .tt-last-action");

	if (!filterContent || filterContent.querySelector(".lastActiveFilter__section-class")) return;

	lastActionState = true;

	const upperLimit = parseInt(document.querySelector(".members-list .table-body.tt-modified").getAttribute("max-hours")) || 1000;

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
		findAllElements(".members-list .table-body > li.tt-hidden.last-action").forEach((x) => {
			x.classList.remove("tt-hidden");
			x.classList.remove("last-action");
		});
		localFilters["Last Active Filter"] = undefined;
		await applyFilter();
	}
}

async function applyFilter() {
	await requireElement(".members-list .table-body > li");

	const content = findContainer("Member Filter").querySelector("main");
	const activity: string[] = localFilters["Activity"].getSelections(content);
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
	const ffScoreMin = parseFloat(localFilters["FF Score Min"]?.getValue()) ?? null;
	const ffScoreMax = parseFloat(localFilters["FF Score Max"]?.getValue()) ?? null;

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
				enabled: localFilters.enabled.isEnabled(),
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
				ffScoreMax,
				ffScoreMin,
			},
		},
	});

	// Actual Filtering
	if (!localFilters.enabled.isEnabled()) {
		findAllElements(".members-list .table-body > li.tt-hidden").forEach((x) => {
			x.classList.remove("tt-hidden");
			delete x.dataset.hideReason;
		});
		localFilters["Statistics"].updateStatistics(
			findAllElements(".members-list .table-body > li:not(.tt-hidden)").length,
			findAllElements(".members-list .table-body > li").length,
			content,
		);
		return;
	}

	for (const li of findAllElements(".members-list .table-body > li")) {
		// Activity
		if (activity.length) {
			const userActivity = li.querySelector("[class*='userOnlineStatusIcon___']").getAttribute("alt");

			if (!activity.some((x) => x.trim() === userActivity)) {
				hideRow(li);
				continue;
			}
		}

		// Level
		const level = parseInt(li.querySelector(".lvl").textContent);
		if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
			hideRow(li);
			continue;
		}

		// Position
		if (position) {
			const liPosition = li.querySelector(".position .ellipsis").textContent.trim();
			if (liPosition !== position) {
				hideRow(li);
				continue;
			}
		}

		// Status
		if (status && status.length > 0 && status.length !== 5) {
			const liStatus = li.querySelector(".status .ellipsis").textContent.trim().toLowerCase();
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
		if (lastActionState && isElement(li.nextSibling) && li.nextSibling.className.includes("tt-last-action")) {
			const liLastAction = parseInt(li.nextElementSibling.getAttribute("hours"));
			if ((lastActionStart && liLastAction < lastActionStart) || (lastActionEnd !== -1 && liLastAction > lastActionEnd)) {
				hideRow(li, "last-action");
				continue;
			}
		}

		// FF Score
		if (ffScoreMax || ffScoreMin) {
			try {
				const gauge = li.querySelector(".tt-ff-scouter-indicator.indicator-lines");
				if (gauge) {
					const ff = parseFloat(gauge.getAttribute("data-ff-scout"));
					if (!Number.isNaN(ff)) {
						if (ffScoreMax && !Number.isNaN(ffScoreMax) && ff > ffScoreMax) {
							hideRow(li);
							continue;
						}
						if (ffScoreMin && !Number.isNaN(ffScoreMin) && ff < ffScoreMin) {
							hideRow(li);
							continue;
						}
					}
				}
			} catch (error) {
				console.error("TT - Failed to filter faction member row by FF Score.", error);
			}
		}

		showRow(li);
	}

	triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Faction Member Filter" });

	function showRow(li: Element) {
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

	function hideRow(li: Element, customClass = "") {
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
		findAllElements(".members-list .table-body > li:not(.tt-hidden)").length,
		findAllElements(".members-list .table-body > li").length,
		content,
	);
}

function getPositions() {
	const _positions = [];
	findAllElements(".members-list .table-body > li > .position .ellipsis").forEach((x) => {
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
	findAllElements(".members-list .table-body > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class FactionMemberFilterFeature extends Feature {
	constructor() {
		super("Faction Member Filter", "faction");
	}

	isEnabled() {
		return settings.pages.faction.memberFilter;
	}

	initialise() {
		addListener();
	}

	async execute() {
		await addFilter();
	}

	cleanup() {
		removeFilter();
	}

	storageKeys() {
		return ["settings.pages.faction.memberFilter"];
	}
}
