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

				let max = parseInt(item.find(".instock").textContent.replace(/,/g, ""));
				if (!settings.pages.shops.maxBuyIgnoreCash) {
					const price = parseInt(item.find(".price").textContent.replace(/[$,]/g, ""));
					const money = parseInt(document.find("#user-money").dataset.money);

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
