import "./trade-values.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings, torndata } from "@/utils/common/data/database";
import { getPageStatus } from "@/utils/common/functions/torn";
import { hasAPIData } from "@/utils/common/functions/api";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { ttStorage } from "@/utils/common/data/storage";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(async ({ step }) => {
		if (!FEATURE_MANAGER.isEnabled(TradeValuesFeature)) return;
		if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

		await addItemValues();
	});
}

async function addItemValues() {
	document.body.classList.add("tt-trade-values");
	await requireElement(".cont .color1 .desc > li .name");
	const localMappings: Record<string, string> = {};

	for (const log of findAllElements(".log li .msg:not(.tt-modified)")) {
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
				const quantityMap: { [name: string]: number } = {};
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

				torndata.items
					.filter((i) => quantityMap.hasOwnProperty(i.name))
					.forEach((i) => {
						localMappings[i.name] = i.id.toString();
						totalValue += quantityMap[i.name] * i.value.market_price;
					});
			}
			log.appendChild(elementBuilder({ type: "span", class: "tt-log-value", text: formatNumber(totalValue, { currency: true }) }));
		}
	}

	for (const side of findAllElements(".user.left:not(.tt-modified), .user.right:not(.tt-modified)")) {
		side.classList.add("tt-modified");
		let totalValue = 0;

		const cashInTrade = side.querySelector(".cont .color1 .desc > li .name");
		if (cashInTrade && cashInTrade.textContent.trim() !== "No money in trade")
			totalValue += parseInt(cashInTrade.textContent.match(/\$([\d,]*)/i)[1].replaceAll(",", ""));

		for (const item of findAllElements(".cont .color2 .desc > li .name", side)) {
			if (item.textContent === "No items in trade") continue;

			const name = item.textContent.split(" x")[0].trim();
			const quantity = parseInt(item.textContent.split(" x")[1]) || 1;

			let marketValue = 0;
			if (localMappings.hasOwnProperty(name)) {
				marketValue = torndata.itemsMap[localMappings[name]].value.market_price;
			} else {
				marketValue = torndata.items.find((i) => i.name === name)?.value?.market_price ?? 0;
			}
			if (marketValue === 0) continue;

			const worth = parseInt((marketValue * quantity).toString());
			totalValue += worth;

			item.appendChild(elementBuilder({ type: "span", class: "tt-item-value", text: formatNumber(worth, { currency: true }) }));
		}

		if (totalValue !== 0) {
			side.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-total-value",
					text: "Total value: ",
					children: [elementBuilder({ type: "span", text: formatNumber(totalValue, { currency: true }) })],
				})
			);
		}

		const checkbox = elementBuilder({ type: "input", attributes: { type: "checkbox" } });
		if (filters.trade.hideValues) {
			checkbox.checked = true;
			for (const item of findAllElements(".tt-item-value", side)) {
				item.style.display = "none";
			}
		}
		checkbox.addEventListener("click", async () => {
			const style = checkbox.checked ? "none" : "block";
			const filterSetting = style !== "block";
			await ttStorage.change({ filters: { trade: { hideValues: filterSetting } } });
			filters.trade.hideValues = filterSetting;

			for (const item of findAllElements(".tt-item-value", side)) {
				item.style.display = style;
			}
		});
		const wrap = elementBuilder({
			type: "label",
			class: "tt-hide-values",
			text: "Hide item values",
			children: [checkbox],
		});

		side.querySelector(".title-black").appendChild(wrap);
	}
}

function removeItemValues() {
	document.body.classList.remove("tt-trade-values");
	findAllElements(".tt-item-value, .tt-log-value, .tt-total-value, .tt-hide-values").forEach((x) => x.remove());
	findAllElements(".tt-modified").forEach((x) => x.classList.remove("tt-modified"));
}

export default class TradeValuesFeature extends Feature {
	constructor() {
		super("Trade Values", "trade");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.trade.itemValues;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addItemValues();
	}

	cleanup() {
		removeItemValues();
	}

	storageKeys() {
		return ["settings.pages.trade.itemValues"];
	}
}
