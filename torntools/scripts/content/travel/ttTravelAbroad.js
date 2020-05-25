window.addEventListener('load', async (event) => {
    console.log("TT - Travel (abroad)");

    if(await flying() || !(await abroad()))
        return;

	local_storage.get(["settings", "itemlist"], function([settings, itemlist]){
        if(settings.pages.travel.profits){
            displayItemProfits(itemlist.items);
        }

        updateYATAprices();
	});
});

function displayItemProfits(itemlist){
    let market = doc.find(".travel-agency-market");

    if(!market){
        console.log("No market");
        return;
    }

    // Table heading
    let headings = market.find(".items-list-title");
    let profit_heading = doc.new("div");
        profit_heading.innerText = "Profit";
        profit_heading.setClass("tt-travel-market-heading title-green");

    headings.insertBefore(profit_heading, headings.find(".stock-b"));

    // Table content
    let rows = doc.findAll(".users-list>li");
    for(let row of rows){
        let id = parseInt(row.find(".item img").getAttribute("src").split("items/")[1].split("/")[0]);
        let market_price = parseInt(itemlist[id].market_value);
        let buy_price = parseInt(row.find(".cost .c-price").innerText.replace("$", "").replace(/,/g, ""));
        let profit = (market_price/buy_price*100).toFixed(0);

        let span = doc.new("span");
            span.setClass("tt-travel-market-cell")
        let inner_span = doc.new("span");
            inner_span.innerText = `${profit}%`;

        let triangle_div = doc.new("div");
            triangle_div.setClass("tt-travel-price-indicator");

        if(buy_price > market_price){
            span.style.color = "#de0000";
            triangle_div.style.borderTop = "8px solid #de0000";
        } else if( buy_price < market_price){
            span.style.color = "#00a500";
            triangle_div.style.borderBottom = "8px solid #00a500"
        }

        inner_span.appendChild(triangle_div);
        span.appendChild(inner_span);
        row.find(".item-info-wrap").insertBefore(span, row.find(".item-info-wrap").find(".stock"));
    }
}

function updateYATAprices(){
    console.log("Updating YATA prices");

    let post_data = {
        "client": "TornTools",
        "version": chrome.runtime.getManifest().version,
        "author_name": "Mephiles",
        "author_id": 2087524,
        "country": getCountryName(),
        "items": {}
    }

    // Table content
    let rows = doc.findAll(".users-list>li");
    for(let row of rows){
        let id = parseInt(row.find(".item img").getAttribute("src").split("items/")[1].split("/")[0]);
        let quantity = parseInt(row.find(".stck-amount").innerText.replace(/,/g, ""));
        let price = parseInt(row.find(".cost .c-price").innerText.replace("$", "").replace(/,/g, ""));

        post_data.items[id] = {quantity: quantity, cost: price}
        // post_data.items.push({
        //     id: id,
        //     quantity: quantity,
        //     cost: price
        // });
    }

    console.log("POST DATA", post_data);
    fetch(`https://yata.alwaysdata.net/bazaar/abroad/import/`, {
        method: "POST", 
        headers: {"content-type": "application/json"}, 
        body: JSON.stringify(post_data)
    }).then(response => {
        console.log("RESPONSE", response);
    });

    function getCountryName(){
        return doc.find("#skip-to-content").innerText.slice(0, 3).toLowerCase();
    }
}