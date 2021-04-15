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

		hideStockBlocks();

		if (settings.pages.stockexchange.advanced) addFilter(filters);

		showTotalPortfolioValue();
	});
});

function stocksLoaded() {
	return requireElement("#stockmarketroot [class*='stockMarket__'] [class*='stock__']");
}

function addFilter(filters) {
	if (doc.find("#tt-stock-filter")) return;

	const filterContainer = content
		.newContainer("Filters", {
			id: "tt-stock-filter",
			_class: "portfolio",
			next_element: doc.find("#stockmarketroot ul.title-black"),
		})
		.find(".content");

	filterContainer.innerHTML = `
        <div class="filter-content">
			<div class="filter-wrap" id="owned-filter">
				<div class="filter-subwrap">
                    <div class="filter-heading">Show owned</div>
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="owned-yes" value="yes">
						<label for="yes">Yes</label>
					</div>
                </div>
			</div>
			<div class="filter-wrap" id="benefit-filter">
				<div class="filter-subwrap">
                    <div class="filter-heading">Show benefit blocks</div>
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="benefit-yes" value="yes">
						<label for="yes">Yes</label>
					</div>
                </div>
			</div>
            <div class="filter-wrap" id="extra-filter">
                <div class="filter-subwrap">
                    <div class="filter-heading">Name</div>
                    <div class="tt-input-wrap" id="name-filter">
						<input type="text" id="name">
					</div>
                </div>
            </div>
			<div class="filter-wrap" id="change-filter">
                <div class="filter-heading">Price Up / Down</div>
                <div class="filter-multi-wrap" id="change-filter">
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="up" value="up">
						<label for="up">Up</label>
					</div>
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="down" value="down">
						<label for="down">Down</label>
					</div>
                </div>
            </div>
			<div class="filter-wrap" id="total-profit-filter">
                <div class="filter-heading">Total Profit / Loss</div>
                <div class="filter-multi-wrap" id="total-profit-filter">
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="profit" value="profit">
						<label for="profit">Profit</label>
					</div>
                    <div class="tt-checkbox-wrap">
						<input type="checkbox" id="loss" value="loss">
						<label for="loss">Loss</label>
					</div>
                </div>
            </div>
        </div>
    `;

	for (let checkbox of filterContainer.findAll("#tt-stock-filter input[type='checkbox']")) {
		checkbox.onclick = applyFilters;
	}
	filterContainer.find(`#extra-filter #name-filter input`).oninput = applyFilters;

	// Initializing
	for (let state of filters.stock_exchange.change) {
		filterContainer.find(`#change-filter input[type='checkbox'][value='${state}']`).checked = true;
	}
	for (let state of filters.stock_exchange.totalProfitLoss) {
		filterContainer.find(`#total-profit-filter input[type='checkbox'][value='${state}']`).checked = true;
	}
	if (filters.stock_exchange.owned) filterContainer.find("#owned-filter input").checked = true;
	if (filters.stock_exchange.benefit) filterContainer.find("#benefit-filter input").checked = true;

	filterContainer.find(`#extra-filter #name-filter input`).value = filters.stock_exchange.name;

	applyFilters();

	function applyFilters() {
		let change = [];
		let totalProfitLoss = [];
		let owned, benefit;

		const name = doc.find("#extra-filter #name-filter input").value;
		for (let checkbox of doc.findAll("#change-filter input[type='checkbox']:checked")) {
			change.push(checkbox.getAttribute("value"));
		}
		for (let checkbox of doc.findAll("#total-profit-filter input[type='checkbox']:checked")) {
			totalProfitLoss.push(checkbox.getAttribute("value"));
		}
		owned = doc.find("#tt-stock-filter #owned-filter input[type='checkbox']").checked;
		benefit = doc.find("#tt-stock-filter #benefit-filter input[type='checkbox']").checked;

		// Filtering
		for (let stock of doc.findAll("#stockmarketroot [class*='stockMarket__'] > *:not(#panel-InfoTab, #panel-ManagerTab)")) {
			const stockAcronym = stock.find("[class*='logoContainer__'] img").src.split("/").pop().replace(".svg", "");
			const stockID = torndata.stocks.findIndex((stockEntry) => {
				return stockEntry.acronym === stockAcronym;
			});
			const data = torndata.stocks[stockID];
			const userStockData = userdata.stocks.filter((x) => {
				return x.stock_id === stockID + 1;
			})[0];

			// Owned
			if (owned && stock.find("[class*='stockOwned__'] [class*='count__']").innerText === "None") {
				stock.classList.add("filter-hidden");
				continue;
			}

			// Benefit
			if (benefit && stock.find("#DividendTab [class*='dividendInfo'] > p:nth-of-type(2)").innerText === "Inactive") {
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

			const stockChangeClassName = stock.find("[class*='changePrice___'] > *").className;

			// Change
			if (
				change &&
				change.length &&
				!(
					(change.includes("up") && stockChangeClassName.includes("up")) ||
					(change.includes("down") && stockChangeClassName.includes("down"))
				)
			) {
				stock.classList.add("filter-hidden");
				continue;
			}

			// Total profit or loss
			if (totalProfitLoss.length && userStockData) { // If owned only
				let stockTransactions = Object.keys(userStockData.transactions);
				let lastTransaction = userStockData.transactions[stockTransactions[stockTransactions.length - 1]];
				let profitOrLoss = Math.floor(((data.current_price - lastTransaction.bought_price) * lastTransaction.shares));
				if (!(
					(totalProfitLoss.includes("profit") && profitOrLoss > 0) || (totalProfitLoss.includes("loss") && profitOrLoss < 0)
				)) {
					stock.classList.add("filter-hidden");
					continue;
				}
			} else if (totalProfitLoss.length && !userStockData) {
				stock.classList.add("filter-hidden");
				continue;
			}

			stock.classList.remove("filter-hidden");
		}

		let filter = {
			owned: owned,
			name: name,
			change: change,
			totalProfitLoss: totalProfitLoss,
			benefit: benefit,
		};

		ttStorage.change({ filters: { stock_exchange: filter } });
	}
}

function stockProfileLoaded() {
	return requireElement(".item-wrap .stock-list .profile-wrap[style*='display: block;'] .tabs-title, .item .acc-body[style*='display: block;'] .tabs-title");
}

function showTotalPortfolioValue() {
	const totalValue = [...doc.findAll("[class*='stockOwned__'] [class*='value__']")]
		.map((x) => parseInt(x.innerText.replace(/[$,]/g, "").trim()))
		.reduce((a, b) => (a += b), 0);
	const profits = [...doc.findAll("#stockmarketroot [class*='stockMarket__'] > *:not(#panel-InfoTab, #panel-ManagerTab)")]
		.map((x) => {
			const stockAcronym = x.find("[class*='logoContainer__'] img").src.split("/").pop().replace(".svg", "");
			const stockID = torndata.stocks.findIndex((stockEntry) => {
				return stockEntry.acronym === stockAcronym;
			});
			const data = torndata.stocks[stockID];
			const userStockData = userdata.stocks.filter((x) => {
				return x.stock_id === stockID + 1;
			})[0];
			if (!userStockData) return 0;
			let stockTransactions = Object.keys(userStockData.transactions);
			let lastTransaction = userStockData.transactions[stockTransactions[stockTransactions.length - 1]];
			let profitOrLoss = Math.floor(((data.current_price - lastTransaction.bought_price) * lastTransaction.shares));
			return profitOrLoss;
		})
		.reduce((a, b) => (a += b), 0);

	let rawText;
	if (profits > 0) rawText = `Profit: <span style="color: #678c00;">+$${numberWithCommas(profits)}</span>`;
	else if (profits < 0) rawText = `Loss: <span style="color: red;">-$${numberWithCommas(Math.abs(profits))}</span>`;

	doc.find("div.content-title h4").appendChild(
		doc.new({
			type: "span",
			attributes: { style: "font-weight: 400;color: #999999;" },
			html: ` ( Value: <span style="color: #678c00;">$${numberWithCommas(totalValue)}</span> | ${rawText} )`,
		})
	);
}

function hideStockBlocks() {
	if (hide_stock_blocks.length) {
		for (let hideStockBlock of hide_stock_blocks) {
			doc.find(`div.stock-main-wrap li.item.item-wrap[data-stock=${hideStockBlock.toLowerCase()}]`).style.display = "none";
		}
		let rawHTML =
			'<div class="info-msg-cont gray border-round m-top10"><div class="info-msg border-round" style="background-color: #627e0d;"><i class="info-icon"></i><div class="delimiter"><div class="msg right-round" style="background-color: #627e0d;color: #627e0d;">Some stock blocks have been disabled by TornTools. Please re-enable them in Settings.</div></div></div></div>';
		doc.find("div.stock-main-wrap div.title-black").insertAdjacentHTML("beforeBegin", rawHTML);
	}
}
