import { markTravelTableColumns } from "@common/pages/travel-abroad-page";
import { FEATURE_MANAGER, RUNTIME_INFORMATION, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { checkboxesSection, checkboxSection, createFilter, type FilterController } from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, TAX_RATES } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import TravelItemProfitsFeature from "@features/travel-item-profits/travel-item-profits";

const SALES_TAX = TAX_RATES.salesTaxPercentage;
const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

let filter: FilterController;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, (feature) => {
		if (!FEATURE_MANAGER.isEnabled(AbroadItemsFilterFeature) || feature.name !== "Travel Item Profits") return;

		filter.rerenderSections();
	});
	addCustomListener(EVENT_CHANNELS.FEATURE_DISABLED, (feature) => {
		if (!FEATURE_MANAGER.isEnabled(AbroadItemsFilterFeature) || feature.name !== "Travel Item Profits") return;

		filter.rerenderSections();
	});
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH, async () => {
		if (!FEATURE_MANAGER.isEnabled(AbroadItemsFilterFeature)) return;

		await filter.run();
	});
}

type AbroadItemsFilterState = {
	enabled: boolean;
	profitOnly: boolean | null;
	outOfStock: boolean;
	categories: string[];
	taxes: string[];
};

async function addFilterContainer() {
	await requireElement("[class*='stockTableWrapper___'] > li");

	await markTravelTableColumns();

	const sections = [
		checkboxSection({
			key: "profitOnly",
			title: "Profit",
			label: "Only Profit",
			defaultValue: filters.abroadItems.profitOnly,
			enabled: () => FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature),
			test: (row, profitOnly) => {
				if (!profitOnly) return true;

				const profitElement = row.querySelector<HTMLElement>(".tt-travel-market-cell");
				if (!profitElement) return false;

				return convertToNumber(profitElement.dataset.ttValue) >= 0;
			},
		}),

		checkboxSection({
			key: "outOfStock",
			title: "Out of stock",
			label: "Hide out of stock",
			defaultValue: filters.abroadItems.outOfStock,
			test: (row, outOfStock) => {
				if (!outOfStock) return true;

				const stockElement = row.querySelector("[data-tt-content-type='stock']");
				if (!stockElement) return true;

				return convertToNumber(stockElement.textContent) > 0;
			},
		}),

		checkboxesSection({
			key: "categories",
			title: "Category",
			items: [
				{ id: "plushie", description: "Plushies" },
				{ id: "flower", description: "Flowers" },
				{ id: "drug", description: "Drugs" },
				{ id: "weapon", description: "Weapons" },
				{ id: "temporary", description: "Temporary" },
				{ id: "other", description: "Other" },
			],
			defaults: filters.abroadItems.categories,
			test: (row, categories) => {
				if (!categories.length || categories.length === 6) return true;

				const typeElement = row.querySelector("[data-tt-content-type='type']");
				if (!typeElement) return false;

				const itemCategory = typeElement.textContent.split(" ")[1]?.toLowerCase() ?? "";
				const simpleCategory = simplifyItemCategory(itemCategory);

				return categories.includes(simpleCategory);
			},
		}),

		checkboxesSection({
			key: "taxes",
			title: "Taxes",
			enabled: () =>
				FEATURE_MANAGER.isEnabled(TravelItemProfitsFeature) &&
				// Never show this to a userscript user, as the storage between 2 script is not really shared. Instead, we'll force our own opinionated choice.
				!RUNTIME_INFORMATION.isUserscript(),
			items: [
				{ id: "salestax", description: `${SALES_TAX}% Sales Tax` },
				{ id: "anonymous", description: `${ANONYMOUS_TAX}% Anonymous Tax` },
			],
			defaults: filters.abroadItems.taxes,
			test: () => true, // doesn't actually filter, just for updating the database
		}),
	];

	filter = createFilter<AbroadItemsFilterState>({
		rowSelector: "[class*='stockTableWrapper___'] > li",
		container: {
			title: "Abroad Item Filter",
			class: "mb10",
			nextElement: document.querySelector("[class*='shops__']")!,
		},
		statisticsLabel: "items",
		enabled: filters.abroadItems.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: {
					abroadItems: {
						enabled: state.enabled,
						outOfStock: state.outOfStock,
						profitOnly: state.profitOnly ?? filters.abroadItems.profitOnly,
						categories: state.categories,
						taxes: state.taxes ?? filters.abroadItems.taxes,
					},
				},
			});
		},
	});
}

const weaponTypes = new Set(["melee", "primary", "secondary"]);
const allowedCategories = new Set(["plushie", "flower", "drug", "temporary"]);

function simplifyItemCategory(category: string) {
	if (weaponTypes.has(category)) return "weapon";

	return allowedCategories.has(category) ? category : "other";
}

export default class AbroadItemsFilterFeature extends Feature {
	constructor() {
		super("Abroad Item Filter", "travel");
	}

	precondition() {
		return isAbroad() && getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.travel.itemFilter;
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
		return ["settings.pages.travel.itemFilter"];
	}
}
