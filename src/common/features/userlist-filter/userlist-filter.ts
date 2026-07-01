import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import {
	createFilter,
	type FilterController,
	type FilterSectionDef,
	getSpecialIcons,
	presetSection,
	type SliderRange,
	sliderSection,
	type YNCheckboxState,
	ynCheckboxesSection,
} from "@common/utils/functions/filters";
import { requireCondition, requireElement } from "@common/utils/functions/requires";
import { getPageStatus, HOSPITALIZATION_REASONS, SPECIAL_FILTER_ICONS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.USERLIST_SWITCH_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;

		await filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, () => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;

		void filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE, () => {
		if (!FEATURE_MANAGER.isEnabled(UserlistFilterFeature)) return;

		void filter?.run();
	});
}

type UserlistFilterState = {
	enabled: boolean;
	activity: string[];
	level: SliderRange;
	special: YNCheckboxState;
	hospReason: YNCheckboxState;
	statsEstimates: string[] | undefined;
	ffScore: { min: number; max: number } | undefined;
};

async function addFilterContainer() {
	await requireElement(".userlist-wrapper .user-info-list-wrap");

	filter?.dispose();

	const sections: FilterSectionDef<unknown>[] = [
		presetSection({
			preset: "activity",
			defaults: filters.userlist.activity,
		}),

		ynCheckboxesSection({
			key: "special",
			title: "Special",
			items: [
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
				"Has Bounties",
				"Bazaar Open",
			],
			defaults: filters.userlist.special,
			test: (row, special) => {
				const match = Object.entries(special)
					.filter(([, value]) => value !== "both" && value !== "none")
					.find(([key, value]) => {
						const icons = getSpecialIcons(row);
						const filterIcons = SPECIAL_FILTER_ICONS[key];
						return (
							(value === "yes" && !icons.some((i) => filterIcons.includes(i))) || (value === "no" && icons.some((i) => filterIcons.includes(i)))
						);
					});
				return !match;
			},
		}),

		ynCheckboxesSection({
			key: "hospReason",
			title: "Hosp Reason",
			items: ["Attacked By", "Mugged By", "Hospitalized By", "Other"],
			defaults: filters.userlist.hospReason,
			test: (row, hospReason) => {
				const match = Object.entries(hospReason)
					.filter(([, value]) => value !== "both" && value !== "none")
					.find(([key, value]) => {
						const hospEl = row.querySelector<HTMLElement>("li[title*='Hospital']");
						if (!hospEl) return true;

						const reason = hospEl.getAttribute("title").split("<br>")[1];
						if (key === "other") {
							return (
								(value === "yes" && HOSPITALIZATION_REASONS.other.some((r) => reason.match(r))) ||
								(value === "no" && !HOSPITALIZATION_REASONS.other.some((r) => reason.match(r)))
							);
						}
						return (
							(value === "yes" && !reason.includes(HOSPITALIZATION_REASONS[key])) ||
							(value === "no" && reason.includes(HOSPITALIZATION_REASONS[key]))
						);
					});
				return !match;
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 0, max: 100, step: 1 },
			defaults: { low: filters.userlist.levelStart, high: filters.userlist.levelEnd },
			formatCounter: (r) => `Level ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = parseInt(row.querySelector(".level .value").textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),

		presetSection({
			preset: "stats-estimates",
			enabled: () => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData(),
			defaults: filters.userlist.estimates,
		}),

		presetSection({
			preset: "ff-score",
			enabled: () => settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData(),
			defaults: {
				min: filters.userlist.ffScoreMin,
				max: filters.userlist.ffScoreMax,
			},
		}),
	];

	filter = createFilter<UserlistFilterState>({
		rowSelector: ".user-info-list-wrap > li:not(:has(.ajax-preloader))",
		container: {
			title: "Userlist Filter",
			class: "mt10",
			nextElement: document.querySelector(".users-list-title"),
			compact: true,
		},
		statisticsLabel: "players",
		enabled: filters.userlist.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					userlist: {
						enabled: state.enabled,
						activity: state.activity,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						special: state.special,
						hospReason: state.hospReason,
						estimates: state.statsEstimates ?? filters.userlist.estimates,
						ffScoreMax: state.ffScore?.max ?? filters.userlist.ffScoreMax,
						ffScoreMin: state.ffScore?.min ?? filters.userlist.ffScoreMin,
					},
				},
			});

			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Userlist Filter" });
		},
	});

	// Wait for ajax content to finish loading before first filter run
	await requireCondition(() => {
		return (
			!document.querySelector(".user-info-list-wrap .ajax-placeholder, .user-info-list-wrap .ajax-preloader") ||
			!!document.evaluate(
				"//*[contains(@class, 'userlist-wrapper')][.//*[contains(text(), 'No users found')]]",
				document,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null,
			).singleNodeValue
		);
	}, {});
	await filter.run();
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
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.userlist.filter"];
	}
}
