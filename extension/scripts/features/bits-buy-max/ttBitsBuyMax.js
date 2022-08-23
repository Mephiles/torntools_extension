"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Bits Buy Max",
		"shops",
		() => settings.pages.shops.bitsBuyMax,
		null,
		addBitsBuyMax,
		removeBitsBuyMax,
		{
			storage: ["settings.pages.shops.bitsBuyMax"],
		},
		null
	);

	async function addBitsBuyMax() {
		await requireElement(".item-desc");

        document.findAll(".item-desc").forEach((item) => {

            item.classList.add("tt-buy");



			let buyActDesc = item.find('.desc');
			let buyActWrap = item.find('.buy-act-wrap');
			let buyActWrapBuyAct = buyActWrap.find('.buy-act');
            const amountInput = item.find("input");


			// We want to make the right side a little wider and the left side narrower.
			buyActDesc.style.width = '130px';
			buyActWrap.style.width = '90px';
			buyActWrapBuyAct.style.float = 'right';
			buyActWrapBuyAct.style.height = '36px';
			buyActWrapBuyAct.style.width = '42px';

			const fillMaxButton = document.newElement({ type: "button", text: "buy max", class: "tt-max-buy" });
			fillMaxButton.addEventListener("click", bitsBuyMax);
			buyActWrap.appendChild(document.newElement("hr"));
			buyActWrap.appendChild(fillMaxButton);

            function bitsBuyMax(event) {
				event.stopPropagation();

                let max = item.find(".instock").textContent.getNumber();
				if (!settings.pages.shops.bitsMaxBuyIgnoreCash) {
					const price = item.find(".price").firstChild.textContent.getNumber();
					const money = document.find("#user-money").dataset.money.getNumber();

					if (Math.floor(money / price) < max) max = Math.floor(money / price);
				}
				if (max > 100) max = 100;

				amountInput.value = max;

                const bitsBuyMaxBuyButton = item.find(".buy-act button");
                bitsBuyMaxBuyButton.click();

                if (settings.pages.shops.bitsBuyMaxAutoConfirm) {
                    document.findAll(".confirm-act a.yes").forEach((confirmButton) => {
                        if (confirmButton.getAttribute('data-id') == amountInput.id) {
                            confirmButton.click();
                        }
                    });
                }
            }

		});
	}

	function removeBitsBuyMax() {
		document.findAll(".tt-bits-buy-max").forEach((ttBuy) => {
			ttBuy.classList.remove("tt-bits-buy-max");
			ttBuy.find(".tt-bits-buy-max").remove();
			ttBuy.find(".tt-bits-buy-max-overlay").remove();
		});
	}
})();
