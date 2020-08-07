let isPortfolio;

requireDatabase().then(function () {
    stocksLoaded().then(function () {
        console.log("TT - Stock Exchange");

        isPortfolio = getSearchParameters().get("step") === "portfolio";

        if (isPortfolio) {

        } else {
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
            try {
                showInformation();

                addFilter(filters);
            } catch (e) {
                console.error("DKK error", e);
            }
        }

    });
});

function stocksLoaded() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (doc.find(".stock-list .item, .portfolio-list-shares > .item-wrap")) {
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function showInformation() {
    try {
        for (let stock of doc.findAll(".stock-list > .item, .portfolio-list-shares > li.item-wrap")) {
            const stockId = isPortfolio ? stock.find(".logo > a").getAttribute("href").match(/&ID=([0-9]*)/i)[1] : stock.firstElementChild.getAttribute("action").split("ID=")[1];

            const data = torndata.stocks[stockId];

            if (isPortfolio) {
                const amount = parseInt(stock.find(".b-price-wrap > .first-row").innerText.split(": ")[1].replaceAll(",", ""));
                const boughtPrice = parseFloat(stock.find(".c-price-wrap > .second-row > .prop-wrap").innerText.split(": $")[1].replaceAll(",", ""));
                const currentPrice = parseInt(stock.find(".c-price-wrap > .first-row").innerText.split(": $")[1].replaceAll(",", ""));

                let buyPrice = parseInt(boughtPrice * amount);
                let profit = parseInt(currentPrice - buyPrice);

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
                    blockText += `You bought at $<span class="bold">${numberWithCommas(buyPrice, false)}</span> worth and <span class="block-wording">${profitClass}</span> <span class="bold block-${profitClass}">${profitChar} $${numberWithCommas(Math.abs(profit), false)}</span>`
                } else {
                    blockText += `Bought $<span class="bold">${numberWithCommas(buyPrice, false)}</span> / <span class="block-wording">${profitClass}</span> <span class="bold block-${profitClass}">${profitChar} $${numberWithCommas(Math.abs(profit), false)}</span>`
                }

                if (data.acronym === "MCS") {
                    console.log("DKK MCS 1", amount);
                    console.log("DKK MCS 2", boughtPrice);
                    console.log("DKK MCS 3", currentPrice);
                    console.log("DKK MCS 4", buyPrice);
                    console.log("DKK MCS 5", profit);
                }

                stock.find(".qualify-wrap").innerHTML = blockText;
            } else {
                const owned = parseInt(stock.find(".owned").innerText.split("\n")[1].replaceAll(",", ""));

                if (owned > 0) {
                    const price = parseFloat(stock.find(".price").innerText.split("\n$")[1].replaceAll(",", ""));

                    const worth = parseInt(price * owned);

                    stock.find(".owned").classList.add("tt-modified");
                    stock.find(".owned").innerHTML += `<br/><span color="cyan">$${numberWithCommas(worth, false)}</span>`;
                }
            }

            if (data.acronym !== "TCSE") {
                const classForecast = `forecast-${data.forecast.toLowerCase().replace(" ", "_")}`

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
            }
        }
    } catch (e) {
        console.log("DKK error 2", e)
    }
}

function addFilter(filters) {
    if (doc.find("#tt-stock-filter")) return;

    const filterContainer = content.newContainer("Filters", {
        id: "tt-stock-filter",
        class: "filter-container",
        next_element: doc.find(".stock-main-wrap").firstElementChild,
    }).find(".content");

    filterContainer.innerHTML = `
        <div class="filter-content ${mobile ? "tt-mobile" : ""}">
            <div class="filter-wrap" id="worth-filter">
                <div class="filter-heading">Worth</div>
                <div class="filter-multi-wrap ${mobile ? "tt-mobile" : ""}">
                    <div class="tt-checkbox-wrap worth-noshares"><input type="checkbox" value="no_shares">No Shares</div>
                    <div class="tt-checkbox-wrap worth-level_1"><input type="checkbox" value="level_1">$0B - $20B</div>
                    <div class="tt-checkbox-wrap worth-level_2"><input type="checkbox" value="level_2">$20B - $50B</div>
                    <div class="tt-checkbox-wrap worth-level_3"><input type="checkbox" value="level_3">$50B - $100B</div>
                    <div class="tt-checkbox-wrap worth-other"><input type="checkbox" value="other">$100B+</div>
                </div>
            </div>
            <div class="filter-wrap" id="forecast-filter">
                <div class="filter-heading">Forecast</div>
                <div class="filter-multi-wrap ${mobile ? "tt-mobile" : ""}">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="very_good">Very Good</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="good">Good</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="average">Average</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="poor">Poor</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="very_poor">Very Poor</div>
                </div>
            </div>
            <div class="filter-wrap" id="extra-filter">
                <div class="filter-subwrap">
                    <div class="filter-heading">Name</div>
                    <div class="tt-input-wrap" id="name-filter">Name: <input type="text" style="width: 50px;"></div>
                </div>
                ${isPortfolio ? ` 
                <div class="filter-subwrap" id="profit-filter">
                    <div class="filter-heading">Profit / Loss</div>
                    <div class="filter-multi-wrap ${mobile ? "tt-mobile" : ""}" id="profit-filter">
                        <div class="tt-checkbox-wrap"><input type="checkbox" value="profit">Profit</div>
                        <div class="tt-checkbox-wrap"><input type="checkbox" value="loss">Loss</div>
                    </div>
                </div>
                <div class="filter-subwrap">
                    <div class="filter-heading">Listed</div>
                    <div class="tt-checkbox-wrap" id="listed-filter"><input type="checkbox" value="listed">Listed</div>
                </div>
                ` : ""}
            </div>
        </div>
    `;

    for (let checkbox of filterContainer.findAll("#tt-stock-filter input[type='checkbox']")) {
        checkbox.onclick = applyFilters;
    }
    doc.find(`#extra-filter #name-filter input`).oninput = applyFilters;

    // Initializing
    for (let state of filters.stock_exchange.worth) {
        doc.find(`#worth-filter input[type='checkbox'][value='${state}']`).checked = true;
    }
    for (let state of filters.stock_exchange.forecast) {
        doc.find(`#forecast-filter input[type='checkbox'][value='${state}']`).checked = true;
    }
    if (isPortfolio) {
        for (let state of filters.stock_exchange.profitLoss) {
            doc.find(`#extra-filter #profit-filter input[type='checkbox'][value='${state}']`).checked = true;
        }

        doc.find(`#extra-filter #listed-filter input`).value = filters.stock_exchange.listedOnly;
    }
    doc.find(`#extra-filter #name-filter input`).value = filters.stock_exchange.name;

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
        const name = doc.find(`#extra-filter #name-filter input`).value;
        if (isPortfolio) {
            for (let checkbox of doc.findAll("#extra-filter #profit-filter input[type='checkbox']:checked")) {
                profitLoss.push(checkbox.getAttribute("value"));
            }
            listedOnly = doc.find(`#extra-filter #listed-filter input`).checked;
        }

        // Filtering
        for (let stock of doc.findAll(".stock-list > .item, .portfolio-list-shares > li.item-wrap")) {
            const stockId = isPortfolio ? stock.find(".logo > a").getAttribute("href").match(/&ID=([0-9]*)/i)[1] : stock.firstElementChild.getAttribute("action").split("ID=")[1];

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
            if (name && !(data.acronym.toLowerCase().includes(name.toLowerCase()) || data.name.toLowerCase().includes(name.toLowerCase()))) {
                stock.classList.add("filter-hidden");
                continue;
            }

            if (isPortfolio) {
                const changeClasses = stock.find(".length-wrap .second-row .prop-wrap .change").classList;

                // profit or loss
                if (profitLoss && profitLoss.length &&
                    !((profitLoss.includes("profit") && changeClasses.contains("up")) ||
                        (profitLoss.includes("loss") && changeClasses.contains("down")))) {
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

        ttStorage.change({
            "filters": {
                "stock_exchange": {
                    forecast,
                    worth,
                    name,
                    profitLoss,
					listedOnly,
                }
            }
        });
    }
}
