"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Trade Values",
		"trade",
		() => settings.pages.trade.itemValues,
		initialiseListeners,
		addItemValues,
		removeItemValues,
		{
			storage: ["settings.pages.trade.itemValues"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(({ step }) => {
			if (!feature.enabled()) return;
			if (!["logview", "initiateTrade", "accept", "start"].includes(step)) return;

			addItemValues();
		});
	}

	async function addItemValues() {
		document.body.classList.add("tt-trade-values");
		await requireElement(".cont .color1 .desc > li .name");
		const localMappings = {};

		for (const log of document.findAll(".log li .msg:not(.tt-modified)")) {
			log.classList.add("tt-modified");
			const text = log.textContent;
			let totalValue = 0;

			if (!text.includes("says:") && text.includes("added")) {
				if (text.includes("$")) {
					totalValue = parseInt(text.match(/\$([\d,]*)/i)[1].replace(/,/g, ""));
				} else {
					const itemEntries = text
						.replace(" added", "")
						.replace(" to the trade", "")
						.split(",")
						.map((x) => x.trim());
					const quantityMap = {};
					for (const entry of itemEntries) {
						const nameRegex = entry.match(/(?<=x ).*/);
						const quantityRegex = entry.match(/\d+(?=x)/g);
						if (!nameRegex || !quantityRegex) {
							console.log("TT - (Trade Values) Ignoring item because it doesn't match anything.", entry);
							continue;
						}

						const name = nameRegex[0].replace(/\.$/, "");
						quantityMap[name] = parseInt(quantityRegex[0]);
					}

					for (const itemId in torndata.items) {
						if (quantityMap.hasOwnProperty(torndata.items[itemId].name)) {
							localMappings[torndata.items[itemId].name] = itemId;
							totalValue += quantityMap[torndata.items[itemId].name] * torndata.items[itemId].market_value;
						}
					}
				}
				log.appendChild(document.newElement({ type: "span", class: "tt-log-value", text: formatNumber(totalValue, { currency: true }) }));
			}
		}

		for (const side of document.findAll(".user.left:not(.tt-modified), .user.right:not(.tt-modified)")) {
			side.classList.add("tt-modified");
			let totalValue = 0;

			const cashInTrade = side.find(".cont .color1 .desc > li .name");
			if (cashInTrade && cashInTrade.textContent.trim() !== "No money in trade")
				totalValue += parseInt(cashInTrade.textContent.match(/\$([\d,]*)/i)[1].replaceAll(",", ""));

			for (const item of side.findAll(".cont .color2 .desc > li .name")) {
				if (item.textContent === "No items in trade") continue;

				const name = item.textContent.split(" x")[0].trim();
				const quantity = parseInt(item.textContent.split(" x")[1]) || 1;

				let marketValue = 0;
				if (localMappings.hasOwnProperty(name)) {
					marketValue = torndata.items[localMappings[name]].market_value;
				} else {
					for (const itemId in torndata.items) {
						if (torndata.items[itemId].name === name) {
							marketValue = torndata.items[itemId].market_value;
							break;
						}
					}
				}
				if (marketValue === 0) continue;

				// noinspection JSCheckFunctionSignatures
				const worth = parseInt(marketValue * quantity);
				totalValue += worth;

				item.appendChild(document.newElement({ type: "span", class: "tt-item-value", text: formatNumber(worth, { currency: true }) }));
			}

			if (totalValue !== 0) {
				side.appendChild(
					document.newElement({
						type: "div",
						class: "tt-total-value",
						text: "Total value: ",
						children: [document.newElement({ type: "span", text: formatNumber(totalValue, { currency: true }) })],
					})
				);
			}

			const checkbox = document.newElement({ type: "input", attributes: { type: "checkbox" } });
			if (filters.trade.hideValues) {
				checkbox.checked = true;
				for (const item of side.findAll(".tt-item-value")) {
					item.style.display = "none";
				}
			}
			checkbox.addEventListener("click", async () => {
				const style = checkbox.checked ? "none" : "block";
				const filterSetting = style !== "block";
				await ttStorage.change({ filters: { trade: { hideValues: filterSetting } } });
				filters.trade.hideValues = filterSetting;

				for (const item of side.findAll(".tt-item-value")) {
					item.style.display = style;
				}
			});
			const wrap = document.newElement({
				type: "div",
				class: "tt-hide-values",
				children: [document.newElement({ type: "span", text: "Hide item values" }), checkbox],
			});

			side.find(".title-black").appendChild(wrap);
		}
	}

	function removeItemValues() {
		document.body.classList.remove("tt-trade-values");
		document.findAll(".tt-item-value, .tt-log-value, .tt-total-value, .tt-hide-values").forEach((x) => x.remove());
		document.findAll(".tt-modified").forEach((x) => x.classList.remove("tt-modified"));
	}
})();
