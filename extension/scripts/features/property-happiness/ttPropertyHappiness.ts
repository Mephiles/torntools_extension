(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Property Happiness",
		"property",
		() => settings.apiUsage.user.properties && settings.pages.property.happy,
		initialiseListener,
		addPropertyHappiness,
		removeValues,
		{
			storage: ["settings.apiUsage.user.properties", "settings.pages.property.happy"],
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

		for (const property of document.findAll(".properties-list > li:not(.clear)")) {
			if (property.classList.contains("tt-modified")) return;

			const propertyID = parseInt(property.find(".image-place").dataset.id);
			property.classList.add("tt-modified");
			property.find(".image-description").insertAdjacentElement(
				"beforeend",
				elementBuilder({
					type: "div",
					class: "tt-property-happiness",
					text: `Happy: ${formatNumber(userdata.properties[propertyID]?.happy ?? 100)}`,
				})
			);
		}
	}

	function removeValues() {
		document.findAll(".tt-property-happiness").forEach((x) => x.remove());
		document.findAll(".properties-list > li.tt-modified").forEach((x) => x.classList.remove("tt-modified"));
	}
})();
