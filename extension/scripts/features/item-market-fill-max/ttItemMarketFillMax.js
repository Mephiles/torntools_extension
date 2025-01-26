"use strict";

(async () => {
	const { mobile, tablet } = await checkDevice();

	const feature = featureManager.registerFeature(
		"Item Market Fill Max",
		"item market",
		() => settings.pages.itemmarket.fillMax,
		addListener,
		addButton,
		removeButton,
		{ storage: ["settings.pages.itemmarket.fillMax"] },
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function addListener() {
		document.addEventListener("click", (event) => {
			if (!event.target.matches("[class*='rowWrapper__'] [class*='available__']")) return;

			if (!feature.enabled()) return;

			const listing = event.target.closest("li");
			// The purchase amount input is not visible in mobiles and tablets until
			// the Buy icon is clicked. Hence exit early.
			if ((mobile || tablet) && !listing.children[0].matches("[class*='sellerRow__'][class*='expanded__']")) return;

			const quantityAvailable = listing.find("[class*='available__']").textContent.getNumber();
			const moneyOnHand = document.find("#user-money").dataset.money.getNumber();
			const itemPrice = listing.find("[class*='price__']").textContent.getNumber();
			const purchasableQuantity = Math.min(quantityAvailable, Math.floor(moneyOnHand / itemPrice));

			const quantityInput = listing.find(".input-money-group input:not([type])");
			updateReactInput(quantityInput, purchasableQuantity);
		});
	}

	async function addButton() {
		const itemMarketRoot = await requireElement("#item-market-root");

		itemMarketRoot.classList.add("tt-show-fill-max");
	}

	function removeButton() {
		document.findAll(".tt-show-fill-max").forEach((x) => x.classList.remove("tt-show-fill-max"));
	}
})();
