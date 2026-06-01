import { Feature } from "@features/feature";
import { settings } from "@utils/data/database";
import { elementBuilder, findAllElements, mobile, tabletVertical } from "@utils/functions/dom";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus } from "@utils/functions/torn";
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

async function removeFillMax() {
	if (mobile || tabletVertical) {
		await requireElement("[class*='buyForm___']");
		findAllElements("[class*='buyForm___']").forEach((x) => {
			x.classList.remove("tt-fill-max");
			x.querySelector(styles.ttMaxBuyBazaar).remove();
		});
		reactObserver.disconnect();
	} else {
		document.removeEventListener("click", maxBuyListener);
		findAllElements(".tt-max-buy").forEach((x) => x.remove());
	}
}

async function maxBuyListener(clickEvent: any | null = null) {
	if (mobile || tabletVertical) {
		await requireElement(`${SELECTOR_MOBILE_LIST} [class*='buyForm___']`);
		findAllElements(`${SELECTOR_MOBILE_LIST} [class*='itemDescription__']:not(.tt-fill-max)`).forEach((buyForm) => {
			buyForm.classList.add("tt-fill-max");
			addButtonAndListener(buyForm);
		});
	} else {
		if (!clickEvent?.target.closest("[class*='controlPanelButton___']")) return;
		requireElement("[class*='buyMenu__']").then(() => addButtonAndListener(document.querySelector("[class*='buyMenu__']")));
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
						? parseInt(parent.querySelector("[class*='amount__']").firstElementChild.textContent)
						: parseInt(parent.querySelector("[class*='amount__']").childNodes[1].textContent);
					if (!settings.pages.bazaar.maxBuyIgnoreCash) {
						const price = mobile
							? parseInt(parent.querySelector("[class*='price_']").childNodes[0].textContent.replace(/[,$]/g, ""))
							: parseInt(parent.querySelector("[class*='price_']").textContent.replace(/[,$]/g, ""));
						const money = parseInt(document.querySelector<HTMLElement>("#user-money").dataset.money);
						if (Math.floor(money / price) < max) max = Math.floor(money / price);
					}
					if (max > 10000) max = 10000;

					parent.querySelector<HTMLInputElement>("[class*='buyAmountInput_']").value = max.toString();
					parent.querySelector("[class*='buyAmountInput_']").dispatchEvent(new Event("input", { bubbles: true }));
				},
			},
		});

		const buyButton = parent.querySelector("[class*='buy_']");
		buyButton.classList.add(styles.ttBuyBazaar);
		buyButton.parentElement.appendChild(fillMax);
	}
}

export default class BazaarFillMaxFeature extends Feature {
	constructor() {
		super("Bazaar Fill Max", "bazaar");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.bazaar.fillMax;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addFillMax();
	}

	async cleanup() {
		await removeFillMax();
	}

	storageKeys() {
		return ["settings.pages.bazaar.fillMax"];
	}
}
