import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import {
	checkboxesSection,
	createFilter,
	defaultFactionsItems,
	type FilterController,
	getSpecialIcons,
	presetSection,
	sliderSection,
	type YNCheckboxState,
	ynCheckboxesSection,
} from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { extractFactionsFromPage, isAbroad, SPECIAL_FILTER_ICONS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, async () => {
		if (!FEATURE_MANAGER.isEnabled(AbroadPeopleFilterFeature)) return;

		await filter.run();
	});
	addCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(AbroadPeopleFilterFeature)) return;

		await filter.run();
	});
}

type AbroadPeopleFilterState = {
	enabled: boolean;
	activity: string[];
	faction: string;
	special: YNCheckboxState;
	status: string[];
	level: { start: number; end: number };
	statsEstimates: string[] | undefined;
	ffScore: { min: number; max: number } | undefined;
};

async function addFilterContainer() {
	await requireElement(".users-list");

	const sections = [
		presetSection({
			preset: "activity",
			defaults: filters.abroadPeople.activity,
		}),

		presetSection({
			preset: "faction",
			getOptions: () => [...defaultFactionsItems, ...extractFactionsFromPage().map((faction) => ({ value: faction, description: faction }))],
			default: filters.abroadPeople.faction,
		}),

		ynCheckboxesSection({
			key: "special",
			title: "Special",
			items: ["New Player", "In Company", "In Faction", "Is Donator", "Has Bounties", "Bazaar Open"],
			defaults: filters.abroadPeople.special,
			test: (row, special) => {
				const match = Object.entries(special)
					.filter(([, value]) => value !== "both" && value !== "none")
					.find(([key, value]) => {
						const icons = getSpecialIcons(row);
						const filterIcons = SPECIAL_FILTER_ICONS[key];
						return (
							(value === "yes" && !icons.some((foundIcon) => filterIcons.includes(foundIcon))) ||
							(value === "no" && icons.some((foundIcon) => filterIcons.includes(foundIcon)))
						);
					});

				return !match;
			},
		}),

		checkboxesSection({
			key: "status",
			title: "Status",
			items: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
			],
			defaults: filters.abroadPeople.status,
			test: (row, status) => {
				if (!status.length || status.length === 2) return true;

				const rowStatus = row.querySelector<HTMLElement>(".status :last-child")!.textContent.toLowerCase().trim();
				return status.includes(rowStatus);
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 0, max: 100, step: 1 },
			defaults: { low: filters.abroadPeople.levelStart, high: filters.abroadPeople.levelEnd },
			formatCounter: (r) => `Level ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = convertToNumber(row.querySelector(".level")!.textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),

		presetSection({
			preset: "stats-estimates",
			enabled: () => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist && hasAPIData(),
			defaults: filters.abroadPeople.estimates,
		}),

		presetSection({
			preset: "ff-score",
			enabled: () => settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData(),
			defaults: { min: filters.abroadPeople.ffScoreMin ?? 0, max: filters.abroadPeople.ffScoreMax },
		}),
	];

	filter = createFilter<AbroadPeopleFilterState>({
		rowSelector: ".users-list > li",
		container: {
			title: "People Filter",
			class: "mt10",
			nextElement: document.querySelector(".users-list-title")!,
		},
		statisticsLabel: "players",
		enabled: filters.abroadPeople.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					abroadPeople: {
						enabled: state.enabled,
						activity: state.activity,
						faction: state.faction,
						special: state.special,
						status: state.status,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						estimates: state.statsEstimates ?? filters.abroadPeople.estimates,
						ffScoreMax: state.ffScore?.max ?? filters.abroadPeople.ffScoreMax,
						ffScoreMin: state.ffScore?.min ?? filters.abroadPeople.ffScoreMin,
					},
				},
			});

			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "People Filter" });
		},
	});
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
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.travel.peopleFilter"];
	}
}
