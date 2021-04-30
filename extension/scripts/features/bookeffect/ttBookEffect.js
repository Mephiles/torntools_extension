"use strict";

(async () => {
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
		async () => {
			await requireElement("[data-category='Book']");
		}
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
			book.find(".qty.bold.t-hide").insertAdjacentHTML(
				"afterend",
				`<span class="tt-book-effect"> - ${BOOK_DESCRIPTIONS[parseInt(book.dataset.item)]}</span>`
			);
		});
	}

	function removeEffects() {
		document.findAll(".tt-book-effect").forEach((x) => x.remove());
	}
})();
