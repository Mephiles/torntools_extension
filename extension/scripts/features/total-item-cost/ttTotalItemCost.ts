(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Total Item Cost",
		"bazaar",
		() => settings.pages.bazaar.itemsCost,
		initialiseListeners,
		addPrice,
		removePrice,
		{
			storage: ["settings.pages.bazaar.itemsCost"],
		},
		null
	);

	function initialiseListeners() {
		document.addEventListener("click", (event) => {
			const target = event.target as Element;
			if (target.classList.contains("^=controlPanelButton__") && target.ariaLabel.includes("Buy")) {
				if (feature.enabled()) addPrice();
			}
		});
	}

	function addPrice() {
		requireElement("[class*='buyMenu_'] [class*='price_']").then(() => {
			if (document.find("#tt-total-cost")) return;
			document.find("[class*='buyMenu_'] [class*='amount_']").insertAdjacentElement("beforeend", elementBuilder({ type: "span", id: "tt-total-cost" }));
			const inputElement = document.find<HTMLInputElement>("[class*='buyMenu_'] [class*='buyForm_'] input[class*='numberInput_']");
			changeTotalPrice(parseInt(inputElement.value));
			inputElement.addEventListener("input", (event) => changeTotalPrice(parseInt((event.target as HTMLInputElement).value)));
		});
	}

	function removePrice() {
		document.findAll("#tt-total-cost").forEach((x) => x.remove());
	}

	function changeTotalPrice(amount: number) {
		const stock = parseInt(document.find("[class*='buyMenu_'] [class*='amount_']").textContent.split(")")[0].replace(/\D+/g, ""));
		const price = parseInt(document.find("[class*='buyMenu_'] [class*='price_']").textContent.split("$")[1].replaceAll(",", ""));
		if (amount > stock) amount = stock;
		if (document.find("#tt-total-cost")) document.find("#tt-total-cost").innerHTML = "$" + formatNumber(price * amount);
	}
})();
