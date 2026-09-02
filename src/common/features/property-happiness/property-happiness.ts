import "./property-happiness.css";
import type { PropertiesPage } from "@common/pages/properties-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const SUPPORTED_ROUTES: PropertiesPage[] = ["all-properties", "spouse-properties", "your-properties"];

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route }) => {
		if (!FEATURE_MANAGER.isEnabled(PropertyHappinessFeature) || !SUPPORTED_ROUTES.includes(route.page)) return;

		await addPropertyHappiness();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route }) => {
		if (!FEATURE_MANAGER.isEnabled(PropertyHappinessFeature) || !SUPPORTED_ROUTES.includes(route.page)) return;

		await addPropertyHappiness();
	});
}

async function addPropertyHappiness() {
	await requireElement("#properties-page-wrap .properties-list .title");

	for (const property of findAllElements(".properties-list > li:not(.clear):not(.tt-modified)")) {
		const propertyID = parseInt(findElement(".image-place", property).dataset.id);
		const apiProperty = userdata.properties.find((p) => p.id === propertyID);

		property.classList.add("tt-modified");
		findElement(".image-description", property).insertAdjacentElement(
			"beforeend",
			elementBuilder({
				type: "div",
				class: "tt-property-happiness",
				text: `Happy: ${formatNumber(apiProperty?.happy ?? 100)}`,
			}),
		);
	}
}

export default class PropertyHappinessFeature extends Feature {
	constructor() {
		super("Property Happiness", "property");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.apiUsage.user.properties && settings.pages.property.happy;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		const p = getHashParameters().get("p");
		if (p && p !== "properties" && p !== "yourProperties" && p !== "spousesProperties") return;

		await addPropertyHappiness();
	}

	override storageKeys() {
		return ["settings.apiUsage.user.properties", "settings.pages.property.happy"];
	}
}
