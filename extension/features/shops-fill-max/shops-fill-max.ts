import styles from "./shops-fill-max.module.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";

const CLASS_TT_BUY = styles.ttBuy;
const CLASS_TT_MAX_BUY = styles.ttMaxBuy;
const CLASS_TT_MAX_BUY_OVERLAY = styles.ttMaxBuyOverlay;

async function addFillMax() {
	await requireElement(".item-desc");

	findAllElements(".item-desc").forEach((item) => {
		item.classList.add("tt-buy");

		const fillMaxButton = elementBuilder({ type: "span", text: "fill max", class: "tt-max-buy" });
		fillMaxButton.addEventListener("click", fillMax);

		const buyButton = item.querySelector(".buy-act-wrap .buy-act button");
		buyButton.appendChild(elementBuilder("br"));
		buyButton.appendChild(fillMaxButton);

		const fillMaxOverlay = elementBuilder({ type: "div", class: "tt-max-buy-overlay" });
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
	findAllElements(".tt-buy").forEach((ttBuy) => {
		ttBuy.classList.remove("tt-buy");
		ttBuy.querySelector(".tt-max-buy").remove();
		ttBuy.querySelector(".tt-max-buy-overlay").remove();
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
