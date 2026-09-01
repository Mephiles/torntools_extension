import type { PropertiesPage } from "@common/pages/properties-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const SUPPORTED_ROUTES: PropertiesPage[] = ["all-properties", "spouse-properties", "your-properties"];

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route }) => {
		if (!FEATURE_MANAGER.isEnabled(PropertyValuesFeature) || !SUPPORTED_ROUTES.includes(route.page)) return;

		await addPropertyValues();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route }) => {
		if (!FEATURE_MANAGER.isEnabled(PropertyValuesFeature) || !SUPPORTED_ROUTES.includes(route.page)) return;

		await addPropertyValues();
	});
}

async function addPropertyValues() {
	await requireElement("#properties-page-wrap .properties-list .title");

	for (const property of findAllElements(".properties-list > *:not(.clear):not(:has(.tt-property-value))")) {
		const info = property.querySelector(".info > li:nth-child(2)");
		if (!info) continue;

		property.querySelector(".title").insertAdjacentElement(
			"beforeend",
			elementBuilder({
				type: "span",
				class: "tt-property-value",
				text: ` (${formatNumber(convertToNumber(info.textContent), { currency: true })})`,
			}),
		);
	}
}

export default class PropertyValuesFeature extends Feature {
	constructor() {
		super("Property Values", "property");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.property.value;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		const p = getHashParameters().get("p");
		if (p && p !== "properties" && p !== "yourProperties" && p !== "spousesProperties") return;

		await addPropertyValues();
	}

	override storageKeys() {
		return ["settings.pages.property.value"];
	}
}
