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
		findAllElements("[data-category='Book']").forEach((book) => {
			if (book.querySelector(".tt-book-effect")) return;

			book.querySelector(".name-wrap .qty.t-hide").insertAdjacentElement(
				"afterend",
				elementBuilder({ type: "span", class: "tt-book-effect", text: ` - ${BOOK_DESCRIPTIONS[parseInt(book.dataset.item)]}` })
			);
		});
	}

	function removeEffects() {
		findAllElements(".tt-book-effect").forEach((x) => x.remove());
	}
})();
