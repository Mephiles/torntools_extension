import "./museum-market-link.css";
import { ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { getPageStatus, isSellable } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let observer: MutationObserver | undefined;

function initialiseMarketLink() {
	const tabs = document.querySelector("#tabs");
	if (!tabs) return;

	observer = new MutationObserver(() => showMarketLink());
	observer.observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
}

function showMarketLink() {
	const wrapper = document.querySelector("#tabs .show-item-info");
	const infoElement = wrapper?.querySelector<HTMLElement>("[class*='itemInfo___']");
	const image = wrapper?.querySelector<HTMLImageElement>("img");
	if (!infoElement || !image?.src) return;

	const match = image.src.match(/items\/([0-9]+)\/large.*\.png/i);
	if (!match) return;

	const id = parseInt(match[1]);

	const existingLink = infoElement.querySelector<HTMLElement>(".tt-museum-market-link");
	if (existingLink) {
		if (parseInt(existingLink.dataset.itemId) === id) return;

		removeMarketLink(infoElement);
	}

	if (!isSellable(id)) return;

	const name = document.querySelector(`.item-wrapper[itemid="${id}"] .coll-item-header`)?.textContent?.trim() || ITEM_RESOLVER.getStaticItem(id)?.name || "";
	const category = ITEM_RESOLVER.getStaticItem(id)?.type || "";

	const link = elementBuilder({
		type: "a",
		class: "tt-museum-market-link",
		dataset: { itemId: id },
		href: `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${id}&itemName=${name}&itemType=${category}`,
		attributes: { title: "Open Item Market" },
		children: [elementBuilder({ type: "i", class: "cql-item-market" })],
	});

	if (!fillEmptyPropertySlot(infoElement, link)) {
		const container = infoElement.querySelector<HTMLElement>("[class*='descriptionWrapper___']") || infoElement;
		container.appendChild(link);
	}
}

function fillEmptyPropertySlot(infoElement: HTMLElement, link: HTMLElement) {
	const list = infoElement.querySelector<HTMLElement>("[class*='properties___']");
	const titleTemplate = list?.querySelector<HTMLElement>("[class*='title___']");
	const valueWrapperTemplate = list?.querySelector<HTMLElement>("[class*='valueWrapper___']");
	if (!list || !titleTemplate || !valueWrapperTemplate) return false;

	const emptyContainer = Array.from(list.children)
		.map((row) => row.children[0])
		.find((container): container is HTMLElement => !!container && container.children.length === 0);
	if (!emptyContainer) return false;

	const title = titleTemplate.cloneNode(true) as HTMLElement;
	title.textContent = "Market:";

	const valueWrapper = valueWrapperTemplate.cloneNode(false) as HTMLElement;
	valueWrapper.appendChild(link);

	emptyContainer.append(title, valueWrapper);
	return true;
}

function removeMarketLink(scope: ParentNode = document) {
	const link = scope.querySelector<HTMLElement>(".tt-museum-market-link");
	if (!link) return;

	const valueWrapper = link.parentElement;
	if (valueWrapper?.closest("[class*='properties___']")) {
		valueWrapper.previousElementSibling?.remove();
		valueWrapper.remove();
	} else {
		link.remove();
	}
}

export default class MuseumMarketLinkFeature extends Feature {
	constructor() {
		super("Museum Market Link", "museum");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.museum.marketLinks;
	}

	initialise() {
		initialiseMarketLink();
	}

	execute() {
		showMarketLink();
	}

	cleanup() {
		observer?.disconnect();
		removeMarketLink();
	}

	storageKeys() {
		return ["settings.pages.museum.marketLinks"];
	}
}
