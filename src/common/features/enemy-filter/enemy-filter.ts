import "./enemy-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { isElement } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { createFilter, type FilterController, presetSection, type SliderRange, sliderSection } from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { DisabledUntilNoticeFeature } from "@features/feature";

let filter: FilterController | undefined;
let filterSetupComplete = false;
let listObserver: MutationObserver;
let tableObserver: MutationObserver;

type EnemyFilterState = { enabled: boolean; activity: string[]; level: SliderRange; estimates: string[] };

async function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.STATS_ESTIMATED, () => {
		if (!FEATURE_MANAGER.isEnabled(EnemyFilterFeature)) return;

		void filter?.run();
	});

	listObserver = new MutationObserver((mutations) => {
		if (mutations.some((m) => Array.from(m.addedNodes).some((n) => isElement(n) && n.matches("li[class*='tableRow__']")))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(EnemyFilterFeature)) void filter?.run();
		}
	});
	tableObserver = new MutationObserver((mutations) => {
		if (mutations.some((m) => Array.from(m.addedNodes).some((n) => isElement(n) && n.tagName === "UL"))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(EnemyFilterFeature)) {
				void filter?.run();
				listObserver.observe(document.querySelector(".tableWrapper > ul"), { childList: true });
			}
		}
	});
	tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
	listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
}

async function addFilterContainer() {
	filter?.dispose();

	filter = createFilter<EnemyFilterState>({
		rowSelector: ".tableWrapper ul > li",
		container: {
			title: "Enemy Filter",
			class: "mt10",
			nextElement: await requireElement(".wrapper[role='alert']"),
			compact: true,
		},
		statisticsLabel: "enemies",
		enabled: filters.enemies.enabled,
		sections: [
			presetSection({ preset: "activity", defaults: filters.enemies.activity }),
			sliderSection({
				key: "level",
				title: "Level Filter",
				config: { min: 0, max: 100, step: 1 },
				defaults: { low: filters.enemies.levelStart, high: filters.enemies.levelEnd },
				formatCounter: (r) => `Level ${r.start} - ${r.end}`,
				test: (row, range) => {
					const level = convertToNumber(row.querySelector("[class*='level__']").textContent);

					if (range.start && level < range.start) return false;
					if (range.end !== 100 && level > range.end) return false;

					return true;
				},
			}),
			presetSection({
				preset: "stats-estimates",
				enabled: () => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.enemies && hasAPIData(),
				defaults: filters.enemies.estimates,
			}),
		],
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					enemies: {
						enabled: state.enabled,
						activity: state.activity,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						estimates: state.estimates ?? filters.enemies.estimates,
					},
				},
			});
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Enemy Filter" });
		},
	});

	await filter.run();
	filterSetupComplete = true;
}

export default class EnemyFilterFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("Enemy Filter", "enemies");
	}
	precondition() {
		return getPageStatus().access;
	}
	isEnabled() {
		return settings.pages.enemies.filter;
	}
	initialise() {
		initialiseListeners();
	}
	async execute() {
		await addFilterContainer();
	}
	cleanup() {
		filter?.dispose();
		listObserver?.disconnect();
		tableObserver?.disconnect();
		filterSetupComplete = false;
	}
	storageKeys() {
		return ["settings.pages.enemies.filter"];
	}
}
