(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Book Effect",
		"items",
		() => settings.pages.items.bookEffects,
		initialiseAddEffects,
		addEffects,
		removeEffects,
		{
			storage: ["settings.pages.items.bookEffects"],
		},
		null
	);

	function initialiseAddEffects() {
		const listener = () => {
			if (feature.enabled()) addEffects();
		};
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
	}

	function addEffects() {
		document.findAll("[data-category='Book']").forEach((book) => {
			if (book.find(".tt-book-effect")) return;

			book.find(".name-wrap .qty.t-hide").insertAdjacentElement(
				"afterend",
				elementBuilder({ type: "span", class: "tt-book-effect", text: ` - ${BOOK_DESCRIPTIONS[parseInt(book.dataset.item)]}` })
			);
		});
	}

	function removeEffects() {
		document.findAll(".tt-book-effect").forEach((x) => x.remove());
	}
})();
