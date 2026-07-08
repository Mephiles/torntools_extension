import "./ranked-war-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { checkboxesSection, createFilter, type FilterController, presetSection, type SliderRange, sliderSection } from "@common/utils/functions/filters";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let interval: number | undefined;

function initialiseListeners() {
	document.addEventListener("click", async (event) => {
		const rankedWarItem = (event.target as Element).closest("[class*='warListItem__']");
		if (rankedWarItem?.querySelector(":scope > [data-warid]")) {
			addFilterContainer(
				(await requireElement(".descriptions .faction-war .enemy-faction", { parent: rankedWarItem.parentElement })).closest(".faction-war"),
			).catch(console.error);
		}
	});

	addCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, ({ row }) => {
		if (!FEATURE_MANAGER.isEnabled(RankedWarFilterFeature)) return;

		if (!row.closest(".faction-war")) {
			// Estimate didn't happen in a ranked war list.
			return;
		}

		void filter?.runScoped({ rows: [row], sections: ["statsEstimates"] });
	});

	addFetchListener(async ({ detail: { page, fetch } }) => {
		if (!FEATURE_MANAGER.isEnabled(RankedWarFilterFeature)) return;
		if (!location.hash.includes("#/war/rank")) return;

		const params = new URL(fetch.url).searchParams;
		if ((page === "page" && params.get("sid") === "factionsUsers") || (page === "faction_wars" && params.get("step") === "getwarusers")) {
			await filter?.run();
		}
	});
}

type RankedWarFilterState = {
	enabled: boolean;
	activity: string[];
	status: string[];
	level: SliderRange;
	statsEstimates: string[] | undefined;
	ffScore: { min: number; max: number } | undefined;
};

async function addFilterContainer(rankedWarList?: Element) {
	if (interval) {
		clearInterval(interval);
		interval = undefined;
	}
	filter?.dispose();

	if (location.hash.includes("#/war/rank")) rankedWarList = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war");
	if (!rankedWarList) return;

	interval = setInterval(() => {
		if (!location.hash.includes("#/war/rank")) return;

		void filter?.run();
	}, 2500);

	const sections = [
		presetSection({ preset: "activity", defaults: filters.factionRankedWar.activity }),

		checkboxesSection({
			key: "status",
			title: "Status",
			items: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
				{ id: "abroad", description: "Abroad" },
				{ id: "traveling", description: "Traveling" },
			],
			defaults: filters.factionRankedWar.status,
			test: (row, status) => {
				if (!status.length) return true;

				const statusEl = row.querySelector<HTMLElement>(".status");
				if (!statusEl) return true;

				return status.some((s) => statusEl.classList.contains(s));
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 1, max: 100, step: 1 },
			defaults: { low: filters.factionRankedWar.levelStart, high: filters.factionRankedWar.levelEnd },
			formatCounter: (r) => `Level ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = parseInt(row.querySelector(".level").textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),

		presetSection({
			preset: "stats-estimates",
			enabled: () => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.rankedWars && hasAPIData(),
			defaults: filters.factionRankedWar.estimates,
		}),

		presetSection({
			preset: "ff-score",
			enabled: () => settings.scripts.ffScouter.gauge && settings.external.ffScouter && hasAPIData(),
			defaults: { min: filters.factionRankedWar.ffScoreMin, max: filters.factionRankedWar.ffScoreMax },
		}),
	];

	filter = createFilter<RankedWarFilterState>({
		rowSelector: ".members-list > li",
		container: {
			title: "Ranked War Filter",
			nextElement: rankedWarList,
			compact: true,
			applyRounding: false,
		},
		statisticsLabel: "players",
		enabled: filters.factionRankedWar.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					factionRankedWar: {
						enabled: state.enabled,
						activity: state.activity,
						status: state.status,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						estimates: state.statsEstimates ?? filters.factionRankedWar.estimates,
						ffScoreMax: state.ffScore?.max ?? filters.factionRankedWar.ffScoreMax,
						ffScoreMin: state.ffScore?.min ?? filters.factionRankedWar.ffScoreMin,
					},
				},
			});

			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Ranked War Filter" });
		},
	});

	await filter.run();
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

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		if (interval) clearInterval(interval);
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.faction.rankedWarFilter"];
	}
}
