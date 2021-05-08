"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Total Item Cost",
		"items",
		() => settings.pages.bazaar.itemsCost,
		initialiseListeners,
		addPrice,
		removePrice,
		{
			storage: ["settings.pages.bazaar.itemsCost"],
		},
		null,
	);

	function initialiseListeners() {
		document.addEventListener("click", (event) => {
			const target = event.target;
			if (target.classList.contains("^=controlPanelButton__") && target.ariaLabel.includes("Buy")) {
				if (feature.enabled()) addPrice();
				else removePrice();
			}
		});
	}

	function addPrice() {
		requireElement("[class*='buyMenu_'] [class*='price_']").then(() => {
			if (document.find("#tt-total-cost")) return;
			const bazaarItemPrice = parseInt(document.find("[class*='buyMenu_'] [class*='price_']").innerText.split("$")[1].replaceAll(",", ""));
			document.find("[class*='buyMenu_'] [class*='amount_']").insertAdjacentElement("beforeend", document.newElement({type: "span", id: "tt-total-cost"}));
			document.find("[class*='buyMenu_'] [class*='buyForm_'] input[class*='numberInput_']").addEventListener(
				"keyup",
				(event) => {
					if (document.find("#tt-total-cost")) document.find("#tt-total-cost").innerHTML = "$" + formatNumber(bazaarItemPrice * event.target.value)
				},
			);
		});
	}

	function removePrice() {
		document.findAll("#tt-total-cost").forEach(x => x.remove());
	}
})();
