import { settings } from "@common/utils/data/database";
import { elementBuilder, mobile, tabletVertical } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./fill-max.module.css";

const SELECTOR_MOBILE_LIST = "[data-testid='bazaar-items']";

let reactObserver: MutationObserver | undefined;

function initialiseListeners() {
	if (!mobile && !tabletVertical) return;

	reactObserver = new MutationObserver(() => maxBuyListener(""));
}

async function addFillMax() {
	if (mobile || tabletVertical) {
		await maxBuyListener();
		reactObserver.observe(await requireElement(SELECTOR_MOBILE_LIST), { childList: true });
	} else document.addEventListener("click", maxBuyListener);
}
async function maxBuyListener(clickEvent: any = null) {
	if (mobile || tabletVertical) {
		await requireElement(`${SELECTOR_MOBILE_LIST} [class*='buyForm___']`);
		findAllElements(`${SELECTOR_MOBILE_LIST} [class*='itemDescription__']:not(.tt-fill-max)`).forEach((buyForm) => {
			buyForm.classList.add("tt-fill-max");
			addButtonAndListener(buyForm);
		});
	} else {
		if (!clickEvent?.target.closest("[class*='controlPanelButton___']")) return;
		requireElement("[class*='buyMenu__']").then(() => addButtonAndListener(findElement("[class*='buyMenu__']")));
	}

	function addButtonAndListener(parent: Element) {
		const fillMax = elementBuilder({
			type: "span",
			text: "fill max",
			class: [styles.ttMaxBuy, styles.ttMaxBuyBazaar],
			events: {
				click(event) {
					event.stopPropagation();
					let max = mobile
						? parseInt(findElement("[class*='amount__']", parent).firstElementChild.textContent)
						: parseInt(findElement("[class*='amount__']", parent).childNodes[1].textContent);
					if (!settings.pages.bazaar.maxBuyIgnoreCash) {
						const price = mobile
							? parseInt(findElement("[class*='price_']", parent).childNodes[0].textContent.replaceAll(/[,$]/g, ""))
							: parseInt(findElement("[class*='price_']", parent).textContent.replaceAll(/[,$]/g, ""));
						const money = parseInt(findElement("#user-money").dataset.money);
						if (Math.floor(money / price) < max) max = Math.floor(money / price);
					}
					if (max > 10000) max = 10000;

					findElement<HTMLInputElement>("[class*='buyAmountInput_']", parent).value = max.toString();
					findElement("[class*='buyAmountInput_']", parent).dispatchEvent(new Event("input", { bubbles: true }));
				},
			},
		});

		const buyButton = findElement("[class*='buy_']", parent);
		buyButton.classList.add(styles.ttBuyBazaar);
		buyButton.parentElement.appendChild(fillMax);
	}
}

export default class BazaarFillMaxFeature extends Feature {
	constructor() {
		super("Bazaar Fill Max", "bazaar");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.bazaar.fillMax;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await addFillMax();
	}

	override storageKeys() {
		return ["settings.pages.bazaar.fillMax"];
	}
}
