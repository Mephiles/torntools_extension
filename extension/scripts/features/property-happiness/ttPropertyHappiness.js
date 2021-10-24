"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Property Happiness",
		"property",
		() => settings.pages.property.happy,
		initialiseListener,
		addPropertyHappiness,
		removeValues,
		{
			storage: ["settings.pages.property.happy"],
		},
		null
	);

	function initialiseListener() {
		new MutationObserver(() => {
			if (feature.enabled()) addPropertyHappiness();
		}).observe(document.find("#properties-page-wrap"), { childList: true });
	}

	async function addPropertyHappiness() {
		await requireElement("#properties-page-wrap .properties-list .title");

		for (const property of document.findAll(".properties-list > *:not(.clear)")) {
			if (property.find(".tt-property-happiness")) return;

			const info = property.find(".info > li:nth-child(2)");
			const propertyID = parseInt(property.find("[data-id]").dataset.id);
			if (!propertyID || !info) return;

			property.find(".info").insertAdjacentElement(
				"beforeend",
				document.newElement({
					type: "span",
					class: "tt-property-happiness",
					text: `Happy: ${formatNumber(userdata.properties[propertyID].happy)}`,
				})
			);
		}
	}

	function removeValues() {
		document.findAll(".tt-property-happiness").forEach((x) => x.remove());
	}
})();
