(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Hide Recycle Message",
		"items",
		() => settings.pages.items.hideRecycleMessage,
		null,
		hideMessage,
		showMessage,
		{
			storage: ["settings.pages.items.hideRecycleMessage"],
		},
		null
	);

	function hideMessage() {
		const recycleMessageElement = document.evaluate(
			"//*[contains(@class, 'info-msg-cont')][.//*[contains(text(), 'clear up your inventory')]]",
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
		if (!recycleMessageElement || !isHTMLElement(recycleMessageElement)) return;

		const delimiter = recycleMessageElement.previousElementSibling as HTMLElement;

		recycleMessageElement.dataset.type = "recycle-message";
		recycleMessageElement.classList.add("tt-hidden");
		delimiter.dataset.type = "recycle-message";
		delimiter.classList.add("tt-hidden");
	}

	function showMessage() {
		findAllElements(".tt-hidden[data-type='recycle-message']").forEach((hidden) => {
			hidden.classList.remove("tt-hidden");
		});
	}
})();
