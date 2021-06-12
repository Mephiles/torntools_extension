"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Property Value",
		"property",
		() => settings.pages.property.value,
		initialiseListener,
		addPropertyValues,
		removeValues,
		{
			storage: ["settings.pages.property.value"],
		},
		null
	);

	function initialiseListener() {
		new MutationObserver(() => {
			if (feature.enabled()) addPropertyValues();
		}).observe(document.find("#properties-page-wrap"), { childList: true });
	}

	async function addPropertyValues() {
		await requireElement("#properties-page-wrap .properties-list .title");
		for (const property of document.findAll(".properties-list > *:not(.clear)")) {
			if (property.find(".tt-property-value")) return;
			const propertyInfo = property.find(".info");
			if (propertyInfo)
				property.find(".title").insertAdjacentHTML(
					"beforeend",
					`<span class="tt-property-value">&nbsp;(${formatNumber(propertyInfo.innerText.split("\n")[3].slice(1).replaceAll(",", ""), {
						currency: true,
					})})</span>`
				);
		}
	}

	function removeValues() {
		document.findAll(".tt-property-value").forEach((x) => x.remove());
	}
})();
