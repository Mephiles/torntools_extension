import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";

let observer: MutationObserver;

function initialiseListener() {
	observer = new MutationObserver(async () => {
		if (!FEATURE_MANAGER.isEnabled(PropertyValuesFeature)) return;

		const params = getHashParameters();
		if (params.has("p") && params.get("p") !== "properties") return;

		await addPropertyValues();
	});
	observer.observe(document.querySelector("#properties-page-wrap"), { childList: true });
}

async function addPropertyValues() {
	await requireElement("#properties-page-wrap .properties-list .title");

	for (const property of findAllElements(".properties-list > *:not(.clear)")) {
		if (property.querySelector(".tt-property-value")) continue;

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

function removeValues() {
	findAllElements(".tt-property-value").forEach((x) => x.remove());
}

export default class PropertyValuesFeature extends Feature {
	constructor() {
		super("Property Values", "property");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.property.value;
	}

	initialise() {
		initialiseListener();
	}

	async execute() {
		const params = getHashParameters();
		if (params.has("p") && params.get("p") !== "properties") return;

		await addPropertyValues();
	}

	cleanup() {
		removeValues();
		if (observer) observer.disconnect();
	}

	storageKeys() {
		return ["settings.pages.property.value"];
	}
}
