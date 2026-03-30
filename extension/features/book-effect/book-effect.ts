import "./book-effect.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { BOOK_DESCRIPTIONS, getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";

function initialiseAddEffects() {
	const listener = () => {
		if (FEATURE_MANAGER.isEnabled(BookEffectFeature)) addEffects();
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

export default class BookEffectFeature extends Feature {
	constructor() {
		super("Book Effect", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.bookEffects;
	}

	initialise() {
		initialiseAddEffects();
	}

	execute() {
		addEffects();
	}

	cleanup() {
		removeEffects();
	}

	storageKeys() {
		return ["settings.pages.items.bookEffects"];
	}
}
