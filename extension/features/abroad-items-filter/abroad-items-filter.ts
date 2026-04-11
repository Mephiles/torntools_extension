import { Feature } from "@/features/feature-manager";
import { markTravelTableColumns } from "@/pages/travel-abroad-page";
import { filters, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { createFilterSection, createStatistics } from "@/utils/common/functions/filters";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, isAbroad, TAX_RATES } from "@/utils/common/functions/torn";

const SALES_TAX = TAX_RATES.salesTaxPercentage;
const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

async function addFilter() {
	await requireElement("[class*='stockTableWrapper___']");
	const { content } = createContainer("Abroad Item Filter", {
		class: "mb10",
		nextElement: document.querySelector("[class*='shops__']"),
		filter: true,
	});

	await requireElement("[class*='stockTableWrapper___'] > li");
	markTravelTableColumns();
	const statistics = createStatistics("items");
	content.appendChild(statistics.element);

	const filterContent = elementBuilder({
		type: "div",
		class: "content",
	});

	const profitOnlyFilter = createFilterSection({
		title: "Profit",
		checkbox: "Only Profit",
		default: filters.abroadItems.profitOnly,
		callback: filtering,
	});
	filterContent.appendChild(profitOnlyFilter.element);

	const outOfStockFilter = createFilterSection({
		title: "Out of stock",
		checkbox: "Hide out of stock",
		default: filters.abroadItems.outOfStock,
		callback: filtering,
	});
	filterContent.appendChild(outOfStockFilter.element);

	const categoryFilter = createFilterSection({
		title: "Category",
		checkboxes: [
			{ id: "plushie", description: "Plushies" },
			{ id: "flower", description: "Flowers" },
			{ id: "drug", description: "Drugs" },
			{ id: "weapon", description: "Weapons" },
			{ id: "temporary", description: "Temporary" },
			{ id: "other", description: "Other" },
		],
		defaults: filters.abroadItems.categories,
		callback: filtering,
	});
	filterContent.appendChild(categoryFilter.element);

	const taxesFilter = createFilterSection({
		title: "Taxes",
		checkboxes: [
			{ id: "salestax", description: `${SALES_TAX}% Sales Tax` },
			{ id: "anonymous", description: `${ANONYMOUS_TAX}% Anonymous Tax` },
		],
		defaults: filters.abroadItems.taxes,
		callback: filtering,
	});
	filterContent.appendChild(taxesFilter.element);

	content.appendChild(filterContent);

	await filtering();

	async function filtering() {
		const outOfStock = outOfStockFilter.isChecked(content);
		const profitOnly = settings.pages.travel.travelProfits && profitOnlyFilter.isChecked(content);
		const categories = categoryFilter.getSelections(content) as string[];
		const taxes = taxesFilter.getSelections(content) as string[];
		if (profitOnly) await requireElement(".tt-travel-market-cell");

		for (const li of findAllElements("[class*='stockTableWrapper___'] > li")) {
			showRow(li);

			if (profitOnly && convertToNumber(li.querySelector<HTMLElement>(".tt-travel-market-cell").dataset.ttValue) < 0) {
				hideRow(li);
				continue;
			}

			if (outOfStock && convertToNumber(li.querySelector("[data-tt-content-type='stock']").textContent) <= 0) {
				hideRow(li);
				continue;
			}

			if (categories.length) {
				const itemCategory = li.querySelector("[data-tt-content-type='type']").textContent.split(" ")[1].toLowerCase();
				switch (itemCategory) {
					case "plushie":
						if (!categories.includes("plushie")) {
							hideRow(li);
							continue;
						}
						break;
					case "flower":
						if (!categories.includes("flower")) {
							hideRow(li);
							continue;
						}
						break;
					case "drug":
						if (!categories.includes("drug")) {
							hideRow(li);
							continue;
						}
						break;
					case "melee":
					case "primary":
					case "secondary":
						if (!categories.includes("weapon")) {
							hideRow(li);
							continue;
						}
						break;
					case "temporary":
						if (!categories.includes("temporary")) {
							hideRow(li);
							continue;
						}
						break;
					default:
						if (!categories.includes("other")) {
							hideRow(li);
							continue;
						}
						break;
				}
			}
		}

		await ttStorage.change({
			filters: {
				abroadItems: {
					outOfStock,
					profitOnly,
					categories,
					taxes,
				},
			},
		});

		statistics.updateStatistics(
			findAllElements("[class*='stockTableWrapper___'] > li:not(.tt-hidden)").length,
			findAllElements("[class*='stockTableWrapper___'] > li").length,
			content,
		);
	}

	function showRow(row: Element) {
		row.classList.remove("tt-hidden");
	}

	function hideRow(row: Element) {
		row.classList.add("tt-hidden");
	}
}

function removeFilter() {
	removeContainer("Abroad Item Filter");
	findAllElements("[class*='stockTableWrapper___'] li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
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

	async execute() {
		await addFilter();
	}

	cleanup() {
		removeFilter();
	}

	storageKeys() {
		return ["settings.pages.travel.itemFilter"];
	}
}
