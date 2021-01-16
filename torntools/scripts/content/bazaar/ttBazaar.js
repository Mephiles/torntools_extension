requireDatabase().then(() => {
	bazaarLoaded().then(() => {
		console.log("TT - Bazaar");

		if (visiting()) {
			console.log("visiting");

			// Bazaar worth
			if (settings.pages.bazaar.worth) {
				let bazaar_user_id = getSearchParameters().get("userId");
				fetchApi_v2("torn", { section: "user", objectid: bazaar_user_id, selections: "bazaar" })
					.then((result) => {
						let total = 0;

						for (let item in result.bazaar) {
							total += result.bazaar[item].market_price * result.bazaar[item].quantity;
						}

						let div = doc.new({ type: "div", class: "tt-bazaar-text", text: `This bazaar is worth ` });
						let span = doc.new({ type: "span", class: "tt-money", text: `$${numberWithCommas(total, false)}` });

						div.appendChild(span);
						doc.find(".info-msg-cont .msg").appendChild(div);
					})
					.catch((err) => {
						console.log("ERROR", err);
					});
			}

			// Highlight item
			let params = getSearchParameters();
			if (params.has("tt_itemid") && !mobile) {
				let item_id = params.get("tt_itemid");
				let item_price = params.get("tt_itemprice");
				let item_name = itemlist.items[item_id].name;

				let found_item = false;
				for (let item of doc.findAll("[class*='item_']")) {
					if (
						item.find("[class*='name_']").innerText.trim() === item_name &&
						item.find("[class*='price_']").innerText.replace("$", "").replace(/,/g, "") === item_price
					) {
						found_item = true;

						item.style.backgroundColor = "rgba(177, 206, 130, 0.5)";
						flashColor(item, "background", "slow", 0.2, 1);
						break;
					}
				}

				if (!found_item) {
					let div = doc.new({ type: "div", class: "tt-bazaar-text bold", text: `[${item_name}] ` });
					let span = doc.new({ type: "span", class: "not-bold", text: `Could not find item. Please try using the Search function.` });

					div.appendChild(span);
					doc.find(".info-msg-cont .msg").appendChild(div);
				}
			}

			// Max buy button
			document.addEventListener("click", (event) => {
				if (event.target.classList.contains("[class*='controlPanelButton_']") && event.target.getAttribute("aria-label").indexOf("Buy") > -1) {
					let parent = doc.find("[class*='buyMenu_']").parentElement;

					let max_span = doc.new({ type: "span", text: "fill max", class: "tt-max-buy bold" });
					parent.find("[class*='buy_']").parentElement.appendChild(max_span);

					max_span.addEventListener("click", (event) => {
						event.stopPropagation();
						let max = parent.find("[class*='buyAmountInput_']").max;

						if (!settings.pages.bazaar.max_buy_ignore_cash) {
							let price = parseInt(parent.find("[class*='price_']").innerText.replaceAll(",", "").replace("$", ""));
							let user_money = parseInt(doc.find("#user-money").innerText.replaceAll(",", "").replace("$", ""));

							if (Math.floor(user_money / price) < max) max = Math.floor(user_money / price);
						}
						if (max > 10000) max = 10000;

						parent.find("[class*='buyAmountInput_']").value = max;

						// for value to be accepted
						parent.find("[class*='buyAmountInput_']").dispatchEvent(new Event("input", { bubbles: true }));
					});
				}
			});
		}
	});
});

function bazaarLoaded() {
	return requireElement("[class*='item_']");
}

function visiting() {
	return window.location.search.indexOf("userId") > -1;
}
