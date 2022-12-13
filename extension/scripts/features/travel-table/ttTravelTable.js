"use strict";

(async () => {
	const page = getPage();
	if (page === "home" && !isFlying()) return;

	const COUNTRIES = {
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

	const feature = featureManager.registerFeature(
		"Travel Table",
		"travel",
		() => settings.pages.travel.table,
		initialise,
		startTable,
		removeTable,
		{
			storage: ["settings.pages.travel.table", "settings.pages.travel.autoTravelTableCountry", "settings.external.yata"],
		},
		() => {
			if (!hasAPIData()) return "No API data!";
			else if (!settings.external.yata) return "YATA not enabled";
			else if (isCaptcha()) return "Captcha present.";
		}
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(({ type }) => {
			if (!feature.enabled()) return;

			document.find("#travel-items").value = getTravelCount(type);
			updateValues();
		});
	}

	async function startTable() {
		if (page === "home") startFlyingTable();
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
			updateTable();
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
									<i class="fas fa-chevron-${isOpen ? "down" : "right"}"></i>
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
								<div class="row flex">
									<div>
										<input id="hide-out-of-stock" type="checkbox"/>
										<label for="hide-out-of-stock">Hide out of stock items.</label>
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
					if (event.target.classList.contains("legend-icon")) return;

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

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

					updateTable();
				});
				content.find(".countries-select-none").addEventListener("click", () => {
					for (const country of content.findAll(".countries .flag")) country.classList.remove("selected");

					ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

					updateTable();
				});

				content.find("#travel-items").value = amount;

				if (filters.travel.hideOutOfStock) content.find("#hide-out-of-stock").checked = true;
				for (const category of filters.travel.categories) {
					const element = content.find(`.categories input[name="item"][category="${category}"]`);
					if (element) element.checked = true;
				}
				for (const country of filters.travel.countries) {
					const element = content.find(`.countries .flag[country="${country}"]`);
					if (element) element.classList.add("selected");
				}

				// Check for legend changes
				content.find("#travel-items").addEventListener("change", () => updateValues());
				content.find("#hide-out-of-stock").addEventListener("change", (event) => {
					ttStorage.change({ filters: { travel: { hideOutOfStock: event.target.checked } } });

					updateTable();
				});
				for (const item of content.findAll(".categories input[name='item']")) {
					item.addEventListener("change", () => {
						ttStorage.change({ filters: { travel: { categories: getSelectedCategories() } } });

						updateTable();
					});
				}
				for (const item of content.findAll(".countries .flag")) {
					item.addEventListener("click", (event) => {
						event.target.classList.toggle("selected");

						ttStorage.change({ filters: { travel: { countries: getSelectedCountries() } } });

						updateTable();
					});
				}

				if (!isFlying() && !isAbroad() && !document.find(".info-msg-cont.red .msg"))
					document.find("#tab-menu4").addEventListener("click", (event) => {
						if (
							settings.pages.travel.table &&
							settings.pages.travel.autoTravelTableCountry &&
							(event.target.matches("[aria-hidden*='false'] > .raceway") || event.target.closest(".travel-info-table-list"))
						) {
							let country =
								mobile || tablet
									? event.target.closest(".travel-info-table-list").find(".city-flag")?.className.replaceAll("city-flag", "").trim()
									: event.target.dataset.race.trim();
							if (!country) return;

							if (country === "uk") {
								country = "united_kingdom";
							}

							content.findAll(".countries .flag.selected").forEach((flag) => flag.classList.remove("selected"));
							content.find(`.countries .flag[country*="${country.replaceAll("-", "_")}"]`).classList.add("selected");
							updateTable();
						}
					});
			}

			function getSelectedCategories() {
				return [...content.findAll(".categories input[name='item']:checked")].map((el) => el.getAttribute("category"));
			}

			function getSelectedCountries() {
				return [...content.findAll(".countries .flag.selected")].map((el) => el.getAttribute("country"));
			}

			function updateTable() {
				const categories = getSelectedCategories();
				const countries = getSelectedCountries();
				const hideOutOfStock = content.find("#hide-out-of-stock").checked;

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

			async function pullInformation() {
				return fetchData("yata", { section: "travel/export/", relay: true });
			}

			function toRow(item, country, lastUpdate) {
				let category = torndata.items[item.id].type.toLowerCase();
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

				let value = torndata.items[item.id].market_value;
				let time = country.time * getTimeModifier(getTravelType());
				let profitItem, profitMinute, profit;
				if (value !== 0) {
					profitItem = value - cost;
					profit = amount * value - totalCost;
					profitMinute = (profit / (time * 2)).dropDecimals();
				} else {
					value = "N/A";
					profitItem = "N/A";
					profitMinute = "N/A";
					profit = "N/A";
				}

				// noinspection HtmlUnknownTarget
				return document.newElement({
					type: "div",
					class: "row",
					html: `
						<div class="country">
							<img class="flag" src="/images/v2/travel_agency/flags/fl_${country.image}.svg" alt="${country.name}" title="${country.name}"/>
							<span class="name">${country.name}</span>
						</div>
						<a class="item" target="_blank" href="https://www.torn.com/imarket.php#/p=shop&type=${item.id}">
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

			function getValueClass(value) {
				if (value === "N/A") return "";

				return value > 0 ? "positive" : "negative";
			}
		}

		function startFlyingTable() {
			let isOpened = new URLSearchParams(location.search).get("travel") === "true";

			showIcon();
			createTable();

			if (isOpened) showTable();
			else hideTable();

			function showIcon() {
				document.find("#top-page-links-list").insertBefore(
					document.newElement({
						type: "span",
						class: "tt-travel last",
						attributes: {
							"aria-labelledby": "travel-table",
						},
						children: [
							document.newElement({ type: "i", class: "fas fa-plane" }),
							document.newElement({ type: "span", text: isOpened ? "Home" : "Travel Table" }),
						],
						events: {
							click: changeState,
						},
					}),
					document.find("#top-page-links-list .links-footer")
				);

				function changeState() {
					isOpened = !isOpened;

					const searchParams = new URLSearchParams(location.search);
					searchParams.set("travel", `${isOpened}`);
					history.pushState(null, "", `${location.pathname}?${searchParams.toString()}`);

					document.find(".tt-travel span").textContent = isOpened ? "Home" : "Travel Table";

					if (isOpened) showTable();
					else hideTable();
				}
			}

			function showTable() {
				const agency = document.find(".travel-agency-travelling");

				const hiddenBy = JSON.parse(agency.dataset.hiddenBy || "[]");
				hiddenBy.push("travel-table");
				agency.dataset.hiddenBy = JSON.stringify(hiddenBy);

				agency.findAll(".popup-info, .stage, .delimiter-999").forEach((element) => element.classList.add("tt-hidden"));

				findContainer("Travel Destinations").classList.remove("tt-hidden");
			}

			function hideTable() {
				const agency = document.find(".travel-agency-travelling");
				const hiddenBy = JSON.parse(agency.dataset.hiddenBy || "[]").filter((by) => by !== "travel-table");

				if (hiddenBy.length) {
					agency.dataset.hiddenBy = JSON.stringify(hiddenBy);
				} else {
					agency.findAll(".popup-info, .stage, .delimiter-999").forEach((element) => element.classList.remove("tt-hidden"));

					delete agency.dataset.hiddenBy;
				}
				findContainer("Travel Destinations").classList.add("tt-hidden");
			}
		}
	}

	function updateValues() {
		const content = findContainer("Travel Destinations", { selector: ":scope > main" });
		const table = content.find("#tt-travel-table");

		const amount = parseInt(content.find("#travel-items").value);

		for (const row of table.findAll(".row:not(.header)")) {
			const { value, cost, travelCost, time } = toCorrectType(row.dataset);
			if (!cost) continue;
			const modifiedTime = time * getTimeModifier(getTravelType());
			const totalCost = amount * cost + travelCost;
			if (value && value !== "N/A") {
				const profit = amount * value - totalCost;
				const profitMinute = (profit / (modifiedTime * 2)).dropDecimals();

				row.find(".profit-minute").textContent = formatNumber(profitMinute, { shorten: true, currency: true, forceOperation: true });
				row.find(".profit").textContent = formatNumber(profit, { shorten: true, currency: true, forceOperation: true });
			}

			row.find(".money").textContent = formatNumber(totalCost, { shorten: true, currency: true });
		}
	}

	function getTravelCount(type) {
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
	function getTimeModifier(type) {
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
				console.error("Unknown travel type");
		}
	}

	function getTravelType() {
		if (page === "travelagency") {
			const element = document.find("#tab-menu4 > ul > li[aria-selected='true'] .travel-name");

			if (!element) return hasAPIData() ? getAPIType() : "standard";
			else return element.textContent.toLowerCase();
		} else if (page === "home") {
			return hasAPIData() ? getAPIType() : "standard";
		}

		function getAPIType() {
			if (!hasAPIData() || !settings.apiUsage.user.travel) return "standard";

			switch (userdata.travel.method.toLowerCase()) {
				case "airstrip":
					return "private";
				case "private": // Needs to be validated.
					return "private";
				case "business":
					return "business";
				default:
					console.log("TT - Detected unknown travel type.", userdata.travel.method);
					return "standard";
			}
		}
	}

	function removeTable() {
		removeIcon();
		removeContainer("Travel Destinations");

		function removeIcon() {
			const icon = document.find(".tt-travel");
			if (icon) icon.remove();
		}
	}
})();
