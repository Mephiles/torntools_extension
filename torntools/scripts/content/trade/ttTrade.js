console.log("TT - Trade");

let activeTrade = false;

requireDatabase(true).then(() => {
	addXHRListener(({ detail: { page, xhr } }) => {
		if (page !== "trade") return;

		const params = new URLSearchParams(xhr.requestBody);
		activeTrade = isActiveTrade(params);

		tradeLoaded().then(handleTrade);
	});

	activeTrade = isActiveTrade();

	tradeLoaded().then(handleTrade);
});

function handleTrade() {
	if (settings.pages.trade.item_values || settings.pages.trade.total_value) showValues();

	if (activeTrade) {
		showChatButton();

		if (settings.scripts.no_confirm.global && settings.scripts.no_confirm.trades) removeConfirmation();
	}
}

function isActiveTrade(params = getHashParameters()) {
	let step = params.get("step");

	return step === "view" || step === "initiateTrade" || step === "accept";
}

function tradeLoaded() {
	return requireElement(".user.left, .user.right");
}

function showValues() {
	console.log("Trade view!");

	// Show values of adds
	for (let log of doc.findAll(".log li div:not(.tt-modified)")) {
		log.classList.add("tt-modified");
		let text = log.innerText;
		let totalValue = 0;

		if (text.includes("added")) {
			if (text.includes("$")) {
				totalValue = parseInt(text.match(/\$([0-9,]*)/i)[1].replaceAll(",", ""));
			} else if (text.includes("shares")) {
				const match = text.match(/added ([0-9,]*)x ([a-zA-Z]*) shares to the trade/i);

				const amount = parseInt(match[1].replaceAll(",", ""));
				const stock = findItemsInObject(torndata.stocks, { acronym: match[2] }, true)[0];

				totalValue = stock.current_price * amount;
			} else {
				text = text
					.replace(" added", "")
					.replace(" to the trade", "")
					.replace(log.find("a").innerText + " ", "");
				let items = text.split(",");

				for (let item of items) {
					let name = item.split(" x")[0].trim();
					let quantity = parseInt(item.split(" x")[1]);

					for (let id in itemlist.items) {
						if (itemlist.items[id].name === name) {
							for (let i = 0; i < quantity; i++) {
								totalValue += itemlist.items[id].market_value;
							}
						}
					}
				}
			}

			log.appendChild(doc.new({ type: "span", class: "tt-add-value", text: `$${numberWithCommas(totalValue, false)}` }));
		}
	}

	for (let side of doc.findAll(".user.left:not(.tt-modified), .user.right:not(.tt-modified)")) {
		side.classList.add("tt-modified");
		let totalValue = 0;

		let cashInTrade = side.find(".cont .color1 .desc > li .name");
		if (cashInTrade && cashInTrade.innerText !== "No money in trade")
			totalValue += parseInt(cashInTrade.innerText.match(/\$([0-9,]*)/i)[1].replaceAll(",", ""));

		for (let item of side.findAll(".cont .color2 .desc > li .name")) {
			if (item.innerText === "No items in trade") continue;

			const name = item.innerText.split(" x")[0].trim();
			const quantity = parseInt(item.innerText.split(" x")[1]) || 1;

			const items = findItemsInObject(itemlist.items, { name }, true);
			if (!items.length) continue;

			const worth = items[0].market_value * quantity;
			totalValue += worth;

			if (settings.pages.trade.item_values) {
				item.appendChild(doc.new({ type: "span", class: "tt-side-item-value", text: `$${numberWithCommas(worth, false)}` }));
			}
		}
		for (let addedStock of side.findAll(".cont .color4 .desc > li .name")) {
			if (addedStock.innerText === "No shares in trade") continue;

			const match = addedStock.innerText.match(/([a-zA-Z]*) x([0-9,]*) at \$([0-9,.]*)/i);

			const amount = parseInt(match[2].replaceAll(",", ""));
			const stock = findItemsInObject(torndata.stocks, { acronym: match[1] }, true)[0];
			const price = parseInt(match[3].replaceAll(",", ""));

			const worth = stock.current_price * amount;
			totalValue += worth;

			if (settings.pages.trade.item_values) {
				addedStock.appendChild(doc.new({ type: "span", class: "tt-side-item-value", text: `$${numberWithCommas(worth, false)}` }));
			}
		}

		if (totalValue !== 0 && settings.pages.trade.total_value) {
			side.appendChild(
				doc.new({
					type: "div",
					class: "tt-side-value",
					text: "Total value: ",
					children: [doc.new({ type: "span", text: `$${numberWithCommas(totalValue, false)}` })],
				})
			);
		}

		if (settings.pages.trade.item_values) {
			let wrap = doc.new({ type: "div", class: "item-value-option-wrap" });
			let checkbox = doc.new({ type: "input", attributes: { type: "checkbox" } });

			wrap.appendChild(doc.new({ type: "span", text: "Hide item values" }));
			wrap.appendChild(checkbox);

			side.find(".title-black").appendChild(wrap);

			checkbox.addEventListener("click", function () {
				let style = checkbox.checked ? "none" : "block";

				for (let item of side.findAll(".tt-side-item-value")) {
					item.style.display = style;
				}
			});
		}
	}
}

function showChatButton() {
	let id;

	for (let link of doc.findAll("#trade-container .log > li .desc a")) {
		let match = link.getAttribute("href").match(/XID=([0-9]*)/i);
		if (!match || parseInt(match[1]) === userdata.player_id) continue;

		id = parseInt(match[1]);
		break;
	}
	if (!id) return;

	let button = doc.new({
		type: "span",
		text: "Open Chat",
		class: "tt-clickable",
	});

	button.addEventListener("click", () => {
		if (window.wrappedJSObject) {
			window.wrappedJSObject.chat.r(id);
		} else {
			let script = doc.new({
				type: "script",
				attributes: { type: "text/javascript" },
				html: `chat.r(${id})`,
			});

			doc.find("head").appendChild(script);
			setTimeout(() => script.remove(), 100);
		}
	});

	doc.find("#trade-container > .title-black").appendChild(
		doc.new({
			type: "div",
			class: "item-value-option-wrap",
			children: [button],
		})
	);
}

function removeConfirmation() {
	const link = doc.find(".trade-cancel a.btn.accept");
	if (!link) return;

	let url = link.getAttribute("href");

	if (url.includes("accept") && !url.includes("accept2")) {
		link.setAttribute("href", url.replace("accept", "accept2"));
	}
}
