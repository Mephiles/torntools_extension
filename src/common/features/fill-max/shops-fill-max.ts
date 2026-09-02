import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./fill-max.module.css";

async function addFillMax() {
	await requireElement(".item-desc");

	findAllElements(".item-desc").forEach((item) => {
		item.classList.add(styles.ttBuyShops);

		const fillMaxButton = elementBuilder({ type: "span", text: "fill max", class: [styles.ttMaxBuy, styles.ttMaxBuyShops] });
		fillMaxButton.addEventListener("click", fillMax);

		const buyButton = findElement(".buy-act-wrap .buy-act button", item);
		buyButton.appendChild(elementBuilder("br"));
		buyButton.appendChild(fillMaxButton);

		const fillMaxOverlay = elementBuilder({ type: "div", class: styles.ttMaxBuyOverlayShops });
		fillMaxOverlay.addEventListener("click", fillMax);

		findElement(".buy-act", item).appendChild(fillMaxOverlay);

		function fillMax(event: MouseEvent) {
			event.stopPropagation();

			let max = convertToNumber(findElement(".instock", item).textContent);
			if (!settings.pages.shops.maxBuyIgnoreCash) {
				const price = convertToNumber(findElement(".price", item).firstChild.textContent);
				const money = convertToNumber(findElement("#user-money").dataset.money);

				if (Math.floor(money / price) < max) max = Math.floor(money / price);
			}
			if (max > 100) max = 100;

			findElement<HTMLInputElement>("input[id]", item).value = max.toString();
		}
	});
}

export default class ShopsFillMaxFeature extends Feature {
	constructor() {
		super("Shops Fill Max", "shops");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.shops.fillMax;
	}

	override async execute() {
		await addFillMax();
	}

	override storageKeys() {
		return ["settings.pages.shops.fillMax"];
	}
}
