requireDatabase().then(function () {
	itemmarketLoaded().then(function () {
		console.log("TT - Item Market");

		if (subview() === "item_view") {
			for (let el of doc.findAll("ul.guns-list>li:not(.clear)")) {
				let url = el.find("a").getAttribute("href").replace("userID", "userId");

				const price = el.find(".price").innerText.split(" (")[0].replace("$", "").replace(/,/g, "");
				const itemId = el.find("img").getAttribute("src").split("items/")[1].split("/")[0];

				url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

				el.find("a").setAttribute("href", url);
			}
		} else if (subview() === "browse_view") {
			doc.addEventListener("click", function (event) {
				if (event.target.classList && event.target.classList.contains("bazaar-market-icon")) {
					let url = event.target.parentElement.getAttribute("href");

					let price = findParent(event.target, { class: "item" }).find(".cost-price").innerText.replace("$", "").replace(/,/g, "");
					let itemId = doc.find(".wai-hover").getAttribute("itemid");

					url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

					event.target.parentElement.setAttribute("href", url);
				}
			});
		}
	});
});

function itemmarketLoaded() {
	return requireElement("#item-market-main-wrap .info-msg .msg .ajax-placeholder", true);
}

function subview() {
	if (window.location.hash.indexOf("searchname=") > -1) {
		return "item_view";
	} else {
		return "browse_view";
	}
}