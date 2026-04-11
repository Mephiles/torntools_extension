import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import styles from "./fill-max.module.css";

async function addFillMax() {
	await requireElement(".item-desc");

	findAllElements(".item-desc").forEach((item) => {
		item.classList.add(styles.ttBuyShops);

		const fillMaxButton = elementBuilder({ type: "span", text: "fill max", class: [styles.ttMaxBuy, styles.ttMaxBuyShops] });
		fillMaxButton.addEventListener("click", fillMax);

		const buyButton = item.querySelector(".buy-act-wrap .buy-act button");
		buyButton.appendChild(elementBuilder("br"));
		buyButton.appendChild(fillMaxButton);

		const fillMaxOverlay = elementBuilder({ type: "div", class: styles.ttMaxBuyOverlayShops });
		fillMaxOverlay.addEventListener("click", fillMax);

		item.querySelector(".buy-act").appendChild(fillMaxOverlay);

		function fillMax(event: MouseEvent) {
			event.stopPropagation();

			let max = convertToNumber(item.querySelector(".instock").textContent);
			if (!settings.pages.shops.maxBuyIgnoreCash) {
				const price = convertToNumber(item.querySelector(".price").firstChild.textContent);
				const money = convertToNumber(document.querySelector<HTMLElement>("#user-money").dataset.money);

				if (Math.floor(money / price) < max) max = Math.floor(money / price);
			}
			if (max > 100) max = 100;

			item.querySelector<HTMLInputElement>("input[id]").value = max.toString();
		}
	});
}

function removeFillMax() {
	findAllElements(styles.ttBuyShops).forEach((ttBuy) => {
		ttBuy.classList.remove(styles.ttBuyShops);
		ttBuy.querySelector(styles.ttMaxBuyShops).remove();
		ttBuy.querySelector(styles.ttMaxBuyOverlayShops).remove();
	});
}

export default class ShopsFillMaxFeature extends Feature {
	constructor() {
		super("Shops Fill Max", "shops");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.shops.fillMax;
	}

	async execute() {
		await addFillMax();
	}

	cleanup() {
		removeFillMax();
	}

	storageKeys() {
		return ["settings.pages.shops.fillMax"];
	}
}
