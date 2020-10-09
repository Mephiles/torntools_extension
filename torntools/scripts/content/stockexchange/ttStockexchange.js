let isPortfolio;

requireDatabase().then(() => {
	stocksLoaded().then(() => {
		console.log("TT - Stock Exchange");

		addXHRListener(async (event) => {
			const { page, uri } = event.detail;
			if (page !== "stockexchange" || !uri) return;

			if (["buy2", "split", "stack"].includes(uri.step)) {
				await stocksLoaded();

				showInformation();

				addFilter(filters);
			}
		});

		isPortfolio = getSearchParameters().get("step") === "portfolio";

		if (!isPortfolio) {
			let ttRedirect = getSearchParameters().has("torntools_redirect") ? getSearchParameters().get("torntools_redirect").replace(/%20/g, " ") : undefined;

			if (ttRedirect || settings.pages.stockexchange.acronyms) {
				for (let stock of doc.findAll(".stock-list > .item")) {
					const heading = stock.firstElementChild; // heading

					const name = heading.find(".name").innerText;

					// Open torntools redirect
					if (ttRedirect && name === ttRedirect) stock.firstElementChild.click();

					if (settings.pages.stockexchange.acronyms) {
						const acronym = stock.getAttribute("data-stock").toUpperCase();

						stock.find(".name").innerText = `(${acronym}) ${name}`;
					}
				}
			}
		}

		if (settings.pages.stockexchange.advanced) {
			showInformation();

			addFilter(filters);
		}
	});
});

function stocksLoaded() {
	return requireElement(".stock-list .item, .portfolio-list-shares > .item-wrap");
}

function showInformation() {
	const formatterPrice = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 3,
		maximumFractionDigits: 3,
	});

	for (let stock of doc.findAll(".stock-list > .item, .portfolio-list-shares > li.item-wrap")) {
		const stockId = isPortfolio
			? stock
					.find(".logo > a")
					.getAttribute("href")
					.match(/&ID=([0-9]*)/i)[1]
			: stock.firstElementChild.getAttribute("action").split("ID=")[1];

		const data = torndata.stocks[stockId];

		if (isPortfolio) {
			const amount = parseInt(stock.find(".b-price-wrap > .first-row").innerText.split(": ")[1].replaceAll(",", ""));
			const boughtPrice = parseFloat(stock.find(".c-price-wrap > .second-row > .prop-wrap").innerText.split(": $")[1].replaceAll(",", ""));
			const currentPrice = parseFloat(stock.find(".b-price-wrap > .second-row > .prop-wrap").innerText.split(": $")[1].replaceAll(",", ""));
			const currentWorth = parseInt(stock.find(".c-price-wrap > .first-row").innerText.split(": $")[1].replaceAll(",", ""));

			let buyPrice = parseInt(boughtPrice * amount);
			let profit = parseInt(currentWorth - buyPrice);
			let priceDiff = currentPrice - data.current_price;

			let profitClass, profitChar;
			if (profit > 0) {
				profitClass = "profit";
				profitChar = "+";
			} else if (profit < 0) {
				profitClass = "loss";
				profitChar = "-";
			} else {
				profitClass = "break-even";
				profitChar = "-";
			}

			const qualityWrap = stock.find(".info > .qualify-wrap");
			const isEarningBlock = !!qualityWrap.innerText;

			let blockText = isEarningBlock ? "<span class='block-bb'>(BB)</span>" : "";
			if (!mobile) {
				blockText += `You bought at $<span class="bold">${numberWithCommas(
					buyPrice,
					false
				)}</span> worth and <span class="block-wording">${profitClass}</span> <span class="bold block-${profitClass}">${profitChar} $${numberWithCommas(
					Math.abs(profit),
					false
				)}</span>`;
			} else {
				blockText += `Bought $<span class="bold">${numberWithCommas(
					buyPrice,
					false
				)}</span> / <span class="block-wording">${profitClass}</span> <span class="bold block-${profitClass}">${profitChar} $${numberWithCommas(
					Math.abs(profit),
					false
				)}</span>`;
			}

			stock.find(".b-price-wrap > .second-row > .prop-wrap").innerHTML = `
                <span class="bold">
                    Price:
                </span>
                $${formatterPrice.format(currentPrice)}
                <span class="difference ${getDiffClass(priceDiff)}"><i></i>$${formatterPrice.format(Math.abs(priceDiff))}</span>
            `;

			stock.find(".qualify-wrap").innerHTML = blockText;
		} else {
			if (!mobile) {
				const owned = parseInt(stock.find(".owned").innerText.split("\n")[1].replaceAll(",", ""));

				if (owned > 0) {
					const price = parseFloat(stock.find(".price").innerText.split("\n$")[1].replaceAll(",", ""));

					const worth = parseInt(price * owned);

					stock.find(".owned").classList.add("tt-modified");
					stock.find(".owned").innerHTML += `<br/><span color="cyan">$${numberWithCommas(worth, false)}</span>`;
				}
			}
		}

		if (data.acronym !== "TCSE") {
			const classForecast = `forecast-${data.forecast.toLowerCase().replace(" ", "_")}`;

			const availableWorth = parseInt(data.available_shares) * parseFloat(data.current_price);
			let classWorth;
			if (availableWorth === 0) classWorth = "worth-noshares";
			else if (availableWorth > 0 && availableWorth <= 20e9) classWorth = "worth-level_1";
			else if (availableWorth > 20e9 && availableWorth <= 50e9) classWorth = "worth-level_2";
			else if (availableWorth > 50e9 && availableWorth <= 100e9) classWorth = "worth-level_3";

			const parent = stock.firstElementChild;

			parent.classList.add(classForecast);
			if (classWorth) {
				parent.classList.add(classWorth);
				parent.classList.add("worth");
			}

			let loaded = false;
			stock.firstElementChild.addEventListener("click", async () => {
				if (loaded) return;

				await stockProfileLoaded();

				const stockProperties = stock.find(".info-stock-wrap .properties");

				const rowTotalShares = stockProperties.find(":scope > li:nth-child(7)");
				const totalShares = parseInt(rowTotalShares.innerText.split(":\n")[1].replaceAll(",", ""));
				if (totalShares !== data.total_shares) {
					const diff = totalShares - data.total_shares;

					rowTotalShares.innerHTML = `
                    <div class="property left"><span>Total shares:</span></div>
                    ${FORMATTER_NO_DECIMALS.format(totalShares)}
                    <span class="difference ${getDiffClass(diff)}">
                        <i></i>
                        ${FORMATTER_NO_DECIMALS.format(Math.abs(diff))}
                    </span>
                `;
				}

				const rowSharesForSale = stockProperties.find(":scope > li:nth-child(8)");
				const sharesForSale = parseInt(rowSharesForSale.innerText.split(":\n")[1].replaceAll(",", ""));
				if (sharesForSale !== data.available_shares) {
					const diff = sharesForSale - data.available_shares;

					rowSharesForSale.innerHTML = `
						<div class="property left"><span>Shares for sale:</span></div>
						${FORMATTER_NO_DECIMALS.format(sharesForSale)}
						<span class="difference ${getDiffClass(diff)}">
							<i></i>
							${FORMATTER_NO_DECIMALS.format(Math.abs(diff))}
						</span>
                	`;
				}

				const rowForecast = stockProperties.find(":scope > li:nth-child(3)");
				const forecast = rowForecast.innerText.split(":\n")[1];
				if (forecast !== data.forecast) {
					const FORECASTS = {
						"Very Good": 2,
						Good: 1,
						Average: 0,
						Poor: -1,
						"Very Poor": -2,
					};

					const diff = FORECASTS[forecast] - FORECASTS[data.forecast];

					rowForecast.innerHTML = `
						<div class="property left"><span>Forecast:</span></div>
						${forecast}
						<span class="difference ${getDiffClass(diff)}">
							<i></i>
							${data.forecast}
						</span>
                	`;
				}

				loaded = true;
			});
		}
	}
}

function addFilter(filters) {
	if (doc.find("#tt-stock-filter")) return;

	const filterContainer = content
		.newContainer("Filters", {
			id: "tt-stock-filter",
			_class: `${isPortfolio ? "portfolio" : "market"}`,
			next_element: doc.find(".stock-main-wrap").firstElementChild,
		})
		.find(".content");

	filterContainer.innerHTML = `
        <div class="filter-content">
            <div class="filter-wrap" id="worth-filter">
                <div class="filter-heading">Available Worth</div>
                <div class="filter-multi-wrap">
                    <div class="tt-checkbox-wrap worth-noshares">
                        <input type="checkbox" name="shares" id="no_shares" value="no_shares">
                        <label for="no_shares" class="legend-worth" style="border-color: #424242;">No Shares</label>
                    </div>
                    <div class="tt-checkbox-wrap worth-level_1">
                        <input type="checkbox" name="shares" id="level_1" value="level_1">
                        <label for="level_1" class="legend-worth" style="border-color: #ff1f1f;">$0B - $20B</label>
                    </div>
                    <div class="tt-checkbox-wrap worth-level_2">
                        <input type="checkbox" name="shares" id="level_2" value="level_2">
                        <label for="level_2" class="legend-worth" style="border-color: #F2EA47;">$20B - $50B</label>
                    </div>
                    <div class="tt-checkbox-wrap worth-level_3">
                        <input type="checkbox" name="shares" id="level_3" value="level_3">
                        <label for="level_3" class="legend-worth" style="border-color: #7be12e;">$50B - $100B</label>
                    </div>
                    <div class="tt-checkbox-wrap worth-other">
                        <input type="checkbox" name="shares" id="other" value="other">
                        <label for="other" class="legend-worth" style="border-color: transparent;">$100B+</label>
                    </div>
                </div>
            </div>
            <div class="filter-wrap" id="forecast-filter">
                <div class="filter-heading">Forecast</div>
                <div class="filter-multi-wrap">
                    <div class="tt-checkbox-wrap">
                        <input type="checkbox" name="forecast" id="very_good" value="very_good">
                        <label for="very_good" class="legend-forecast forecast-very_good">Very Good</label>
                    </div>
                    <div class="tt-checkbox-wrap">
                        <input type="checkbox" name="forecast" id="good" value="good">
                        <label for="good" class="legend-forecast forecast-good">Good</label>
                    </div>
                    <div class="tt-checkbox-wrap">
                        <input type="checkbox" name="forecast" id="average" value="average">
                        <label for="average" class="legend-forecast forecast-average">Average</label>
                    </div>
                    <div class="tt-checkbox-wrap">
                        <input type="checkbox" name="forecast" id="poor" value="poor">
                        <label for="poor" class="legend-forecast forecast-poor">Poor</label>
                    </div>
                    <div class="tt-checkbox-wrap">
                        <input type="checkbox" name="forecast" id="very_poor" value="very_poor">
                        <label for="very_poor" class="legend-forecast forecast-very_poor">Very Poor</label>
                    </div>
                </div>
            </div>
            <div class="filter-wrap" id="extra-filter">
                <div class="filter-subwrap">
                    <div class="filter-heading">Name</div>
                    <div class="tt-input-wrap" id="name-filter"><label for="name">Name: </label><input type="text" id="name"></div>
                </div>
                ${
					isPortfolio
						? ` 
                <div class="filter-subwrap" id="profit-filter">
                    <div class="filter-heading">Profit / Loss</div>
                    <div class="filter-multi-wrap" id="profit-filter">
                        <div class="tt-checkbox-wrap"><input type="checkbox" id="profit" value="profit"><label for="profit">Profit</label></div>
                        <div class="tt-checkbox-wrap"><input type="checkbox" id="loss" value="loss"><label for="loss">Loss</label></div>
                    </div>
                </div>
                <div class="filter-subwrap">
                    <div class="filter-heading">Listed</div>
                    <div class="filter-multi-wrap" id="profit-filter">
                    	<div class="tt-checkbox-wrap" id="listed-filter">
                    		<input type="checkbox" id="listed" value="listed"><label for="listed">Listed</label>
                    	</div>
                    </div>
                </div>
                `
						: ""
				}
            </div>
        </div>
    `;

	const filterPage = isPortfolio ? "portfolio" : "market";

	for (let checkbox of filterContainer.findAll("#tt-stock-filter input[type='checkbox']")) {
		checkbox.onclick = applyFilters;
	}
	doc.find(`#extra-filter #name-filter input`).oninput = applyFilters;

	// Initializing
	for (let state of filters.stock_exchange[filterPage].worth) {
		doc.find(`#worth-filter input[type='checkbox'][value='${state}']`).checked = true;
	}
	for (let state of filters.stock_exchange[filterPage].forecast) {
		doc.find(`#forecast-filter input[type='checkbox'][value='${state}']`).checked = true;
	}
	if (isPortfolio) {
		for (let state of filters.stock_exchange[filterPage].profitLoss) {
			doc.find(`#extra-filter #profit-filter input[type='checkbox'][value='${state}']`).checked = true;
		}

		doc.find(`#extra-filter #listed-filter input`).value = filters.stock_exchange[filterPage].listedOnly;
	}
	doc.find(`#extra-filter #name-filter input`).value = filters.stock_exchange[filterPage].name;

	applyFilters();

	function applyFilters() {
		let worth = [];
		let forecast = [];
		let profitLoss = [];
		let listedOnly;

		// Worth
		for (let checkbox of doc.findAll("#worth-filter input[type='checkbox']:checked")) {
			worth.push(checkbox.getAttribute("value"));
		}
		// Forecast
		for (let checkbox of doc.findAll("#forecast-filter input[type='checkbox']:checked")) {
			forecast.push(checkbox.getAttribute("value"));
		}
		const name = doc.find("#extra-filter #name-filter input").value;
		if (isPortfolio) {
			for (let checkbox of doc.findAll("#extra-filter #profit-filter input[type='checkbox']:checked")) {
				profitLoss.push(checkbox.getAttribute("value"));
			}
			listedOnly = doc.find("#extra-filter #listed-filter input").checked;
		}

		// Filtering
		for (let stock of doc.findAll(".stock-list > .item, .portfolio-list-shares > li.item-wrap")) {
			const stockId = isPortfolio
				? stock
						.find(".logo > a")
						.getAttribute("href")
						.match(/&ID=([0-9]*)/i)[1]
				: stock.firstElementChild.getAttribute("action").split("ID=")[1];

			const data = torndata.stocks[stockId];

			if (data.acronym === "TCSE" && (worth.length || forecast.length)) {
				stock.classList.add("filter-hidden");
				continue;
			}

			// Worth
			if (worth.length) {
				const availableWorth = parseInt(data.available_shares) * parseFloat(data.current_price);

				let foundWorth = false;
				for (let w of worth) {
					switch (w) {
						case "no_shares":
							foundWorth = availableWorth === 0;
							break;
						case "level_1":
							foundWorth = availableWorth > 0 && availableWorth <= 20e9;
							break;
						case "level_2":
							foundWorth = availableWorth > 20e9 && availableWorth <= 50e9;
							break;
						case "level_3":
							foundWorth = availableWorth > 50e9 && availableWorth <= 100e9;
							break;
						case "other":
							foundWorth = availableWorth > 100e9;
							break;
					}

					if (foundWorth) break;
				}

				if (!foundWorth) {
					stock.classList.add("filter-hidden");
					continue;
				}
			}

			// Forecast
			if (forecast.length && !forecast.includes(data.forecast.toLowerCase().replace(" ", "_"))) {
				stock.classList.add("filter-hidden");
				continue;
			}

			// Input
			if (name) {
				let found = false;

				for (let search of name.split(",")) {
					search = search.trim().toLowerCase();
					if (!search) continue;

					if (data.acronym.toLowerCase().includes(search) || data.name.toLowerCase().includes(search)) {
						found = true;
						break;
					}
				}

				if (!found) {
					stock.classList.add("filter-hidden");
					continue;
				}
			}

			if (isPortfolio) {
				const changeClasses = stock.find(".length-wrap .second-row .prop-wrap .change").classList;

				// profit or loss
				if (
					profitLoss &&
					profitLoss.length &&
					!((profitLoss.includes("profit") && changeClasses.contains("up")) || (profitLoss.includes("loss") && changeClasses.contains("down")))
				) {
					stock.classList.add("filter-hidden");
					continue;
				}

				if (listedOnly && !stock.classList.contains("remove")) {
					stock.classList.add("filter-hidden");
					continue;
				}
			}

			stock.classList.remove("filter-hidden");
		}

		let filter = {
			forecast,
			worth,
			name,
		};
		if (isPortfolio) {
			filter.profitLoss = profitLoss;
			filter.listedOnly = listedOnly;
		}

		ttStorage.change({ filters: { stock_exchange: { [filterPage]: filter } } });
	}
}

function stockProfileLoaded() {
	return requireElement(".item-wrap .stock-list .profile-wrap[style*='display: block;'] .tabs-title, .item .acc-body[style*='display: block;'] .tabs-title");
}

function getDiffClass(diff) {
	if (diff > 0) return "up";
	else if (diff < 0) return "down";
	else return "";
}
