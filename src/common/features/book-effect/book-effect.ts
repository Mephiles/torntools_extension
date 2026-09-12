import "./book-effect.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { BOOK_DESCRIPTIONS, getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseAddEffects() {
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, addEffects);
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, addEffects);
}

function addEffects() {
	findAllElements("[data-category='Book']").forEach((book) => {
		if (findElement(".tt-book-effect", book, true)) return;

		findElement(".name-wrap .qty.t-hide", book).insertAdjacentElement(
			"afterend",
			elementBuilder({ type: "span", class: "tt-book-effect", text: ` - ${BOOK_DESCRIPTIONS[parseInt(book.dataset.item!)]}` }),
		);
	});
}

export default class BookEffectFeature extends Feature {
	constructor() {
		super("Book Effect", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.bookEffects;
	}

	override initialise() {
		initialiseAddEffects();
	}

	override execute() {
		addEffects();
	}

	override storageKeys() {
		return ["settings.pages.items.bookEffects"];
	}
}
