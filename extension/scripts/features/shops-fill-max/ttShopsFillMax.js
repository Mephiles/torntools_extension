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

			let buyActDesc = item.find('.desc');
			let buyActWrap = item.find('.buy-act-wrap');
			let buyActWrapBuyAct = buyActWrap.find('.buy-act');

			// We want to make the right side a little wider and the left side narrower.
			buyActDesc.style.width = '130px';
			buyActWrap.style.width = '90px';
			buyActWrapBuyAct.style.float = 'right';
			buyActWrapBuyAct.style.height = '36px';
			buyActWrapBuyAct.style.width = '42px';

			const fillMaxButton = document.newElement({ type: "button", text: "fill max", class: "tt-max-buy" });
			fillMaxButton.addEventListener("click", fillMax);
			buyActWrap.appendChild(document.newElement("hr"));
			buyActWrap.appendChild(fillMaxButton);

			function fillMax(event) {
				event.stopPropagation();

				let max = item.find(".instock").textContent.getNumber();
				if (!settings.pages.shops.maxBuyIgnoreCash) {
					const price = item.find(".price").firstChild.textContent.getNumber();
					const money = document.find("#user-money").dataset.money.getNumber();

					if (Math.floor(money / price) < max) max = Math.floor(money / price);
				}
				if (max > 100) max = 100;

				item.find("input").value = max;
			}
		});
	}

	function removeFillMax() {
		document.findAll(".tt-buy").forEach((ttBuy) => {
			ttBuy.classList.remove("tt-buy");
			ttBuy.find(".tt-max-buy").remove();
		});
	}
})();
