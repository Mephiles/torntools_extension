(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Hide Too Many Items Warning",
		"items",
		() => settings.pages.items.hideTooManyItemsWarning,
		null,
		hideMessage,
		showMessage,
		{
			storage: ["settings.pages.items.hideTooManyItemsWarning"],
		},
		null
	);

	function hideMessage() {
		const tooManyItemsWarning = document.evaluate(
			"//*[contains(@class, 'info-msg-cont')][.//*[contains(text(), 'recommend you reduce the number of items')]]",
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
		if (!tooManyItemsWarning || !isHTMLElement(tooManyItemsWarning)) return;

		const delimiter = tooManyItemsWarning.previousElementSibling as HTMLElement;

		tooManyItemsWarning.dataset.type = "too-many-items-warning";
		tooManyItemsWarning.classList.add("tt-hidden");
		delimiter.dataset.type = "too-many-items-warning";
		delimiter.classList.add("tt-hidden");
	}

	function showMessage() {
		findAllElements(".tt-hidden[data-type='too-many-items-warning']").forEach((hidden) => {
			hidden.classList.remove("tt-hidden");
		});
	}
})();
