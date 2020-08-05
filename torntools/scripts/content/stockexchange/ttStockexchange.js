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
    for (let stock of doc.findAll(".stock-list > .item, .portfolio-list-shares > li.item-wrap")) {
        const stockId = isPortfolio ? stock.find(".logo > a").getAttribute("href").match(/&ID=([0-9]*)/i)[1] : stock.firstElementChild.getAttribute("action").split("ID=")[1];

        const data = torndata.stocks[stockId];

        if (data.acronym === "TCSE") continue;

        const classForecast = `forecast-${data.forecast.toLowerCase().replace(" ", "_")}`

        const availableWorth = parseInt(data.available_shares) * parseFloat(data.current_price);
        let classWorth;
        if (availableWorth === 0) classWorth = "worth-noshares";
        else if (availableWorth > 0 && availableWorth <= 20e9) classWorth = "worth-level_1";
        else if (availableWorth > 20e9 && availableWorth <= 50e9) classWorth = "worth-level_2";
        else if (availableWorth > 50e9 && availableWorth <= 100e9) classWorth = "worth-level_3";
        else classWorth = "worth-other";

        const parent = stock.firstElementChild;

        parent.classList.add(classForecast);
        parent.classList.add(classWorth);
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
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap worth-noshares"><input type="checkbox" value="no_shares">No Shares</div>
                    <div class="tt-checkbox-wrap worth-level_1"><input type="checkbox" value="level_1">$0B - $20B</div>
                    <div class="tt-checkbox-wrap worth-level_2"><input type="checkbox" value="level_2">$20B - $50B</div>
                    <div class="tt-checkbox-wrap worth-level_3"><input type="checkbox" value="level_3">$50B - $100B</div>
                    <div class="tt-checkbox-wrap worth-other"><input type="checkbox" value="other">$100B+</div>
                </div>
            </div>
            <div class="filter-wrap" id="forecast-filter">
                <div class="filter-heading">Forecast</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap forecast-very_good"><input type="checkbox" value="very_good">Very Good</div>
                    <div class="tt-checkbox-wrap forecast-good"><input type="checkbox" value="good">Good</div>
                    <div class="tt-checkbox-wrap forecast-average"><input type="checkbox" value="average">Average</div>
                    <div class="tt-checkbox-wrap forecast-poor"><input type="checkbox" value="poor">Poor</div>
                    <div class="tt-checkbox-wrap forecast-very_poor"><input type="checkbox" value="very_poor">Very Poor</div>
                </div>
            </div>
            <div class="filter-wrap" id="exta-filter">
                <div class="filter-heading">Other</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    Coming Soon
                </div>
            </div>
        </div>
    `;

    for (let checkbox of filterContainer.findAll("#tt-stock-filter input[type='checkbox']")) {
        checkbox.onclick = applyFilters;
    }

    // Initializing
    for (let state of filters.stock_exchange.worth) {
        doc.find(`#worth-filter input[type='checkbox'][value='${state}']`).checked = true;
    }
    for (let state of filters.stock_exchange.forecast) {
        doc.find(`#forecast-filter input[type='checkbox'][value='${state}']`).checked = true;
    }

    applyFilters();

    function applyFilters() {
        let worth = [];
        let forecast = [];

        // Worth
        for (let checkbox of doc.findAll("#worth-filter input[type='checkbox']:checked")) {
            worth.push(checkbox.getAttribute("value"));
        }
        // Forecast
        for (let checkbox of doc.findAll("#forecast-filter input[type='checkbox']:checked")) {
            forecast.push(checkbox.getAttribute("value"));
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

            stock.classList.remove("filter-hidden");
        }

        ttStorage.change({
            "filters": {
                "stock_exchange": {
                    forecast,
                    worth,
                }
            }
        });
    }
}
