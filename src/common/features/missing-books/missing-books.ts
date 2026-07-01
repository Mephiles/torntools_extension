import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./missing-books.module.css";

function initialiseBooks() {
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, async ({ tab }) => {
		if (!FEATURE_MANAGER.isEnabled(MissingBooksFeature) || tab !== "Book") {
			removeBooks();
			return;
		}

		await showBooks();
	});
}
async function showBooks() {
	removeBooks();

	const books = ITEM_RESOLVER.getAllStaticItems()
		.filter((item) => !ITEM_RESOLVER.hasFullItems() || (ITEM_RESOLVER.getFullItem(item.id)?.circulation ?? true))
		.filter((item) => item.type === "Book");

	const currentItemsElements = findAllElements(`#category-wrap > #books-items[aria-expanded='true'] > li[data-item]`);
	if (!currentItemsElements.length || currentItemsElements.length === books.length) return;

	const currentItems = currentItemsElements.map((x) => parseInt(x.dataset.item));
	const needed = books.filter((x) => !currentItems.some((y) => x.id === y)).sort((a, b) => a.name.localeCompare(b.name));
	if (!needed.length) return;

	const wrapper = elementBuilder({
		type: "div",
		id: "missing-books",
		children: needed.map((item) =>
			elementBuilder({
				type: "div",
				class: styles.missingBook,
				children: [
					elementBuilder({
						type: "img",
						attributes: { src: `https://www.torn.com/images/items/${item.id}/large.png`, alt: item.name },
					}),
					elementBuilder({ type: "span", text: item.name }),
				],
				dataset: { id: item.id, name: item.name },
			}),
		),
	});

	document.querySelector(".main-items-cont-wrap").insertAdjacentElement("afterend", wrapper);
}

function removeBooks() {
	document.getElementById("missing-books")?.remove();
}

export class MissingBooksFeature extends Feature {
	constructor() {
		super("Missing Books", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.missingBooks;
	}

	async initialise() {
		initialiseBooks();
	}

	async execute() {
		await requireElement(".last-row");
		await showBooks();
	}

	cleanup() {
		removeBooks();
	}

	storageKeys() {
		return ["settings.pages.items.missingBooks"];
	}
}
