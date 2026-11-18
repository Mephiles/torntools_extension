import { filters, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findElement } from "@common/utils/functions/find-elements";
import { requireItemsLoaded } from "@common/utils/functions/requires";
import { getPageStatus, ITEM_TYPES } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { mount, unmount } from "svelte";
import CategoryValueCalculatorBox from "./category-value-calculator-box.svelte";

let box: unknown;

function getDefaultCategory(): string {
	const stored = filters.items.categoryValueCalculator.category;
	if (stored) return stored;

	const visibleItem = findElement(".items-cont[aria-expanded='true'] > li[data-item]", true);
	const itemCategory = visibleItem?.dataset.category;
	if (itemCategory) return itemCategory.toLowerCase();

	return ITEM_TYPES.filter((type) => type !== "Book")
		.toSorted()[0]
		.toLowerCase();
}

function removeBox() {
	if (!box) return;

	void unmount(box as Parameters<typeof unmount>[0]);
	box = undefined;
}

export default class CategoryValueCalculatorFeature extends Feature {
	constructor() {
		super("Category Value Calculator", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.categoryValueCalculator;
	}

	override requirements() {
		return hasAPIData() ? true : "No API access.";
	}

	override async execute() {
		await requireItemsLoaded();

		const anchor = findElement(".items-wrap");

		removeBox();
		box = mount(CategoryValueCalculatorBox, {
			target: anchor.parentElement!,
			anchor,
			props: { defaultCategory: getDefaultCategory() },
		});
	}

	override async reload() {
		await this.execute();
	}

	override storageKeys() {
		return ["settings.pages.items.categoryValueCalculator"];
	}
}
