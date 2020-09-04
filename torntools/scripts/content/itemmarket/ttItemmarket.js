requireDatabase().then(() => {
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
			doc.addEventListener("click", event => {
				if (event.target.classList && event.target.classList.contains("bazaar-market-icon")) {
					let url = event.target.parentElement.getAttribute("href");

					let price = findParent(event.target, { class: "item" }).find(".cost-price").innerText.replace("$", "").replace(/,/g, "");
					let itemId = doc.find(".wai-hover").getAttribute("itemid");

					url += `&tt_itemid=${itemId}&tt_itemprice=${price}`;

					event.target.parentElement.setAttribute("href", url);
				}
			});
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
	return requireElement("#item-market-main-wrap .info-msg .msg .ajax-placeholder", true);
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