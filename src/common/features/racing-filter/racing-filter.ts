import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { getSearchParameters, isTextNode } from "@common/utils/functions/dom";
import {
	checkboxesSection,
	createFilter,
	type FilterController,
	multiSelectSection,
	type SliderRange,
	sliderSection,
	textSection,
} from "@common/utils/functions/filters";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;

function initialiseListeners() {
	addXHRListener(async ({ detail: { page, ...detail } }) => {
		if (!FEATURE_MANAGER.isEnabled(RacingFilterFeature) || !("uri" in detail)) return;

		const { uri } = detail;
		if (page === "page" && uri) {
			if (uri.sid !== "racing" && uri.sid !== "undefined") {
				removeFilters();
				return;
			}
			if (uri.tab !== "customrace" && uri.tab !== "undefined") {
				removeFilters();
				return;
			}

			if (!detail.xhr.responseText.includes("event-list")) return;

			await requireElement(".events-list");
			void addFilterContainer();
		}
	});
}

type RacingFilterState = {
	enabled: boolean;
	name: string;
	hideRaces: string[];
	track: string[];
	time: SliderRange;
	laps: SliderRange;
	drivers: SliderRange;
};

async function addFilterContainer() {
	await requireElement(".custom-events-wrap");

	filter?.dispose();

	const TRACKS = [
		"Uptown",
		"Withdrawal",
		"Underdog",
		"Parkland",
		"Docks",
		"Commerce",
		"Two Islands",
		"Industrial",
		"Vector",
		"Mudpit",
		"Hammerhead",
		"Sewage",
		"Meltdown",
		"Speedway",
		"Stone Park",
		"Convict",
	];

	filter = createFilter<RacingFilterState>({
		rowSelector: ".events-list > li:not(.clear)",
		container: {
			title: "Racing Filter",
			class: "mt10",
			nextElement: document.querySelector(".custom-events-wrap"),
			compact: true,
		},
		statisticsLabel: "races",
		enabled: filters.racing.enabled,
		sections: [
			checkboxesSection({
				key: "hideRaces",
				title: "Hide Races",
				items: [
					{ id: "full", description: "Full" },
					{ id: "protected", description: "Protected" },
					{ id: "incompatible", description: "Incompatible" },
					{ id: "paid", description: "With Fee" },
					{ id: "limited-car", description: "Limited Car" },
				],
				defaults: filters.racing.hideRaces,
				test: (row, hideRaces) => {
					if (!hideRaces.length) return true;

					const isProtected = row.classList.contains("protected");
					if (hideRaces.includes("protected") && isProtected) return false;

					const isIncompatible = row.classList.contains("no-suitable");
					if (hideRaces.includes("incompatible") && isIncompatible) return false;

					if (hideRaces.includes("paid")) {
						const feeEl = row.querySelector<HTMLElement>("li.fee");
						if (feeEl) {
							const feeAmount = parseInt(feeEl.textContent.replace(/\D/g, ""), 10);
							if (feeAmount > 0) return false;
						}
					}

					if (hideRaces.includes("full")) {
						const driversEl = row.querySelector<HTMLElement>("li.drivers");
						if (driversEl) {
							const match = driversEl.textContent.replace(/\s+/g, "").match(/(\d+)\/(\d+)/);
							if (match && parseInt(match[1], 10) >= parseInt(match[2], 10)) return false;
						}
					}

					if (hideRaces.includes("limited-car")) {
						const limited = !row.querySelector(".car")?.textContent.trim().includes("Any car");
						if (limited) return false;
					}

					return true;
				},
			}),

			sliderSection({
				key: "time",
				title: "Start Time Filter",
				config: { min: 0, max: 48, step: 1 },
				defaults: { low: filters.racing.timeStart, high: filters.racing.timeEnd },
				formatCounter: (r) => `Race Start In ${r.start}h - ${r.end}h`,
				test: (row, range) => {
					const timeText = row.querySelector<HTMLElement>(".event-wrap .startTime").textContent.trim();
					if (!timeText || timeText.toLowerCase() === "waiting") {
						return range.start === 0 && range.end === 0;
					}

					const clean = timeText.toLowerCase();
					const hours = parseInt(clean.match(/(\d+)\s*h/)?.[1]) || 0;
					const minutes = parseInt(clean.match(/(\d+)\s*m/)?.[1]) || 0;
					const totalHours = hours + Math.floor(minutes / 60);

					if (range.start && totalHours < range.start) return false;
					if (range.end !== 48 && totalHours >= range.end) return false;

					return true;
				},
			}),

			sliderSection({
				key: "laps",
				title: "Laps",
				config: { min: 1, max: 100, step: 1 },
				defaults: { low: filters.racing.lapsMin, high: filters.racing.lapsMax },
				formatCounter: (r) => `Laps ${r.start} - ${r.end}`,
				test: (row, range) => {
					const laps = parseInt(row.querySelector(".laps").textContent.match(/\d+/)[0], 10);
					return laps >= range.start && laps <= range.end;
				},
			}),

			sliderSection({
				key: "drivers",
				title: "Drivers",
				config: { min: 2, max: 100, step: 1 },
				defaults: { low: filters.racing.driversMin, high: filters.racing.driversMax },
				formatCounter: (r) => `Maximum Drivers ${r.start} - ${r.end}`,
				test: (row, range) => {
					const driversEl = row.querySelector<HTMLElement>("li.drivers");
					if (!driversEl) return true;

					const match = driversEl.textContent.replace(/\s+/g, "").match(/(\d+)\/(\d+)/);
					if (!match) return true;

					const maxDrivers = parseInt(match[2], 10);
					return maxDrivers >= range.start && maxDrivers <= range.end;
				},
			}),

			multiSelectSection({
				key: "track",
				title: "Track",
				items: TRACKS.map((track) => ({ value: track, description: track })),
				defaults: filters.racing.track,
				test: (row, track) => {
					if (!track.length) return true;

					const trackEl = row.querySelector("li.track");
					const trackName = Array.from(trackEl.childNodes)
						.filter(isTextNode)
						.map((node) => node.textContent.trim())
						.join(" ")
						.trim();

					return track.includes(trackName);
				},
			}),

			textSection({
				key: "name",
				title: "Name",
				defaultValue: filters.racing.name,
				test: (row, name) => {
					if (!name) return true;

					const raceName = row.querySelector<HTMLElement>(".event-wrap .name").textContent;

					return raceName.toLowerCase().includes(name.toLowerCase());
				},
			}),
		],
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					racing: {
						enabled: state.enabled,
						hideRaces: state.hideRaces,
						timeStart: state.time.start,
						timeEnd: state.time.end,
						lapsMin: state.laps.start,
						lapsMax: state.laps.end,
						driversMin: state.drivers.start,
						driversMax: state.drivers.end,
						track: state.track,
						name: state.name,
					},
				},
			});
		},
	});

	await filter.run();
}

function removeFilters() {
	filter?.dispose();
}

export default class RacingFilterFeature extends Feature {
	constructor() {
		super("Racing Filter", "racing");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.racing.filter;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		if (getSearchParameters().get("tab") === "customrace") await addFilterContainer();
	}

	cleanup() {
		removeFilters();
	}

	storageKeys() {
		return ["settings.pages.racing.filter"];
	}
}
