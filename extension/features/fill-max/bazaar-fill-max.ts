import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, mobile } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import styles from "./fill-max.module.css";

let reactObserver: MutationObserver | undefined;

function initialiseListeners() {
	if (!mobile) return;

	reactObserver = new MutationObserver(() => maxBuyListener(""));
}

async function addFillMax() {
	if (!mobile) document.addEventListener("click", maxBuyListener);
	else {
		await maxBuyListener();
		reactObserver.observe(await requireElement(".ReactVirtualized__Grid__innerScrollContainer"), { childList: true });
	}
}

async function removeFillMax() {
	if (!mobile) {
		document.removeEventListener("click", maxBuyListener);
		findAllElements(".tt-max-buy").forEach((x) => x.remove());
	} else {
		await requireElement("[class*='buyForm___']");
		findAllElements("[class*='buyForm___']").forEach((x) => {
			x.classList.remove("tt-fill-max");
			x.querySelector(styles.ttMaxBuyBazaar).remove();
		});
		reactObserver.disconnect();
	}
}

async function maxBuyListener(clickEvent: any | null = null) {
	if (!mobile) {
		if (!clickEvent?.target.closest("[class*='controlPanelButton___']")) return;
		requireElement("[class*='buyMenu__']").then(() => addButtonAndListener(document.querySelector("[class*='buyMenu__']")));
	} else {
		await requireElement(".ReactVirtualized__Grid__innerScrollContainer [class*='buyForm___']");
		findAllElements(".ReactVirtualized__Grid__innerScrollContainer [class*='itemDescription__']:not(.tt-fill-max)").forEach((buyForm) => {
			buyForm.classList.add("tt-fill-max");
			addButtonAndListener(buyForm);
		});
	}

	function addButtonAndListener(parent: Element) {
		const fillMax = elementBuilder({ type: "span", text: "fill max", class: [styles.ttMaxBuy, styles.ttMaxBuyBazaar] });
		const buyButton = parent.querySelector("[class*='buy_']");
		buyButton.classList.add(styles.ttBuyBazaar);
		buyButton.parentElement.appendChild(fillMax);
		fillMax.addEventListener("click", (event) => {
			event.stopPropagation();
			let max = mobile
				? parseInt(parent.querySelector("[class*='amount__']").firstElementChild.textContent)
				: parseInt(parent.querySelector("[class*='amount__']").childNodes[1].textContent);
			if (!settings.pages.bazaar.maxBuyIgnoreCash) {
				const price = parseInt(parent.querySelector("[class*='price_']").textContent.replace(/[,$]/g, ""));
				const money = parseInt(document.querySelector<HTMLElement>("#user-money").dataset.money);
				if (Math.floor(money / price) < max) max = Math.floor(money / price);
			}
			if (max > 10000) max = 10000;

			parent.querySelector<HTMLInputElement>("[class*='buyAmountInput_']").value = max.toString();
			parent.querySelector("[class*='buyAmountInput_']").dispatchEvent(new Event("input", { bubbles: true }));
		});
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
