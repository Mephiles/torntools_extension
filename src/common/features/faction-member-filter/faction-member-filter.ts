import "./faction-member-filter.css";
import { getFactionSubpage, isDestroyed, isInternalFaction, readFactionDetails } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { findAllElements, isElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import {
	checkboxesSection,
	createFilter,
	type FilterController,
	getSpecialIcons,
	getUserActivity,
	presetSection,
	type SliderRange,
	selectSection,
	sliderSection,
	type YNCheckboxState,
	ynCheckboxesSection,
} from "@common/utils/functions/filters";
import { requireElement } from "@common/utils/functions/requires";
import { SPECIAL_FILTER_ICONS } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { FactionMembersResponse } from "tornapi-typescript";

let filter: FilterController | undefined;
let lastActionState = false;
let lastActionMax: number | undefined;

function initialiseListeners() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

			await addFilterContainer();
			if (settings.scripts.lastAction.factionMember) {
				await enableLastAction();
			}
		});
	}

	addCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature) || name !== "Last Action") return;

		await enableLastAction();
	});
	addCustomListener(EVENT_CHANNELS.FEATURE_DISABLED, async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature) || name !== "Last Action") return;

		await disableLastAction();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		void filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE, () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		void filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE, () => {
		if (!FEATURE_MANAGER.isEnabled(FactionMemberFilterFeature)) return;

		void filter?.run();
	});
}

type FactionMemberFilterState = {
	enabled: boolean;
	activity: string[];
	special: YNCheckboxState;
	position: string;
	status: string[];
	level: SliderRange;
	lastAction: SliderRange | undefined;
	ffScore: { min: number; max: number } | undefined;
	revivable: string[] | undefined;
};

async function enableLastAction() {
	if (lastActionState) return;

	await requireElement(".members-list .table-body.tt-modified > .tt-last-action");
	lastActionMax = parseInt(document.querySelector(".members-list .table-body.tt-modified").getAttribute("max-hours")) || 1000;
	lastActionState = true;
	filter?.rerenderSections();
}

async function disableLastAction() {
	if (!lastActionState) return;

	lastActionState = false;
	findAllElements(".members-list .table-body > li.tt-hidden.last-action").forEach((x) => {
		x.classList.remove("tt-hidden");
		x.classList.remove("last-action");
	});
	filter?.rerenderSections();
}

async function addFilterContainer() {
	if (isInternalFaction && getFactionSubpage() !== "info") return;
	if (!isInternalFaction && (await isDestroyed())) return;

	await requireElement(".faction-info-wrap .members-list .table-row");
	filter?.dispose();

	if (isRevivableEnabled()) {
		void loadRevivableStatus();
	}

	const sections = [
		checkboxesSection({
			key: "activity",
			title: "Activity",
			items: [
				{ id: "online", description: "Online" },
				{ id: "idle", description: "Idle" },
				{ id: "offline", description: "Offline" },
			],
			defaults: filters.faction.activity,
			test: (row, activity) => {
				if (!activity.length) return true;
				const userActivity = getUserActivity(row);
				return activity.some((x) => x.trim() === userActivity);
			},
		}),

		ynCheckboxesSection({
			key: "special",
			title: "Special",
			items: ["Fedded", "Fallen", "New Player", "In Company", "Is Donator", "Is Recruit"],
			defaults: filters.faction.special,
			test: (row, special) => {
				for (const key in special) {
					const value = special[key];
					if (value === "both" || value === "none") continue;

					const foundIcons = getSpecialIcons(row);
					const definedIcons = SPECIAL_FILTER_ICONS[key];
					if (value === "yes") {
						if (!foundIcons.some((fi) => definedIcons.includes(fi))) return false;
					} else if (value === "no") {
						if (foundIcons.some((fi) => definedIcons.includes(fi))) return false;
					}
				}
				return true;
			},
		}),

		selectSection({
			key: "position",
			title: "Position",
			getOptions: getPositions,
			defaultValue: "",
			test: (row, position) => {
				if (!position) return true;
				const liPosition = row.querySelector(".position .ellipsis").textContent.trim();
				return liPosition === position;
			},
		}),

		checkboxesSection({
			key: "status",
			title: "Status",
			items: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
				{ id: "jail", description: "Jail" },
				{ id: "abroad", description: "Abroad" },
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.faction.status,
			test: (row, status) => {
				if (!status.length || status.length === 5) return true;

				const liStatus = row.querySelector(".status .ellipsis").textContent.trim().toLowerCase();
				return status.includes(liStatus);
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 1, max: 100, step: 1 },
			defaults: { low: filters.faction.levelStart, high: filters.faction.levelEnd },
			formatCounter: (r) => `Level ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = parseInt(row.querySelector(".lvl").textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),

		presetSection({
			preset: "ff-score",
			enabled: () => settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData(),
			defaults: { min: filters.faction.ffScoreMin, max: filters.faction.ffScoreMax },
		}),

		sliderSection({
			key: "lastAction",
			title: "Last Active Filter",
			enabled: () => lastActionState,
			config: { min: 0, max: lastActionMax || 1000, step: 1 },
			defaults: {
				low: lastActionMax ? Math.max(filters.faction.lastActionStart, lastActionMax) : filters.faction.lastActionStart,
				high: lastActionMax ? Math.min(filters.faction.lastActionEnd, lastActionMax) : filters.faction.lastActionEnd,
			},
			formatCounter: (r) => `Last action ${r.start}h - ${r.end}h`,
			test: (row, range) => {
				if (!lastActionState) return true;

				const nextRow = row.nextElementSibling;
				if (!isElement(nextRow) || !nextRow.className.includes("tt-last-action")) return true;

				const hours = parseInt(nextRow.getAttribute("hours"));
				if (range.start && hours < range.start) return false;
				if (range.end !== -1 && hours > range.end) return false;

				return true;
			},
		}),
	];

	if (isRevivableEnabled()) {
		sections.push(
			checkboxesSection({
				key: "revivable",
				title: "Revivable",
				items: [{ id: "only-revivable", description: "Only Revivable" }],
				defaults: filters.faction.revivable,
				test: (row, status) => {
					if (!status.length) return true;

					const revivableString = row.dataset.revivable;
					if (!revivableString) return true; // If we don't know the status, don't hold it into account.

					const revivable = revivableString === "true";

					return !status.includes("only-revivable") || revivable;
				},
			}),
		);
	}

	filter = createFilter<FactionMemberFilterState>({
		rowSelector: ".members-list .table-body > li",
		container: {
			title: "Member Filter",
			class: "mt10",
			nextElement: document.querySelector(".faction-info-wrap > .members-list"),
			compact: true,
		},
		statisticsLabel: "players",
		enabled: filters.faction.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					faction: {
						enabled: state.enabled,
						activity: state.activity,
						status: state.status,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						lastActionStart: state.lastAction?.start ?? filters.faction.lastActionStart,
						lastActionEnd: state.lastAction?.end,
						special: state.special,
						ffScoreMax: state.ffScore?.max ?? filters.faction.ffScoreMax,
						ffScoreMin: state.ffScore?.min ?? filters.faction.ffScoreMin,
						revivable: state.revivable ?? filters.faction.revivable,
					},
				},
			});

			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Faction Member Filter" });
		},
	});

	await filter.run();
}

function getPositions() {
	const seen: string[] = [];
	findAllElements(".members-list .table-body > li > .position .ellipsis").forEach((x) => {
		const pos = x.textContent.trim();
		if (!seen.includes(pos)) seen.push(pos);
	});

	return [
		{ value: "", description: "All" },
		{
			value: "------",
			description: "------",
			disabled: true,
		},
		...seen.map((p) => ({ value: p, description: p })),
	];
}

function isRevivableEnabled() {
	return settings.pages.faction.memberFilterRevivable && hasAPIData();
}

async function loadRevivableStatus() {
	const details = await readFactionDetails();
	if (!details) return;

	let data: FactionMembersResponse;
	if (ttCache.hasValue("faction-filter-members", details.id)) {
		data = ttCache.get("faction-filter-members", details.id);
	} else {
		data = await fetchData<FactionMembersResponse>("tornv2", {
			section: "faction",
			id: details.id,
			selections: ["members"],
			silent: true,
		});

		ttCache.set({ [details.id]: data }, TO_MILLIS.HOURS, "faction-filter-members");
	}

	data.members.forEach(({ id, is_revivable }) => {
		const row = document.querySelector<HTMLElement>(`.members-list .table-body > li:has(a[class*="linkWrap"][href*='${id}'])`);
		if (!row) return;

		row.dataset.revivable = String(is_revivable);
	});
	filter?.run();
}

export default class FactionMemberFilterFeature extends Feature {
	constructor() {
		super("Faction Member Filter", "faction");
	}

	isEnabled() {
		return settings.pages.faction.memberFilter;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		lastActionState = false;
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.faction.memberFilter"];
	}
}
