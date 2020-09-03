console.log("TT - Trade");

let activeTrade = false;

requireDatabase(true).then(() => {
	addXHRListener(({ detail: { page, xhr } }) => {
		if (page !== "trade") return;

		const params = new URLSearchParams(xhr.requestBody);
		activeTrade = isActiveTrade(params);

		tradeLoaded().then(() => {
			if (settings.pages.trade.item_values || settings.pages.trade.total_value) showValues();

			if (activeTrade) {
				showChatButton();
			}
		});
	})

	activeTrade = isActiveTrade();

	tradeLoaded().then(() => {
		if (settings.pages.trade.item_values || settings.pages.trade.total_value) showValues();

		if (activeTrade) {
			showChatButton();
		}
	});
});

function isActiveTrade(params = getHashParameters()) {
	let step = params.get("step");

	return step === "view" || step === "initiateTrade"
}

function tradeLoaded() {
	return requireElement(".user.left, .user.right");
}

function showValues() {
	console.log("Trade view!");

	// Show values of adds
	let logs = doc.findAll(".log li div");
	for (let log of logs) {
		let text = log.innerText;
		let total_value = 0;

		if (text.includes("added")) {
			if (text.includes("$")) {
				total_value = parseInt(text.match(/\$([0-9,]*)/i)[1].replaceAll(",", ""));
			} else {
				text = text.replace(" added", "").replace(" to the trade", "").replace(log.find("a").innerText + " ", "");
				let items = text.split(",");

				for (let item of items) {
					let name = item.split(" x")[0].trim();
					let quantity = parseInt(item.split(" x")[1]);

					for (let id in itemlist.items) {
						if (itemlist.items[id].name === name) {
							for (let i = 0; i < quantity; i++) {
								total_value += itemlist.items[id].market_value;
							}
						}
					}
				}
			}

			let value_span = doc.new("span");
			value_span.setClass("tt-add-value");
			value_span.innerText = `$${numberWithCommas(total_value, false)}`;

			log.appendChild(value_span);
		}
	}

	for (let side of [doc.find(".user.left"), doc.find(".user.right")]) {
		let totalValue = 0;

		let cashInTrade = side.find(".cont .color1 .desc > li .name");
		if (cashInTrade && cashInTrade.innerText !== "No money in trade") totalValue += parseInt(cashInTrade.innerText.match(/\$([0-9,]*)/i)[1].replaceAll(",", ""));

		for (let item of side.findAll(".cont .color2 .desc > li .name")) {
			const name = item.innerText.split(" x")[0].trim();
			const quantity = parseInt(item.innerText.split(" x")[1]) || 1;

			const items = findItemsInObject(itemlist.items, { name }, true);
			if (!items.length) continue;

			const worth = items[0].market_value * quantity;
			totalValue += worth;

			if (settings.pages.trade.item_values) {
				let span = doc.new({
					type: "span",
					class: "tt-side-item-value",
					text: `$${numberWithCommas(worth, false)}`
				});
				item.appendChild(span);
			}
		}

		if (totalValue !== 0 && settings.pages.trade.total_value) {
			let div = doc.new({ type: "div", class: "tt-side-value", text: "Total value: " });

			div.appendChild(doc.new({
				type: "span",
				text: `$${numberWithCommas(totalValue, false)}`,
			}));

			side.appendChild(div);
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
		let script = doc.new({
			type: "script",
			attributes: { type: "text/javascript" },
		});
		script.innerHTML = `chat.r(${id})`;

		doc.find("head").appendChild(script);
		setTimeout(() => script.remove(), 100);
	});

	doc.find("#trade-container > .title-black").appendChild(doc.new({
		type: "div",
		class: "item-value-option-wrap",
		children: [button],
	}));
}