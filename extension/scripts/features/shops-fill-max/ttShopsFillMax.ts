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
})();
