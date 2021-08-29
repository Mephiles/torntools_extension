"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Fill Max",
		"shops",
		() => settings.pages.shops.fillMax,
		null,
		addFillMax,
		removeFillMax,
		{
			storage: ["settings.pages.shops.fillMax"],
		},
		null
	);

	async function addFillMax() {
		await requireElement(".item-desc");
		document.findAll(".item-desc").forEach((item) => {
			item.classList.add("tt-buy");
			const fillMax = document.newElement({ type: "span", text: "fill max", class: "tt-max-buy" });
			const buyButton = item.find(".buy-act-wrap .buy-act button");
			buyButton.appendChild(document.newElement("br"));
			buyButton.appendChild(fillMax);

			fillMax.addEventListener("click", (event) => {
				event.stopPropagation();

				let max = item.find(".instock").textContent.getNumber();
				if (!settings.pages.shops.maxBuyIgnoreCash) {
					const price = item.find(".price").firstChild.textContent.getNumber();
					const money = document.find("#user-money").dataset.money.getNumber();

					if (Math.floor(money / price) < max) max = Math.floor(money / price);
				}
				if (max > 100) max = 100;

				item.find("input").value = max;
			});
		});
	}

	function removeFillMax() {
		document.findAll(".tt-buy").forEach((ttBuy) => {
			ttBuy.classList.remove("tt-buy");
			ttBuy.find(".tt-max-buy").remove();
		});
	}
})();
