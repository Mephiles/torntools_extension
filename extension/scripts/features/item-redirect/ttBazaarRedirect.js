"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Item Redirect",
		"bazaar",
		() => settings.pages.bazaar.redirects,
		null,
		addHighlight,
		removeHighlight,
		{
			storage: ["settings.pages.bazaar.redirects"],
		},
		null
	);

	async function addHighlight() {
		await requireElement("[class*='rowItems_'] [class*='item_']");
		const params = getSearchParameters();
		if (params.has("tt_itemid")) {
			const itemID = params.get("tt_itemid");
			const itemPrice = params.get("tt_itemprice");
			const itemName = torndata.items[itemID].name;

			let foundItem = false;
			for (const item of document.findAll("[class*='rowItems_'] [class*='item_']")) {
				if (
					item.find("[class*='name_']").textContent.trim() === itemName &&
					item.find("[class*='price_']").lastChild.textContent.replace(/[\n$, ]/g, "") === itemPrice
				) {
					foundItem = true;
					item.classList.add("tt-flash");
					if (settings.pages.bazaar.redirectsScroll) item.scrollIntoView({ behavior: "smooth" });
					break;
				}
			}

			const hasAutofill = params.has("tt_autofill");
			const isAutofill = params.get("tt_autofill") !== "false";

			if (!foundItem && (!hasAutofill || isAutofill)) {
				const searchInput = document.find("#bazaarRoot [class*='search___'] input");
				updateReactInput(searchInput, itemName);
				const devices = await checkDevice();
				if (devices.mobile || devices.tablet) {
					searchInput.setAttribute("title", "Autofilled by TornTools");
					searchInput.dispatchEvent(new Event("focus"));
					setTimeout(() => {
						searchInput.dispatchEvent(new Event("blur"));
						searchInput.removeAttribute("title");
					}, 2000);
				}
			}

			if (!hasAutofill) updateQuery("tt_autofill", false);
		}
	}

	function removeHighlight() {
		if (document.find(".tt-bazaar-redirect")) document.find(".tt-bazaar-redirect").remove();
		document.findAll(".tt-flash").forEach((x) => x.classList.remove("tt-flash"));
	}
})();
