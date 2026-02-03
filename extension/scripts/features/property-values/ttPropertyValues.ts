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

		for (const property of findAllElements(".properties-list > *:not(.clear)")) {
			if (property.find(".tt-property-value")) return;

			const info = property.find(".info > li:nth-child(2)");
			if (!info) return;

			property.find(".title").insertAdjacentElement(
				"beforeend",
				elementBuilder({
					type: "span",
					class: "tt-property-value",
					text: ` (${formatNumber(convertToNumber(info.textContent), { currency: true })})`,
				})
			);
		}
	}

	function removeValues() {
		findAllElements(".tt-property-value").forEach((x) => x.remove());
	}
})();
