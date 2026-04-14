import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import "./travel-table.css";
import type { TornItemTypeEnum, TornItemWeaponTypeEnum } from "tornapi-typescript";
import { filters, settings, torndata, userdata } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import type { PrometheusTravelResponse, YATATravelResponse } from "@/utils/common/functions/api.types";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, mobile, resortTable, sortTable } from "@/utils/common/functions/dom";
import { convertToNumber, dropDecimals, formatNumber, formatTime } from "@/utils/common/functions/formatting";
import { addCustomListener, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { createTTTopLinks, getPage, isAbroad, isCaptcha, isFlying, TAX_RATES } from "@/utils/common/functions/torn";
import { toCorrectType } from "@/utils/common/functions/utilities";
import { PHFillAirplane, PHFillCaretDown, PHFillCaretRight } from "@/utils/common/icons/phosphor-icons";

interface CountryInformation {
	name: string;
	image: string;
	tag: string;
	cost: number;
	time: number;
}

type TableCategory = "plushie" | "flower" | "drug" | "temporary" | "weapon" | "other";

const COUNTRIES: { [name: string]: CountryInformation } = {
	arg: { name: "Argentina", image: "argentina", tag: "argentina", cost: 21000, time: 167 },
	can: { name: "Canada", image: "canada", tag: "canada", cost: 9000, time: 41 },
	cay: { name: "Cayman Islands", image: "cayman", tag: "cayman_islands", cost: 10000, time: 35 },
	chi: { name: "China", image: "china", tag: "china", cost: 35000, time: 242 },
	haw: { name: "Hawaii", image: "hawaii", tag: "hawaii", cost: 11000, time: 134 },
	jap: { name: "Japan", image: "japan", tag: "japan", cost: 32000, time: 225 },
	mex: { name: "Mexico", image: "mexico", tag: "mexico", cost: 6500, time: 26 },
	sou: { name: "South Africa", image: "south_africa", tag: "south_africa", cost: 40000, time: 297 },
	swi: { name: "Switzerland", image: "switzerland", tag: "switzerland", cost: 27000, time: 175 },
	uae: { name: "UAE", image: "uae", tag: "uae", cost: 32000, time: 271 },
	uni: { name: "United Kingdom", image: "uk", tag: "united_kingdom", cost: 1800, time: 159 },
};

const SALES_TAX = TAX_RATES.salesTaxPercentage;
const ANONYMOUS_TAX = TAX_RATES.sellAnonymouslyPercentage;

function initialise() {
	addCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, ({ type }) => {
		if (!FEATURE_MANAGER.isEnabled(TravelTableFeature)) return;

		document.querySelector<HTMLInputElement>("#travel-items").value = getTravelCount(type as TravelType).toString();
		updateValues();
	});
	addCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, ({ country }) => {
		if (!FEATURE_MANAGER.isEnabled(TravelTableFeature) || !settings.pages.travel.autoTravelTableCountry) return;
		if (!settings.pages.travel.autoTravelTableCountry) return;

		const content = findContainer("Travel Destinations", { selector: ":scope > main" });

		findAllElements(".countries .flag.selected", content).forEach((flag) => flag.classList.remove("selected"));
		content.querySelector(`.countries .flag[country*="${country}"]`).classList.add("selected");
		updateTable(content);
	});
}

async function startTable() {
	if (isFlying()) startFlyingTable();
	else {
		await createTable();
	}

	async function createTable() {
		const { content } = createContainer("Travel Destinations", { defaultPosition: true, class: "mt10" });
		const amount = getTravelCount();

		addLegend();

		const table = elementBuilder({
			type: "div",
			id: "tt-travel-table",
			children: [
				elementBuilder({
					type: "div",
					class: "row header",
					children: [
						elementBuilder({ type: "div", class: "country", text: "Country" }),
						elementBuilder({ type: "div", class: "item", text: "Item" }),
						elementBuilder({ type: "div", class: "stock", text: "Stock" }),
						elementBuilder({ type: "div", class: "buy-price advanced", text: "Buy Price" }),
						elementBuilder({ type: "div", class: "market-value advanced", text: "Market Value" }),
						elementBuilder({ type: "div", class: "profit-item advanced", text: "Profit / Item" }),
						elementBuilder({ type: "div", class: "profit-minute", text: "Profit / Minute" }),
						elementBuilder({ type: "div", class: "profit advanced", text: "Total Profit" }),
						elementBuilder({ type: "div", class: "money advanced", text: "Cash Needed" }),
					],
				}),
			],
		});

		const data = await pullInformation();
		for (const code of Object.keys(data.stocks)) {
			const country = COUNTRIES[code];
			const lastUpdate = data.stocks[code].update;

			for (const item of data.stocks[code].stocks) {
				table.appendChild(toRow(item, country, lastUpdate));
			}
		}

		if (filters.travel.type === "basic") {
			table.classList.add("basic");
			for (const advanced of findAllElements(".advanced:not(.tt-hidden)", table)) {
				advanced.classList.add("tt-hidden");
			}
		} else {
			table.classList.add("advanced");
			for (const basic of findAllElements(".basic:not(.tt-hidden)", table)) {
				basic.classList.add("tt-hidden");
			}
		}

		findAllElements(".row.header > div", table).forEach((item, index) => {
			item.addEventListener("click", () => {
				sortTable(table, index + 1);
			});
		});

		content.appendChild(elementBuilder({ type: "div", class: "table-wrap", children: [table] }));
		updateTable(content);
		sortTable(table, 7, "desc");

		function addLegend() {
			const isOpen = filters.travel.open;

			content.appendChild(
				elementBuilder({
					type: "div",
					class: "legend",
					children: [
						elementBuilder({
							type: "div",
							class: "top-row",
							children: [
								elementBuilder({
									type: "div",
									class: "legend-icon",
									children: [isOpen ? PHFillCaretDown() : PHFillCaretRight(), elementBuilder({ type: "span", text: "Filters" })],
								}),
								elementBuilder({
									type: "div",
									class: "table-type-wrap",
									children: [
										elementBuilder({ type: "span", class: "table-type", attributes: { type: "basic" }, text: "Basic" }),
										elementBuilder({ type: "span", text: " / " }),
										elementBuilder({ type: "span", class: "table-type", attributes: { type: "advanced" }, text: "Advanced" }),
									],
								}),
							],
						}),
						elementBuilder({
							type: "div",
							class: `legend-content ${isOpen ? "" : "tt-hidden"}`,
							children: [
								elementBuilder({
									type: "div",
									class: "row flex",
									children: [
										elementBuilder({
											type: "div",
											children: [
												elementBuilder({ type: "label", attributes: { for: "travel-items" }, text: "Travel items: " }),
												elementBuilder({ type: "input", attributes: { id: "travel-items", type: "number", min: "5" } }),
											],
										}),
									],
								}),
								elementBuilder({
									type: "div",
									class: "row table-options",
									children: [
										elementBuilder({
											type: "div",
											class: "table-option",
											children: [
												elementBuilder({ type: "input", attributes: { id: "hide-out-of-stock", type: "checkbox" } }),
												elementBuilder({ type: "label", attributes: { for: "hide-out-of-stock" }, text: "Hide out of stock items." }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "table-option",
											children: [
												elementBuilder({ type: "input", attributes: { id: "apply-sales-tax", type: "checkbox" } }),
												elementBuilder({
													type: "label",
													attributes: { for: "apply-sales-tax" },
													text: `Apply ${SALES_TAX}% sales tax for item market.`,
												}),
											],
										}),
										elementBuilder({
											type: "div",
											class: "table-option",
											children: [
												elementBuilder({ type: "input", attributes: { id: "sell-anonymously", type: "checkbox" } }),
												elementBuilder({
													type: "label",
													attributes: { for: "sell-anonymously" },
													text: `Apply ${ANONYMOUS_TAX}% tax for selling anonymously.`,
												}),
											],
										}),
									],
								}),
								elementBuilder({ type: "div", class: "heading", text: "Items" }),
								elementBuilder({
									type: "div",
									class: "row flex categories",
									children: [
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-plushies", type: "checkbox", name: "item", category: "plushie" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-plushies" }, text: "Plushies" }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-flowers", type: "checkbox", name: "item", category: "flower" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-flowers" }, text: "Flowers" }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-drugs", type: "checkbox", name: "item", category: "drug" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-drugs" }, text: "Drugs" }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-temporaries", type: "checkbox", name: "item", category: "temporary" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-temporaries" }, text: "Temporaries" }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-weapons", type: "checkbox", name: "item", category: "weapon" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-weapons" }, text: "Weapons" }),
											],
										}),
										elementBuilder({
											type: "div",
											class: "checkbox-item",
											children: [
												elementBuilder({
													type: "input",
													attributes: { id: "travel-item-other", type: "checkbox", name: "item", category: "other" },
												}),
												elementBuilder({ type: "label", attributes: { for: "travel-item-other" }, text: "Other" }),
											],
										}),
									],
								}),
								elementBuilder({
									type: "div",
									class: "heading-wrap",
									children: [
										elementBuilder({ type: "span", class: "heading-text", text: "Countries" }),
										" (",
										elementBuilder({ type: "span", class: "countries-select-all", text: "all" }),
										" / ",
										elementBuilder({ type: "span", class: "countries-select-none", text: "none" }),
										")",
									],
								}),
								elementBuilder({
									type: "div",
									class: "row countries",
									children: [
										elementBuilder({
											type: "div",
											class: "flex",
											children: [
												elementBuilder({ type: "span", text: "Short flights" }),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_mexico.svg",
														country: "mexico",
														alt: "Mexico",
														title: "Mexico",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_cayman.svg",
														country: "cayman_islands",
														alt: "Cayman Islands",
														title: "Cayman Islands",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_canada.svg",
														country: "canada",
														alt: "Canada",
														title: "Canada",
													},
												}),
											],
										}),
										elementBuilder({
											type: "div",
											class: "flex",
											children: [
												elementBuilder({ type: "span", text: "Medium flights" }),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_hawaii.svg",
														country: "hawaii",
														alt: "Hawaii",
														title: "Hawaii",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_uk.svg",
														country: "united_kingdom",
														alt: "United Kingdom",
														title: "United Kingdom",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_argentina.svg",
														country: "argentina",
														alt: "Argentina",
														title: "Argentina",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_switzerland.svg",
														country: "switzerland",
														alt: "Switzerland",
														title: "Switzerland",
													},
												}),
											],
										}),
										elementBuilder({
											type: "div",
											class: "flex",
											children: [
												elementBuilder({ type: "span", text: "Long flights" }),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_japan.svg",
														country: "japan",
														alt: "Japan",
														title: "Japan",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_china.svg",
														country: "china",
														alt: "China",
														title: "China",
													},
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: { src: "/images/v2/travel_agency/flags/fl_uae.svg", country: "uae", alt: "UAE", title: "UAE" },
												}),
												elementBuilder({
													type: "img",
													class: "flag",
													attributes: {
														src: "/images/v2/travel_agency/flags/fl_south_africa.svg",
														country: "south_africa",
														alt: "South Africa",
														title: "South Africa",
													},
												}),
											],
										}),
									],
								}),
							],
						}),
					],
				}),
			);

			content.querySelector<HTMLElement>(".legend-icon").addEventListener("click", (event) => {
				if ((event.target as Element).classList.contains("legend-icon")) return;

				const isOpen = !content.querySelector(".legend-content").classList.toggle("tt-hidden");

				ttStorage.change({ filters: { travel: { open: isOpen } } });
			});

			content.querySelector(`.table-type[type=${filters.travel.type}]`).classList.add("active");
			const typeBasic = content.querySelector(".table-type[type='basic']");
			const typeAdvanced = content.querySelector(".table-type[type='advanced']");

			typeBasic.addEventListener("click", () => {
				typeBasic.classList.add("active");
				typeAdvanced.classList.remove("active");

				table.classList.add("basic");
				table.classList.remove("advanced");

				for (const basic of findAllElements(".basic.tt-hidden", table)) {
					basic.classList.remove("tt-hidden");
				}
				for (const advanced of findAllElements(".advanced:not(.tt-hidden)", table)) {
					advanced.classList.add("tt-hidden");
				}

				ttStorage.change({ filters: { travel: { type: "basic" } } });
			});
			typeAdvanced.addEventListener("click", () => {
				typeAdvanced.classList.add("active");
				typeBasic.classList.remove("active");

				table.classList.add("advanced");
				table.classList.remove("basic");

				for (const advanced of findAllElements(".advanced.tt-hidden", table)) {
					advanced.classList.remove("tt-hidden");
				}
				for (const basic of findAllElements(".basic:not(.tt-hidden)", table)) {
					basic.classList.add("tt-hidden");
				}

				ttStorage.change({ filters: { travel: { type: "advanced" } } });
			});

			content.querySelector(".countries-select-all").addEventListener("click", () => {
				for (const country of findAllElements(".countries .flag", content)) country.classList.add("selected");

				ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

				updateTable(content);
			});
			content.querySelector(".countries-select-none").addEventListener("click", () => {
				for (const country of findAllElements(".countries .flag", content)) country.classList.remove("selected");

				ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

				updateTable(content);
			});

			content.querySelector<HTMLInputElement>("#travel-items").value = amount.toString();

			if (filters.travel.hideOutOfStock) content.querySelector<HTMLInputElement>("#hide-out-of-stock").checked = true;
			if (filters.travel.applySalesTax) content.querySelector<HTMLInputElement>("#apply-sales-tax").checked = true;
			if (filters.travel.sellAnonymously) content.querySelector<HTMLInputElement>("#sell-anonymously").checked = true;
			for (const category of filters.travel.categories) {
				const element = content.querySelector<HTMLInputElement>(`.categories input[name="item"][category="${category}"]`);
				if (element) element.checked = true;
			}
			for (const country of filters.travel.countries) {
				const element = content.querySelector(`.countries .flag[country="${country}"]`);
				if (element) element.classList.add("selected");
			}

			// Check for legend changes
			content.querySelector("#travel-items").addEventListener("change", () => updateValues());
			content.querySelector<HTMLElement>("#hide-out-of-stock").addEventListener("change", (event) => {
				ttStorage.change({ filters: { travel: { hideOutOfStock: (event.target as HTMLInputElement).checked } } });

				updateTable(content);
			});
			content.querySelector<HTMLElement>("#apply-sales-tax").addEventListener("change", (event) => {
				ttStorage.change({ filters: { travel: { applySalesTax: (event.target as HTMLInputElement).checked } } });

				setTimeout(updateValues);
			});
			content.querySelector<HTMLElement>("#sell-anonymously").addEventListener("change", (event) => {
				ttStorage.change({ filters: { travel: { sellAnonymously: (event.target as HTMLInputElement).checked } } });

				setTimeout(updateValues);
			});
			for (const item of findAllElements(".categories input[name='item']", content)) {
				item.addEventListener("change", () => {
					ttStorage.change({ filters: { travel: { categories: getSelectedCategories(content) } } });

					updateTable(content);
				});
			}
			for (const item of findAllElements(".countries .flag", content)) {
				item.addEventListener("click", (event) => {
					(event.target as Element).classList.toggle("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

					updateTable(content);
				});
			}
		}

		async function pullInformation() {
			const fetchYata = () => {
				return new Promise<YATATravelResponse>((resolve, reject) => {
					fetchData<YATATravelResponse>("yata", { section: "travel/export/", relay: true })
						.then((response) => {
							if ("stocks" in response) resolve(response);
							else reject(new Error(`Unexpected response from YATA: ${JSON.stringify(response)}`));
						})
						.catch(reject);
				});
			};
			const fetchPrometheus = () => fetchData<PrometheusTravelResponse>("prometheus", { section: "travel", relay: true });

			if (settings.external.yata && settings.external.prometheus) return Promise.any([fetchPrometheus(), fetchYata()]);
			else if (settings.external.yata) return fetchYata();
			else if (settings.external.prometheus) return fetchPrometheus();

			throw "No available data.";
		}

		type StockItem = YATATravelResponse["stocks"][string]["stocks"][number];

		function toRow(item: StockItem, country: CountryInformation, lastUpdate: number) {
			const itemType: Lowercase<TornItemTypeEnum> =
				item.id in torndata.itemsMap ? (torndata.itemsMap[item.id].type.toLowerCase() as Lowercase<TornItemTypeEnum>) : "other";
			const subType: Lowercase<TornItemWeaponTypeEnum> | null =
				item.id in torndata.itemsMap && torndata.itemsMap[item.id].sub_type
					? (torndata.itemsMap[item.id].sub_type.toLowerCase() as Lowercase<TornItemWeaponTypeEnum>)
					: null;

			let category: TableCategory;
			switch (itemType) {
				case "plushie":
				case "flower":
				case "drug":
					category = itemType;
					break;
				case "weapon":
					category = subType === "temporary" ? "temporary" : "weapon";
					break;
				default:
					category = "other";
					break;
			}

			const cost = item.cost;
			let totalCost = amount * cost;

			if (getTravelType() === "standard") totalCost += country.cost;

			const tornItem = torndata.itemsMap[item.id];
			let value: number | "N/A" = tornItem?.value.market_price ?? 0;
			const time = country.time * getTimeModifier(getTravelType());
			let profitItem: number | "N/A", profitMinute: number | "N/A", profit: number | "N/A";
			if (value !== 0) {
				const sales = value * amount;

				const applySalesTax = content.querySelector<HTMLInputElement>("#apply-sales-tax").checked;
				const salesTax = applySalesTax ? Math.ceil((sales * SALES_TAX) / 100) : 0;

				const sellAnonymously = content.querySelector<HTMLInputElement>("#sell-anonymously").checked;
				const anonymousTax = sellAnonymously ? Math.ceil((sales * ANONYMOUS_TAX) / 100) : 0;

				profit = sales - (totalCost + salesTax + anonymousTax);
				profitItem = dropDecimals(profit / amount);
				profitMinute = dropDecimals(profit / (time * 2));
			} else {
				value = "N/A";
				profitItem = "N/A";
				profitMinute = "N/A";
				profit = "N/A";
			}

			return elementBuilder({
				type: "div",
				class: "row",
				html: `
						<div class="country">
							<img class="flag" src="/images/v2/travel_agency/flags/fl_${country.image}.svg" alt="${country.name}" title="${country.name}"/>
							<span class="name">${country.name}</span>
						</div>
						<a class="item" target="_blank" href="https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${item.id}&itemName=${item.name}&itemType=${tornItem?.type ?? ""}">
							<img class="icon" src="/images/items/${item.id}/small.png" alt="${item.name}" title="${item.name}"/>
							<span>${item.name}</a>
						</a>
						<div class="stock" value="${item.quantity}">
							<span>${formatNumber(item.quantity)}</span>		
							<div class="break advanced"></div>		
							<span class="update basic">&nbsp;(${formatTime({ seconds: lastUpdate }, { type: "ago" })})</span>		
							<span class="update advanced">(${formatTime({ seconds: lastUpdate }, { type: "ago", short: true })})</span>				
						</div>
						<div class="buy-price advanced" value="${item.cost}">
							${formatNumber(item.cost, { shorten: true, currency: true })}
						</div>
						<div class="market-value advanced" value="${typeof value !== "number" ? 0 : value}">
							${formatNumber(value, { shorten: true, currency: true })}
						</div>
						<div class="profit-item advanced ${getValueClass(profitItem)}" value="${typeof profitItem !== "number" ? 0 : profitItem}">
							${formatNumber(profitItem, { shorten: true, currency: true, forceOperation: true })}
						</div>
						<div class="profit-minute ${getValueClass(profitMinute)}" value="${typeof profitMinute !== "number" ? 0 : profitMinute}">
							${formatNumber(profitMinute, { shorten: true, currency: true, forceOperation: true })}
						</div>
						<div class="profit advanced ${getValueClass(profit)}" value="${typeof profit !== "number" ? 0 : profit}">
							${formatNumber(profit, { shorten: true, currency: true, forceOperation: true })}
						</div>
						<div class="money advanced" value="${totalCost}">
							${formatNumber(totalCost, { shorten: true, currency: true })}
						</div>
					`,
				dataset: {
					country: country.tag,
					category,
					value,
					cost,
					travelCost: getTravelType() === "standard" ? country.cost : 0,
					time: country.time,
					stock: item.quantity,
				},
			});
		}
	}

	function startFlyingTable() {
		let isOpened = new URLSearchParams(location.search).get("travel") === "true";

		showIcon();
		createTable();

		if (isOpened) showTable();
		else hideTable();

		async function showIcon() {
			const ttTopLinks = await createTTTopLinks();

			ttTopLinks.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-travel-wrapper",
					attributes: {
						"aria-labelledby": "travel-table",
					},
					children: [PHFillAirplane(), mobile ? null : elementBuilder({ type: "span", text: isOpened ? "Home" : "Travel Table" })],
					events: {
						click: changeState,
					},
				}),
			);

			function changeState() {
				isOpened = !isOpened;

				const searchParams = new URLSearchParams(location.search);
				searchParams.set("travel", `${isOpened}`);
				history.pushState(null, "", `${location.pathname}?${searchParams.toString()}`);

				const travelText = document.querySelector(".tt-travel span");
				if (travelText) travelText.textContent = isOpened ? "Home" : "Travel Table";

				if (isOpened) showTable();
				else hideTable();
			}
		}

		function showTable() {
			document.querySelector("#travel-root")?.classList.add("tt-travel-table-hide-plane");

			findContainer("Travel Destinations").classList.remove("tt-hidden");
		}

		function hideTable() {
			document.querySelector("#travel-root")?.classList.remove("tt-travel-table-hide-plane");

			findContainer("Travel Destinations").classList.add("tt-hidden");
		}
	}
}

function getValueClass(value: number | "N/A") {
	if (value === "N/A") return "";

	return value > 0 ? "positive" : "negative";
}

function getSelectedCategories(content: Element) {
	return findAllElements(".categories input[name='item']:checked", content).map((el) => el.getAttribute("category"));
}

function getSelectedCountries(content: Element) {
	return findAllElements(".countries .flag.selected", content).map((el) => el.getAttribute("country"));
}

function updateTable(content: Element) {
	const table = document.querySelector("#tt-travel-table");
	if (!table) return;

	const categories = getSelectedCategories(content);
	const countries = getSelectedCountries(content);
	const hideOutOfStock = content.querySelector<HTMLInputElement>("#hide-out-of-stock").checked;

	for (const row of findAllElements(".row:not(.header)", table)) {
		const { country, category, stock } = row.dataset;

		if (
			(categories.length > 0 && !categories.includes(category)) ||
			(countries.length > 0 && !countries.includes(country)) ||
			(hideOutOfStock && !parseInt(stock))
		)
			row.classList.add("tt-hidden");
		else row.classList.remove("tt-hidden");
	}
}

function updateValues() {
	const content = findContainer("Travel Destinations", { selector: ":scope > main" });
	const table = content.querySelector<HTMLElement>("#tt-travel-table");
	if (!table) return;

	const amount = parseInt(content.querySelector<HTMLInputElement>("#travel-items").value);
	const applySalesTax = content.querySelector<HTMLInputElement>("#apply-sales-tax").checked;
	const sellAnonymously = content.querySelector<HTMLInputElement>("#sell-anonymously").checked;

	for (const row of findAllElements(".row:not(.header)", table)) {
		const { value, cost, travelCost, time } = toCorrectType(row.dataset);
		if (!cost) continue;

		const modifiedTime = time * getTimeModifier(getTravelType());
		const totalCost = amount * cost + travelCost;
		if (value && value !== "N/A") {
			const sales = value * amount;
			const salesTax = applySalesTax ? Math.ceil((sales * SALES_TAX) / 100) : 0;
			const anonymousTax = sellAnonymously ? Math.ceil((sales * ANONYMOUS_TAX) / 100) : 0;

			const profit = sales - (totalCost + salesTax + anonymousTax);
			const profitItem = dropDecimals(profit / amount);
			const profitMinute = dropDecimals(profit / (modifiedTime * 2));

			const elementProfitItem = row.querySelector(".profit-item");
			const elementProfitMinute = row.querySelector(".profit-minute");
			const elementProfit = row.querySelector(".profit");

			const allElements: [Element, number][] = [
				[elementProfitItem, profitItem],
				[elementProfitMinute, profitMinute],
				[elementProfit, profit],
			];

			allElements.forEach(([element, value]) => {
				element.classList.remove("positive", "negative");
				element.classList.add(getValueClass(value));
				element.textContent = formatNumber(value, { shorten: true, currency: true, forceOperation: true });
				element.setAttribute("value", value.toString());
			});
		}

		row.querySelector(".money").textContent = formatNumber(totalCost, { shorten: true, currency: true });
	}

	resortTable(table);
}

function getTravelCount(type?: TravelType) {
	if (!type) type = getTravelType();

	let count = 5;

	if (hasAPIData() && settings.apiUsage.user.perks) {
		count += userdata.enhancer_perks
			.map((perk) => perk.match(/\+ (\d+) Travel items \(.* Suitcase\)/i))
			.filter((result) => !!result)
			.map((result) => parseInt(result[1]))
			.reduce((a, b) => a + b, 0);
		count += userdata.job_perks
			.filter((perk) => perk.includes("travel") && (perk.includes("item") || perk.includes("capacity")))
			.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
			.reduce((a, b) => a + b, 0);
		count += userdata.faction_perks
			.filter((perk) => perk.includes("travel") && perk.includes("capacity"))
			.map((result) => convertToNumber(result))
			.reduce((a, b) => a + b, 0);
		// CHECK - Improve book perk checking.
		count += userdata.book_perks
			.filter((perk) => perk.includes("travel capacity"))
			.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
			.reduce((a, b) => a + b, 0);
	}

	if (type !== "standard") count += 10;

	return count;
}

function getTimeModifier(type: TravelType) {
	switch (type) {
		case "standard":
			return 1;
		case "airstrip":
			return 0.7;
		case "private":
			return 0.5;
		case "business":
			return 0.3;
		default:
			console.error(`Unknown travel type '${type}'!`);
			return 1;
	}
}

function getTravelType() {
	if (getPage() === "travel") {
		const element = document.querySelector<HTMLInputElement>("input[name='travelType'][aria-checked='true']");

		if (!element) return hasAPIData() ? getAPIType() : "standard";
		else return toCorrectMethod(element.value);
	} else {
		return hasAPIData() ? getAPIType() : "standard";
	}

	function getAPIType() {
		if (!hasAPIData() || !settings.apiUsage.user.travel) return "standard";

		return toCorrectMethod(userdata.travel.method?.toLowerCase() ?? null);
	}

	function toCorrectMethod(method: string | null) {
		switch (method) {
			case "standard":
				return "standard";
			case "airstrip":
				return "airstrip";
			case "private":
				return "private";
			case "business":
				return "business";
			default:
				console.log("TT - Detected unknown travel type.", method);
				return "standard";
		}
	}
}

type TravelType = ReturnType<typeof getTravelType>;

function removeTable() {
	removeIcon();
	removeContainer("Travel Destinations");

	function removeIcon() {
		const icon = document.querySelector(".tt-travel");
		if (icon) icon.remove();
	}
}

export default class TravelTableFeature extends Feature {
	constructor() {
		super("Travel Table", "travel");
	}

	precondition() {
		return !isAbroad();
	}

	isEnabled() {
		return settings.pages.travel.table;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await startTable();
	}

	cleanup() {
		removeTable();
	}

	storageKeys() {
		return ["settings.pages.travel.table", "settings.pages.travel.autoTravelTableCountry", "settings.external.yata", "settings.external.prometheus"];
	}

	requirements() {
		if (!hasAPIData()) return "No API data!";
		else if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";
		else if (isCaptcha()) return "Captcha present.";

		return true;
	}
}
