import "./property-happiness.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";

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
			})
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
