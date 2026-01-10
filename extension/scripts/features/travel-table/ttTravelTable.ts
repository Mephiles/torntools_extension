(async () => {
	const page = getPage();
	if (isAbroad()) return;

	interface CountryInformation {
		name: string;
		image: string;
		tag: string;
		cost: number;
		time: number;
	}

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

	const feature = featureManager.registerFeature(
		"Travel Table",
		"travel",
		() => settings.pages.travel.table,
		initialise,
		startTable,
		removeTable,
		{
			storage: ["settings.pages.travel.table", "settings.pages.travel.autoTravelTableCountry", "settings.external.yata", "settings.external.prometheus"],
		},
		() => {
			if (!hasAPIData()) return "No API data!";
			else if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";
			else if (isCaptcha()) return "Captcha present.";

			return true;
		}
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(({ type }) => {
			if (!feature.enabled()) return;

			document.find<HTMLInputElement>("#travel-items").value = getTravelCount(type as any).toString();
			updateValues();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(({ country }) => {
			if (!feature.enabled() || !settings.pages.travel.autoTravelTableCountry) return;

			const content = findContainer("Travel Destinations", { selector: ":scope > main" });

			content.findAll(".countries .flag.selected").forEach((flag) => flag.classList.remove("selected"));
			content.find(`.countries .flag[country*="${country}"]`).classList.add("selected");
			updateTable(content);
		});
	}

	async function startTable() {
		if (isFlying()) startFlyingTable();
		else {
			await createTable();
		}

		async function createTable() {
			const { content } = createContainer("Travel Destinations", { class: "mt10" });
			const amount = getTravelCount();

			addLegend();

			const table = document.newElement({
				type: "div",
				id: "tt-travel-table",
				children: [
					document.newElement({
						type: "div",
						class: "row header",
						children: [
							document.newElement({ type: "div", class: "country", text: "Country" }),
							document.newElement({ type: "div", class: "item", text: "Item" }),
							document.newElement({ type: "div", class: "stock", text: "Stock" }),
							document.newElement({ type: "div", class: "buy-price advanced", text: "Buy Price" }),
							document.newElement({ type: "div", class: "market-value advanced", text: "Market Value" }),
							document.newElement({ type: "div", class: "profit-item advanced", text: "Profit / Item" }),
							document.newElement({ type: "div", class: "profit-minute", text: "Profit / Minute" }),
							document.newElement({ type: "div", class: "profit advanced", text: "Total Profit" }),
							document.newElement({ type: "div", class: "money advanced", text: "Cash Needed" }),
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
				for (const advanced of table.findAll(".advanced:not(.tt-hidden)")) {
					advanced.classList.add("tt-hidden");
				}
			} else {
				table.classList.add("advanced");
				for (const basic of table.findAll(".basic:not(.tt-hidden)")) {
					basic.classList.add("tt-hidden");
				}
			}

			table.findAll(".row.header > div").forEach((item, index) => {
				item.addEventListener("click", () => {
					sortTable(table, index + 1);
				});
			});

			content.appendChild(document.newElement({ type: "div", class: "table-wrap", children: [table] }));
			updateTable(content);
			sortTable(table, 7, "desc");

			function addLegend() {
				let isOpen = filters.travel.open;

				content.appendChild(
					document.newElement({
						type: "div",
						class: "legend",
						html: `
							<div class="top-row">
								<div class="legend-icon">
									<i class="fa-solid fa-chevron-${isOpen ? "down" : "right"}"></i>
									<span>Filters</span>
								</div>
								<div class="table-type-wrap">
									<span class="table-type" type="basic">Basic</span>
									<span> / </span>
									<span class="table-type" type="advanced">Advanced</span>
								</div>
							</div>
							<div class="legend-content ${isOpen ? "" : "tt-hidden"}">
								<div class="row flex">
									<div>
										<label for="travel-items">Travel items: </label>
										<input id="travel-items" type="number" min="5"/>
									</div>
								</div>
								<div class="row">
									<div>
										<input id="hide-out-of-stock" type="checkbox"/>
										<label for="hide-out-of-stock">Hide out of stock items.</label>
									</div>
									<div>
										<input id="apply-sales-tax" type="checkbox"/>
										<label for="apply-sales-tax">Apply ${SALES_TAX}% sales tax for item market.</label>
									</div>
									<div>
										<input id="sell-anonymously" type="checkbox"/>
										<label for="sell-anonymously">Apply ${ANONYMOUS_TAX}% tax for selling anonymously.</label>
									</div>
								</div>
								<div class="heading">Items</div>
								<div class="row flex categories">
									<div class="checkbox-item">
										<input id="travel-item-plushies" type="checkbox" name="item" category="plushie">
										<label for="travel-item-plushies">Plushies</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-flowers" type="checkbox" name="item" category="flower">
										<label for="travel-item-flowers">Flowers</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-drugs" type="checkbox" name="item" category="drug">
										<label for="travel-item-drugs">Drugs</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-temporaries" type="checkbox" name="item" category="temporary">
										<label for="travel-item-temporaries">Temporaries</label>
									</div>
									<div class="checkbox-item">
										<input id="travel-item-weapons" type="checkbox" name="item" category="weapon">
										<label for="travel-item-weapons">Weapons</label>
									</div>
			                     	<div class="checkbox-item">
										<input id="travel-item-other" type="checkbox" name="item" category="other">
										<label for="travel-item-other">Other</label>
									</div>
								</div>
								<div class="heading-wrap">
									<span class="heading-text">Countries</span> (<span class="countries-select-all">all</span> / <span class="countries-select-none">none</span>)
								</div>
								<div class="row countries">
									<div class="flex">
										<span>Short flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_mexico.svg" country="mexico" alt="Mexico" title="Mexico"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_cayman.svg" country="cayman_islands" alt="Cayman Islands" title="Cayman Islands"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_canada.svg" country="canada" alt="Canada" title="Canada"/>
									</div>
									<div class="flex">
										<span>Medium flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_hawaii.svg" country="hawaii" alt="Hawaii" title="Hawaii"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_uk.svg" country="united_kingdom" alt="United Kingdom" title="United Kingdom"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_argentina.svg" country="argentina" alt="Argentina" title="Argentina"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_switzerland.svg" country="switzerland" alt="Switzerland" title="Switzerland"/>
									</div>
									<div class="flex">
										<span>Long flights</span>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_japan.svg" country="japan"  alt="Japan" title="Japan"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_china.svg" country="china" alt="China" title="China"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_uae.svg" country="uae" alt="UAE" title="UAE"/>
										<img class="flag" src="/images/v2/travel_agency/flags/fl_south_africa.svg" country="south_africa" alt="South Africa" title="South Africa"/>
									</div>
								</div>
							</div>
						`,
					})
				);

				content.find(".legend-icon").addEventListener("click", (event) => {
					if ((event.target as Element).classList.contains("legend-icon")) return;

					const isOpen = !content.find(".legend-content").classList.toggle("tt-hidden");

					const iconClasses = content.find(".legend-icon i").classList;
					if (isOpen) {
						iconClasses.remove("fa-chevron-right");
						iconClasses.add("fa-chevron-down");
					} else {
						iconClasses.remove("fa-chevron-down");
						iconClasses.add("fa-chevron-right");
					}
					ttStorage.change({ filters: { travel: { open: isOpen } } });
				});

				content.find(`.table-type[type=${filters.travel.type}]`).classList.add("active");
				const typeBasic = content.find(".table-type[type='basic']");
				const typeAdvanced = content.find(".table-type[type='advanced']");

				typeBasic.addEventListener("click", () => {
					typeBasic.classList.add("active");
					typeAdvanced.classList.remove("active");

					table.classList.add("basic");
					table.classList.remove("advanced");

					for (const basic of table.findAll(".basic.tt-hidden")) {
						basic.classList.remove("tt-hidden");
					}
					for (const advanced of table.findAll(".advanced:not(.tt-hidden)")) {
						advanced.classList.add("tt-hidden");
					}

					ttStorage.change({ filters: { travel: { type: "basic" } } });
				});
				typeAdvanced.addEventListener("click", () => {
					typeAdvanced.classList.add("active");
					typeBasic.classList.remove("active");

					table.classList.add("advanced");
					table.classList.remove("basic");

					for (const advanced of table.findAll(".advanced.tt-hidden")) {
						advanced.classList.remove("tt-hidden");
					}
					for (const basic of table.findAll(".basic:not(.tt-hidden)")) {
						basic.classList.add("tt-hidden");
					}

					ttStorage.change({ filters: { travel: { type: "advanced" } } });
				});

				content.find(".countries-select-all").addEventListener("click", () => {
					for (const country of content.findAll(".countries .flag")) country.classList.add("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

					updateTable(content);
				});
				content.find(".countries-select-none").addEventListener("click", () => {
					for (const country of content.findAll(".countries .flag")) country.classList.remove("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

					updateTable(content);
				});

				content.find<HTMLInputElement>("#travel-items").value = amount.toString();

				if (filters.travel.hideOutOfStock) content.find<HTMLInputElement>("#hide-out-of-stock").checked = true;
				if (filters.travel.applySalesTax) content.find<HTMLInputElement>("#apply-sales-tax").checked = true;
				if (filters.travel.sellAnonymously) content.find<HTMLInputElement>("#sell-anonymously").checked = true;
				for (const category of filters.travel.categories) {
					const element = content.find<HTMLInputElement>(`.categories input[name="item"][category="${category}"]`);
					if (element) element.checked = true;
				}
				for (const country of filters.travel.countries) {
					const element = content.find(`.countries .flag[country="${country}"]`);
					if (element) element.classList.add("selected");
				}

				// Check for legend changes
				content.find("#travel-items").addEventListener("change", () => updateValues());
				content.find("#hide-out-of-stock").addEventListener("change", (event) => {
					ttStorage.change({ filters: { travel: { hideOutOfStock: (event.target as HTMLInputElement).checked } } });

					updateTable(content);
				});
				content.find("#apply-sales-tax").addEventListener("change", (event) => {
					ttStorage.change({ filters: { travel: { applySalesTax: (event.target as HTMLInputElement).checked } } });

					setTimeout(updateValues);
				});
				content.find("#sell-anonymously").addEventListener("change", (event) => {
					ttStorage.change({ filters: { travel: { sellAnonymously: (event.target as HTMLInputElement).checked } } });

					setTimeout(updateValues);
				});
				for (const item of content.findAll(".categories input[name='item']")) {
					item.addEventListener("change", () => {
						ttStorage.change({ filters: { travel: { categories: getSelectedCategories(content) } } });

						updateTable(content);
					});
				}
				for (const item of content.findAll(".countries .flag")) {
					item.addEventListener("click", (event) => {
						(event.target as Element).classList.toggle("selected");

						ttStorage.change({ filters: { travel: { countries: getSelectedCountries(content) } } });

						updateTable(content);
					});
				}
			}

			async function pullInformation() {
				const fetchYata = () => fetchData<YATATravelResponse>("yata", { section: "travel/export/", relay: true });
				const fetchPrometheus = () => fetchData<PrometheusTravelResponse>("prometheus", { section: "travel", relay: true });

				if (settings.external.yata && settings.external.prometheus) return Promise.any([fetchPrometheus(), fetchYata()]);
				else if (settings.external.yata) return fetchYata();
				else if (settings.external.prometheus) return fetchPrometheus();

				throw "No available data.";
			}

			type StockItem = YATATravelResponse["stocks"][string]["stocks"][number];

			function toRow(item: StockItem, country: CountryInformation, lastUpdate: number) {
				let category = item.id in torndata.items ? torndata.items[item.id].type.toLowerCase() : "other";
				switch (category) {
					case "plushie":
					case "flower":
					case "drug":
					case "temporary":
						break;
					case "melee":
					case "primary":
					case "secondary":
						category = "weapon";
						break;
					case "alcohol":
					case "clothing":
					case "other":
					default:
						category = "other";
						break;
				}

				const cost = item.cost;
				let totalCost = amount * cost;

				if (getTravelType() === "standard") totalCost += country.cost;

				const tornItem = torndata.items[item.id];
				let value: number | "N/A" = tornItem?.market_value ?? 0;
				const time = country.time * getTimeModifier(getTravelType());
				let profitItem: number | "N/A", profitMinute: number | "N/A", profit: number | "N/A";
				if (value !== 0) {
					const sales = value * amount;

					const applySalesTax = content.find<HTMLInputElement>("#apply-sales-tax").checked;
					const salesTax = applySalesTax ? Math.ceil((sales * SALES_TAX) / 100) : 0;

					const sellAnonymously = content.find<HTMLInputElement>("#sell-anonymously").checked;
					const anonymousTax = sellAnonymously ? Math.ceil((sales * ANONYMOUS_TAX) / 100) : 0;

					profit = sales - (totalCost + salesTax + anonymousTax);
					profitItem = (profit / amount).dropDecimals();
					profitMinute = (profit / (time * 2)).dropDecimals();
				} else {
					value = "N/A";
					profitItem = "N/A";
					profitMinute = "N/A";
					profit = "N/A";
				}

				return document.newElement({
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
					document.newElement({
						type: "div",
						class: "tt-travel-wrapper",
						attributes: {
							"aria-labelledby": "travel-table",
						},
						children: [
							document.newElement({ type: "i", class: "tt-travel-icon fa-solid fa-plane" }),
							mobile ? null : document.newElement({ type: "span", text: isOpened ? "Home" : "Travel Table" }),
						],
						events: {
							click: changeState,
						},
					})
				);

				function changeState() {
					isOpened = !isOpened;

					const searchParams = new URLSearchParams(location.search);
					searchParams.set("travel", `${isOpened}`);
					history.pushState(null, "", `${location.pathname}?${searchParams.toString()}`);

					const travelText = document.find(".tt-travel span");
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
		return [...content.findAll(".categories input[name='item']:checked")].map((el) => el.getAttribute("category"));
	}

	function getSelectedCountries(content: Element) {
		return [...content.findAll(".countries .flag.selected")].map((el) => el.getAttribute("country"));
	}

	function updateTable(content: Element) {
		const table = document.find("#tt-travel-table");
		if (!table) return;

		const categories = getSelectedCategories(content);
		const countries = getSelectedCountries(content);
		const hideOutOfStock = content.find<HTMLInputElement>("#hide-out-of-stock").checked;

		for (const row of table.findAll(".row:not(.header)")) {
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
		const table = content.find("#tt-travel-table");
		if (!table) return;

		const amount = parseInt(content.find<HTMLInputElement>("#travel-items").value);
		const applySalesTax = content.find<HTMLInputElement>("#apply-sales-tax").checked;
		const sellAnonymously = content.find<HTMLInputElement>("#sell-anonymously").checked;

		for (const row of table.findAll(".row:not(.header)")) {
			const { value, cost, travelCost, time } = toCorrectType(row.dataset);
			if (!cost) continue;

			const modifiedTime = time * getTimeModifier(getTravelType());
			const totalCost = amount * cost + travelCost;
			if (value && value !== "N/A") {
				const sales = value * amount;
				const salesTax = applySalesTax ? Math.ceil((sales * SALES_TAX) / 100) : 0;
				const anonymousTax = sellAnonymously ? Math.ceil((sales * ANONYMOUS_TAX) / 100) : 0;

				const profit = sales - (totalCost + salesTax + anonymousTax);
				const profitItem = (profit / amount).dropDecimals();
				const profitMinute = (profit / (modifiedTime * 2)).dropDecimals();

				const elementProfitItem = row.find(".profit-item");
				const elementProfitMinute = row.find(".profit-minute");
				const elementProfit = row.find(".profit");

				const allElements: [HTMLElement, number][] = [
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
				resortTable(table);
			}

			row.find(".money").textContent = formatNumber(totalCost, { shorten: true, currency: true });
		}
	}

	function getTravelCount(type?: TravelType) {
		if (!type) type = getTravelType();

		let count = 5;

		if (hasAPIData() && settings.apiUsage.user.perks) {
			count += userdata.enhancer_perks
				.map((perk) => perk.match(/\+ (\d+) Travel items \(.* Suitcase\)/i))
				.filter((result) => !!result)
				.map((result) => parseInt(result[1]))
				.totalSum();
			count += userdata.job_perks
				.filter((perk) => perk.includes("travel") && (perk.includes("item") || perk.includes("capacity")))
				.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
				.totalSum();
			count += userdata.faction_perks
				.filter((perk) => perk.includes("travel") && perk.includes("capacity"))
				.map((result) => result.getNumber())
				.totalSum();
			// CHECK - Improve book perk checking.
			count += userdata.book_perks
				.filter((perk) => perk.includes("travel capacity"))
				.map((perk) => parseInt(perk.replace("+ ", "").split(" ")[0]))
				.totalSum();
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
		if (page === "travel") {
			const element = document.find<HTMLInputElement>("input[name='travelType'][aria-checked='true']");

			if (!element) return hasAPIData() ? getAPIType() : "standard";
			else return toCorrectMethod(element.value);
		} else {
			return hasAPIData() ? getAPIType() : "standard";
		}

		function getAPIType() {
			if (!hasAPIData() || !settings.apiUsage.user.travel) return "standard";

			return toCorrectMethod(userdata.travel.method.toLowerCase());
		}

		function toCorrectMethod(method: string) {
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
			const icon = document.find(".tt-travel");
			if (icon) icon.remove();
		}
	}
})();
