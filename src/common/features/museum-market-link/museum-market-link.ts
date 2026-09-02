import "./museum-market-link.css";
import { ITEM_RESOLVER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { getPageStatus, isSellable } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let observer: MutationObserver | undefined;

function initialiseMarketLink() {
	const tabs = findElement("#tabs", true);
	if (!tabs) return;

	observer?.disconnect();
	observer = new MutationObserver(() => showMarketLink());
	observer.observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });

	showMarketLink();
}

function showMarketLink() {
	const wrapper = findElement("#tabs .show-item-info", true);
	const infoElement = wrapper ? findElement("[class*='itemInfo___']", wrapper, true) : undefined;
	const image = wrapper ? findElement<HTMLImageElement>("img", wrapper, true) : undefined;
	if (!infoElement || !image?.src) return;

	const match = image.src.match(/items\/([0-9]+)\/large.*\.png/i);
	if (!match) return;

	const id = parseInt(match[1]);

	const existingLink = findElement(".tt-museum-market-link", infoElement, true);
	if (existingLink) {
		if (parseInt(existingLink.dataset.itemId) === id) return;

		removeMarketLink(infoElement);
	}

	if (!isSellable(id)) return;

	const name = findElement(`.item-wrapper[itemid="${id}"] .coll-item-header`, true)?.textContent?.trim() || ITEM_RESOLVER.getStaticItem(id)?.name || "";
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
		const container = findElement("[class*='descriptionWrapper___']", infoElement, true) || infoElement;
		container.appendChild(link);
	}
}

function fillEmptyPropertySlot(infoElement: Element, link: HTMLElement) {
	const list = findElement("[class*='properties___']", infoElement, true);
	const titleTemplate = list ? findElement("[class*='title___']", list, true) : undefined;
	const valueWrapperTemplate = list ? findElement("[class*='valueWrapper___']", list, true) : undefined;
	if (!list || !titleTemplate || !valueWrapperTemplate) return false;

	const emptyContainer = Array.from(list.children)
		.map((row) => row.children[0])
		.find((container) => container?.children.length === 0);
	if (!emptyContainer) return false;

	const title = titleTemplate.cloneNode(true);
	title.textContent = "Market:";

	const valueWrapper = valueWrapperTemplate.cloneNode(false);
	valueWrapper.appendChild(link);

	emptyContainer.append(title, valueWrapper);
	return true;
}

function removeMarketLink(scope: ParentNode = document) {
	const link = findElement(".tt-museum-market-link", scope, true);
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

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.museum.marketLinks;
	}

	override execute() {
		initialiseMarketLink();
	}

	override storageKeys() {
		return ["settings.pages.museum.marketLinks"];
	}
}
