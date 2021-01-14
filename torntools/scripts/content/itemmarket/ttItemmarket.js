requireDatabase().then(() => {
	addXHRListener((event) => {
		const { page, uri, xhr, json } = event.detail;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");

		if (page === "imarket" && step === "getItems") {
			highlightCheapItems(json);
		}
	});

	itemmarketLoaded().then(() => {
		console.log("TT - Item Market");

		if (subview() === "item_view") {
			for (let el of doc.findAll("ul.guns-list > li:not(.clear)")) {
				let url = el.find("a").getAttribute("href").replace("userID", "userId");

				const price = el.find(".price").innerText.split(" (")[0].replace("$", "").replace(/,/g, "");
				const itemId = el.find("img").getAttribute("src").split("items/")[1].split("/")[0];

				url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

				el.find("a").setAttribute("href", url);
			}
		} else if (subview() === "browse_view") {
			doc.addEventListener("click", (event) => {
				if (event.target.classList && event.target.classList.contains("bazaar-market-icon")) {
					let url = event.target.parentElement.getAttribute("href");

					let price = findParent(event.target, { class: "item" }).find(".cost-price").innerText.replace("$", "").replace(/,/g, "");
					let itemId = doc.find(".wai-hover").getAttribute("itemid");

					url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

					event.target.parentElement.setAttribute("href", url);
				}
			});
			highlightCheapItems();
		}

		if (settings.scripts.no_confirm.global && settings.scripts.no_confirm.item_market) {
			for (let list of doc.findAll(".m-items-list")) {
				new MutationObserver(() => removeConfirmButtons(list)).observe(list, { childList: true, subtree: true });
			}

			if (subview() === "item_view") requireElement(".buy .buy-link").then(() => removeConfirmButtons());

			new MutationObserver(() => {
				requireElement(".buy .buy-link:not(.tt-modified)").then(() => removeConfirmButtons());
			}).observe(doc.find("#item-market-main-wrap"), { childList: true });
		}
	});
});

function itemmarketLoaded() {
	return requireElement("#item-market-main-wrap .info-msg .msg .ajax-placeholder", { invert: true });
}

function subview() {
	if (getHashParameters().get("p") === "shop") {
		return "item_view";
	} else {
		return "browse_view";
	}
}

function removeConfirmButtons(source = doc) {
	const items = source.findAll(".items > li");
	if (!items || !items.length) return;

	let view = subview();

	for (let item of items) {
		if (item.classList && (item.classList.contains("clear") || item.classList.contains("private-bazaar"))) continue;

		const icon = item.find(".buy .buy-link");

		icon.setAttribute("data-action", "buyItemConfirm");
		icon.classList.add("yes-buy", "tt-modified");

		if (view === "item_view") {
			icon.setAttribute("data-price", item.find(".cost").innerText.split(": ").pop().substring(1).replaceAll(",", ""));
		}
	}
}

function highlightCheapItems(items) {
	if (settings.pages.itemmarket.market_value === undefined || settings.pages.itemmarket.market_value === "") return;

	const percentage = 1 - settings.pages.itemmarket.market_value / 100;
	if (items) {
		for (let marketItem of items) {
			if (parseInt(marketItem.price) < itemlist.items[marketItem.itemID].market_value * percentage) {
				requireElement(`.market-tabs-wrap li[data-item="${marketItem.itemID}"]`).then(() => {
					doc.find(`.market-tabs-wrap li[data-item="${marketItem.itemID}"] > .title`).setAttribute("color", "green");
				});
			}
		}
	} else {
		requireElement(".market-tabs-wrap > div[aria-expanded='true'] > .m-items-list > li").then(() => {
			for (let marketItem of doc.findAll(".market-tabs-wrap > div[aria-expanded='true'] > .m-items-list > li:not(.clear)")) {
				const id = marketItem.getAttribute("data-item");
				const price = parseInt(marketItem.find(".m-item-wrap").getAttribute("aria-label").split(": $")[1].replaceAll(",", ""));

				if (price < itemlist.items[id].market_value * percentage) {
					doc.find(`.market-tabs-wrap li[data-item="${id}"] > .title`).setAttribute("color", "green");
				}
			}
		});
	}
}
