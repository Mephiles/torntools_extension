import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import {
	checkboxSection,
	createFilter,
	defaultFactionsItems,
	type FilterController,
	presetSection,
	type SliderRange,
	sliderSection,
} from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { extractFactionsFromPage, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(HospitalFilterFeature)) return;

		await filter.run();
	});
}

type HospitalFilterState = {
	enabled: boolean;
	activity: string[];
	revivesOn: boolean;
	faction: string;
	time: SliderRange;
	level: SliderRange;
};

async function addFilterContainer() {
	await requireElement(".userlist-wrapper.hospital-list-wrapper .users-list .time");

	const sections = [
		presetSection({
			preset: "activity",
			defaults: filters.abroadPeople.activity,
		}),

		checkboxSection({
			key: "revivesOn",
			title: "Revives On",
			label: "Enabled",
			defaultValue: filters.hospital.revivesOn,
			test: (row, revivesOn) => {
				if (!revivesOn) return true;

				return !row.querySelector(".revive")?.classList?.contains("reviveNotAvailable");
			},
		}),

		presetSection({
			preset: "faction",
			getOptions: () => [...defaultFactionsItems, ...extractFactionsFromPage().map((faction) => ({ value: faction, description: faction }))],
			default: filters.hospital.faction,
		}),

		sliderSection({
			key: "time",
			title: "Time Filter",
			config: { min: 0, max: 100, step: 1 },
			defaults: { low: filters.hospital.timeStart, high: filters.hospital.timeEnd },
			formatCounter: ({ start, end }) => `Time ${start}h - ${end}h`,
			test: (row, range) => {
				const hoursLeft = parseInt(row.querySelector(".info-wrap .time").lastChild.textContent?.match(/(\d*)h/)?.[1]) || 0;

				if (range.start && hoursLeft < range.start) return false;
				if (range.end !== 100 && hoursLeft > range.end) return false;

				return true;
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 0, max: 100, step: 1 },
			defaults: { low: filters.hospital.levelStart, high: filters.hospital.levelEnd },
			formatCounter: ({ start, end }) => `Level ${start} - ${end}`,
			test: (row, range) => {
				const level = convertToNumber(row.querySelector(".info-wrap .level").textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),
	];

	filter = createFilter<HospitalFilterState>({
		rowSelector: ".users-list > li",
		container: {
			title: "Hospital Filter",
			class: "mt10",
			nextElement: document.querySelector(".users-list-title"),
			compact: true,
		},
		statisticsLabel: "players",
		enabled: filters.hospital.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					hospital: {
						enabled: state.enabled,
						activity: state.activity,
						revivesOn: state.revivesOn,
						faction: state.faction,
						timeStart: state.time.start,
						timeEnd: state.time.end,
						levelStart: state.level.start,
						levelEnd: state.level.end,
					},
				},
			});
		},
	});
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
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.hospital.filter"];
	}
}
