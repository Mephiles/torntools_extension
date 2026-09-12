import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { createFilter, presetSection, sliderSection } from "@common/utils/functions/filters";
import type { FilterController, SliderRange } from "@common/utils/functions/filters";
import { findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { objectsEquals } from "@common/utils/functions/utilities.ts";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let filterSetupComplete = false;

type EliminationFilterState = {
	enabled: boolean;
	activity: string[];
	level: SliderRange;
	ffScore: { min: number; max: number } | undefined;
};

async function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.ELIMINATION__TEAM, async () => {
		await addFilterContainer();
	});
	addCustomListener(EVENT_CHANNELS.ELIMINATION__TEAM_TABLE_CHANGE, async () => {
		if (!filterSetupComplete) return;

		void filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.FF_SCOUTER_GAUGE, async () => {
		if (!filterSetupComplete) return;

		await filter?.runScoped({ sections: ["ffScore"] });
	});
}

async function addFilterContainer() {
	filter?.dispose();

	filter = createFilter<EliminationFilterState>({
		rowSelector: "[class*='teamRow___']",
		container: { title: "Elimination Filter", class: ["mt10", "mb10"], nextElement: await requireElement("[class*='filterContainer___']"), compact: true },
		statisticsLabel: "members",
		enabled: filters.elimination.enabled,
		sections: [
			presetSection({ preset: "activity", defaults: filters.elimination.activity }),
			sliderSection({
				key: "level",
				title: "Level Filter",
				config: { min: 1, max: 100, step: 1 },
				defaults: { low: filters.elimination.levelStart, high: filters.elimination.levelEnd },
				formatCounter: (r) => `Level ${r.start} - ${r.end}`,
				test: (row, range) => {
					const level = convertToNumber(findElement("[class*='level__']", row).textContent);

					if (range.start && level < range.start) return false;
					if (range.end !== 100 && level > range.end) return false;

					return true;
				},
			}),
			presetSection({
				preset: "ff-score",
				defaults: {
					min: filters.elimination.ffScoreMin,
					max: filters.elimination.ffScoreMax,
				},
				enabled: () => settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData(),
			}),
		],
		onStateChange: async (state) => {
			const next = {
				enabled: state.enabled,
				activity: state.activity,
				levelStart: state.level.start,
				levelEnd: state.level.end,
				ffScoreMax: state.ffScore?.max ?? filters.elimination.ffScoreMax,
				ffScoreMin: state.ffScore?.min ?? filters.elimination.ffScoreMin,
			};

			if (objectsEquals(filters.elimination, next)) return;

			await ttStorage.change({ filters: { elimination: next } });
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Elimination Filter" });
		},
		preserveHeight: true,
	});

	await filter.run();
	filterSetupComplete = true;
}

export default class EliminationFilterFeature extends Feature {
	constructor() {
		super("Elimination Filter", "competition");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.elimination.filter;
	}

	override async initialise() {
		await initialiseListeners();
	}

	override async execute() {
		if (location.hash.includes("team/")) {
			await addFilterContainer();
		}
	}

	override storageKeys() {
		return ["settings.pages.elimination.filter"];
	}
}
