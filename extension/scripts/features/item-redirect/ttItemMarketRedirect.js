"use strict";

(async () => {
	if (!getPageStatus().access) return;

	if ((await checkDevice()).mobile) return "Not supported on mobile!";

	featureManager.registerFeature(
		"Item Redirect",
		"market",
		() => settings.pages.bazaar.redirects,
		null,
		addParams,
		removeParams,
		{
			storage: ["settings.pages.bazaar.redirects"],
		},
		null,
	);

	async function addParams() {
		const subPage = getHashParameters().get("p") === "shop" ? "itemView" : "browseView";
		if (subPage === "itemView") {
			await requireElement("ul.guns-list > li:not(.clear)");
			for (const bazaarLink of document.findAll("ul.guns-list > li:not(.clear)")) {
				const price = bazaarLink.find(".price").firstChild.textContent.replace(/[\n$, ]/g, "");
				const itemId = bazaarLink.find("img").src.match(/(?<=\/)\d+(?=\/)/g)[0];

				let url = bazaarLink.find("a").href.replace("userID", "userId");
				url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

				bazaarLink.find("a").href = url;
			}
		} else if (subPage === "browseView") {
			document.addEventListener("click", addTTParams);
			document.addEventListener("contextmenu", addTTParams);
		}

		function addTTParams(event) {
			if (event.target.classList && event.target.classList.contains("bazaar-market-icon")) {
				let url = event.target.parentElement.getAttribute("href");
				if (url.includes("tt_itemprice=") && url.includes("tt_itemid=")) return;
				const price = event.target
					.closest(".item")
					.find(".cost-price")
					.textContent.replace(/[$, ]|\(\d+\)/g, "");
				const itemId = document.find(".wai-hover").getAttribute("itemid");
				url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;
				event.target.parentElement.href = url;
			}
		}
	}

	function removeParams() {
		document.findAll("[href*='&tt_itemid=']").forEach((x) => (x.href = x.href.split("&tt_itemid=")[0]));
	}
})();
