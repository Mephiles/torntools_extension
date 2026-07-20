import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { isElement } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { createFilter, type FilterController, presetSection, type SliderRange, sliderSection } from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let listObserver: MutationObserver;
let tableObserver: MutationObserver;
let filterSetupComplete = false;

type FriendFilterState = { enabled: boolean; activity: string[]; level: SliderRange };

async function initialiseListeners() {
	listObserver = new MutationObserver((mutations) => {
		if (mutations.some((m) => Array.from(m.addedNodes).some((n) => isElement(n) && n.matches("li[class*='tableRow__']")))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(FriendFilterFeature)) void filter?.run();
		}
	});
	tableObserver = new MutationObserver((mutations) => {
		if (mutations.some((m) => Array.from(m.addedNodes).some((n) => isElement(n) && n.tagName === "UL"))) {
			if (filterSetupComplete && FEATURE_MANAGER.isEnabled(FriendFilterFeature)) {
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

	filter = createFilter<FriendFilterState>({
		rowSelector: ".tableWrapper ul > li",
		container: { title: "Friend Filter", class: "mt10", nextElement: await requireElement(".wrapper[role='alert']"), compact: true },
		statisticsLabel: "friends",
		enabled: filters.friends.enabled,
		sections: [
			presetSection({ preset: "activity", defaults: filters.friends.activity }),
			sliderSection({
				key: "level",
				title: "Level Filter",
				config: { min: 0, max: 100, step: 1 },
				defaults: { low: filters.friends.levelStart, high: filters.friends.levelEnd },
				formatCounter: (r) => `Level ${r.start} - ${r.end}`,
				test: (row, range) => {
					const level = convertToNumber(row.querySelector("[class*='level__']").textContent);

					if (range.start && level < range.start) return false;
					if (range.end !== 100 && level > range.end) return false;

					return true;
				},
			}),
		],
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: { friends: { enabled: state.enabled, activity: state.activity, levelStart: state.level.start, levelEnd: state.level.end } },
			});
			triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Friend Filter" });
		},
		preserveHeight: true,
	});

	await filter.run();
	filterSetupComplete = true;
}

export default class FriendFilterFeature extends Feature {
	constructor() {
		super("Friend Filter", "friends");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.friends.filter;
	}

	async initialise() {
		await initialiseListeners();
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
		return ["settings.pages.friends.filter"];
	}
}
