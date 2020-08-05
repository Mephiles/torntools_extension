requireDatabase().then(function () {
    stocksLoaded().then(function () {
        console.log("TT - Stock Exchange");

        const isPortfolio = getSearchParameters().get("step") === "portfolio";

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

