import { COMMON_PROPERTY_TYPES } from "@common/constants/torn/properties.ts";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { createFilter, multiSelectSection, radioSection, sliderSection } from "@common/utils/functions/filters";
import type { FilterController, SliderRange } from "@common/utils/functions/filters";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let filter: FilterController;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async () => {
		if (!FEATURE_MANAGER.isEnabled(PropertiesFilterFeature)) return;

		filter?.reattach({ previousElement: document.querySelector(".properties-tabs")! });
		await filter?.run();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(PropertiesFilterFeature)) return;

		filter?.reattach({ previousElement: document.querySelector(".properties-tabs")! });
		await filter?.run();
	});
}

type PropertiesFilterState = {
	enabled: boolean;
	daysOnLease: SliderRange;
	status: string;
	types: string[];
};

const REGEX_LEASED = /Leased to (?<name>.*) \((?<left>\d+) \/ (?<total>\d+) days\)/;

async function addFilterContainer() {
	await requireElement(".properties-list > li");

	const sections = [
		sliderSection({
			key: "daysOnLease",
			title: "Days left on lease",
			config: { min: 1, max: 100, step: 1 },
			defaults: { low: filters.properties.daysOnLeaseLow, high: filters.properties.daysOnLeaseHigh },
			formatCounter: ({ start, end }) => `${start} - ${end} days`,
			test: (row, range) => {
				const description = row.querySelector(".image-description > span");
				if (!description) return true;

				const leaseMatch = REGEX_LEASED.exec(description.textContent.trim());
				if (!leaseMatch) return true;

				const days = parseInt(leaseMatch.groups.left);
				if (isNaN(days)) return false;

				return days >= range.start && days <= range.end;
			},
		}),

		radioSection({
			key: "status",
			title: "Status",
			items: [
				{ description: "All", value: "all" },
				{ description: "Occupied", value: "occupied" },
				{ description: "Leased", value: "leased" },
				{ description: "Empty", value: "empty" },
			],
			defaultValue: filters.properties.status,
			test: (row, status) => {
				if (status === "all") return true;

				const description = row.querySelector(".image-description > span")?.textContent.toLowerCase();
				if (!description) return false;

				if (status === "occupied") return description?.includes("living");
				else if (status === "leased") return description?.includes("leased to");
				else if (status === "empty") return description?.includes("owned");
				else return true;
			},
		}),

		multiSelectSection({
			key: "types",
			title: "Types",
			items: COMMON_PROPERTY_TYPES.map((property) => ({ value: property, description: property })),
			defaults: filters.properties.types,
			test: (row, types) => {
				if (!types.length) return true;

				const image = row.querySelector(".image-place img[alt]");
				const type = image.getAttribute("alt").replace("Spouse's ", "");

				return types.includes(type);
			},
		}),
	];

	filter = createFilter<PropertiesFilterState>({
		rowSelector: ".properties-list > li:not(.clear)",
		container: {
			title: "Properties Filter",
			class: "mt10 mb10",
			previousElement: document.querySelector(".properties-tabs")!,
		},
		statisticsLabel: "properties",
		enabled: filters.properties.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					properties: {
						enabled: state.enabled,
						daysOnLeaseLow: state.daysOnLease.start,
						daysOnLeaseHigh: state.daysOnLease.end,
						status: state.status,
						types: state.types,
					},
				},
			});
		},
		onAfterRun: () => {
			filter?.getRows().forEach((row) => row.classList.remove("t-m-clear", "m-clear"));
			filter?.getRows(true).forEach((row, index) => {
				if ((index + 1) % 2 === 0) row.classList.add("t-m-clear");
				if ((index + 1) % 3 === 0) row.classList.add("m-clear");
			});
		},
	});
}

export default class PropertiesFilterFeature extends Feature {
	constructor() {
		super("Properties Filter", "properties");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.property.filter;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		filter?.getRows().forEach((row, index) => {
			row.classList.remove("t-m-clear", "m-clear");
			if ((index + 1) % 2 === 0) row.classList.add("t-m-clear");
			if ((index + 1) % 3 === 0) row.classList.add("m-clear");
		});
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.property.filter"];
	}
}
