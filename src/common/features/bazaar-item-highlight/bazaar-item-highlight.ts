import { settings } from "@common/utils/data/database";
import { getSearchParameters } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events.ts";
import { findElement } from "@common/utils/functions/find-elements.ts";
import { requireElement, requireElementOptionally } from "@common/utils/functions/requires.ts";
import { getPageStatus, getUserDetails } from "@common/utils/functions/torn.ts";
import { Feature } from "@features/feature";
import styles from "./bazaar-item-highlight.module.css";

export const ITEM_ID_PARAMETER = "tt-item-id";

let hasScrolled = false;

function initializeListeners() {
	addCustomListener(EVENT_CHANNELS.BAZAAR__INFINITE_SCROLL, addHighlight);
}

async function addHighlight() {
	if (findElement(`.${styles.highlightItem}`, true)) return;

	const params = getSearchParameters();

	const bazaarUserId = parseInt(params.get("userId")!);
	const details = getUserDetails();
	if (!bazaarUserId || (!("error" in details) && bazaarUserId === details.id)) await requireElement(".info-msg-cont:not(.red) .msg");
	else await requireElement(".info-msg-cont .msg a[href]");

	await requireElement("[class*='itemsContainner___'] [class*='preloader___']", { invert: true });

	const itemID = params.get(ITEM_ID_PARAMETER)!;

	const itemElement = await requireElementOptionally(`[class*='rowItems___'] > [class*='item___']:has(img[srcset*='/${itemID}/'])`);
	if (!itemElement) return;

	itemElement.classList.add(styles.highlightItem);

	if (!hasScrolled && settings.pages.itemmarket.bazaarItemHighlightScroll) {
		itemElement.scrollIntoView({ behavior: "smooth" });
		hasScrolled = true;
	}
}

export default class BazaarItemHighlightFeature extends Feature {
	constructor() {
		super("Bazaar Item Highlight", "item market");
	}

	override precondition() {
		return getPageStatus().access && getSearchParameters().has(ITEM_ID_PARAMETER);
	}

	override requirements() {
		return super.requirements();
	}

	override isEnabled() {
		return settings.pages.itemmarket.bazaarItemHighlight;
	}

	override initialise() {
		initializeListeners();
	}

	override async execute() {
		await addHighlight();
	}

	override storageKeys() {
		return ["settings.pages.itemmarket.bazaarItemHighlight"];
	}
}
