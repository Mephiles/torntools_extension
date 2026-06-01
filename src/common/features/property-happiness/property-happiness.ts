import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import "./property-happiness.css";

import { settings, userdata } from "@utils/data/database";
import { elementBuilder, findAllElements, getHashParameters } from "@utils/functions/dom";
import { formatNumber } from "@utils/functions/formatting";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus } from "@utils/functions/torn";

let observer: MutationObserver;

function initialiseListener() {
	observer = new MutationObserver(async () => {
		if (!FEATURE_MANAGER.isEnabled(PropertyHappinessFeature)) return;

		await addPropertyHappiness();
	});
	observer.observe(document.querySelector("#properties-page-wrap"), { childList: true });
}

async function addPropertyHappiness() {
	await requireElement("#properties-page-wrap .properties-list .title");

	for (const property of findAllElements(".properties-list > li:not(.clear)")) {
		if (property.classList.contains("tt-modified")) return;

		const propertyID = parseInt(property.querySelector<HTMLElement>(".image-place").dataset.id);
		const apiProperty = userdata.properties.find((p) => p.id === propertyID);

		property.classList.add("tt-modified");
		property.querySelector(".image-description").insertAdjacentElement(
			"beforeend",
			elementBuilder({
				type: "div",
				class: "tt-property-happiness",
				text: `Happy: ${formatNumber(apiProperty?.happy ?? 100)}`,
			}),
		);
	}
}

function removeValues() {
	findAllElements(".tt-property-happiness").forEach((x) => x.remove());
	findAllElements(".properties-list > li.tt-modified").forEach((x) => x.classList.remove("tt-modified"));
}

export default class PropertyHappinessFeature extends Feature {
	constructor() {
		super("Property Happiness", "property");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.apiUsage.user.properties && settings.pages.property.happy;
	}

	initialise() {
		initialiseListener();
	}

	async execute() {
		const params = getHashParameters();
		if (params.has("p") && params.get("p") !== "properties") return;

		await addPropertyHappiness();
	}

	cleanup() {
		removeValues();
		if (observer) observer.disconnect();
	}

	storageKeys() {
		return ["settings.apiUsage.user.properties", "settings.pages.property.happy"];
	}
}
