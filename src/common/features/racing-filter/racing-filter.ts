import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { getSearchParameters, isTextNode } from "@common/utils/functions/dom";
import { checkboxesSection, createFilter, multiSelectSection, sliderSection, textSection } from "@common/utils/functions/filters";
import type { FilterController, SliderRange } from "@common/utils/functions/filters";
import { findElement } from "@common/utils/functions/find-elements";
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

			if (!detail.xhr.responseText!.includes("events-list")) return;

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
	exemptions: string[];
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
			nextElement: findElement(".custom-events-wrap"),
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
						const feeEl = findElement("li.fee", row, true);
						if (feeEl) {
							const feeAmount = parseInt(feeEl.textContent.replaceAll(/\D/g, ""), 10);
							if (feeAmount > 0) return false;
						}
					}

					if (hideRaces.includes("full")) {
						const driversEl = findElement("li.drivers", row, true);
						if (driversEl) {
							const match = driversEl.textContent.replaceAll(/\s+/g, "").match(/(\d+)\/(\d+)/);
							if (match && parseInt(match[1], 10) >= parseInt(match[2], 10)) return false;
						}
					}

					if (hideRaces.includes("limited-car")) {
						const limited = !findElement(".car", row, true)?.textContent.trim().includes("Any car");
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
					const timeText = findElement(".event-wrap .startTime", row).textContent.trim();
					if (!timeText || timeText.toLowerCase() === "waiting") {
						return range.start === 0 && range.end === 0;
					}

					const clean = timeText.toLowerCase();
					const hours = parseInt(clean.match(/(\d+)\s*h/)?.[1] ?? "") || 0;
					const minutes = parseInt(clean.match(/(\d+)\s*m/)?.[1] ?? "") || 0;
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
					const laps = parseInt(findElement(".laps", row).textContent.match(/\d+/)?.[0] ?? "", 10);
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
					const driversEl = findElement("li.drivers", row, true);
					if (!driversEl) return true;

					const match = driversEl.textContent.replaceAll(/\s+/g, "").match(/(\d+)\/(\d+)/);
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

					const trackEl = findElement("li.track", row);
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

					const raceName = findElement(".event-wrap .name", row).textContent;

					return raceName.toLowerCase().includes(name.toLowerCase());
				},
			}),

			checkboxesSection({
				key: "exemptions",
				title: "Exemptions",
				priority: 0,
				isExemption: true,
				items: [{ id: "competitions", description: "Competitions" }],
				defaults: filters.racing.exemptions,
				test: (row, exemptCompetitions) => {
					if (!exemptCompetitions.length) return false;

					return exemptCompetitions.includes("competitions") && row.classList.contains("gold");
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
						exemptions: state.exemptions,
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

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.racing.filter;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		if (getSearchParameters().get("tab") === "customrace") await addFilterContainer();
	}

	override storageKeys() {
		return ["settings.pages.racing.filter"];
	}
}
