window.addEventListener('load', (event) => {
    console.log("TT - Shop");

    if(flying())
        return

    chrome.storage.local.get(["settings", "itemlist"], function(data) {
		const itemlist = data.itemlist;
		const show_shop = data.settings.pages.shop.show;

        if(!show_shop)
            return

		displayItemProfits(itemlist);
    });
});

function displayItemProfits(itemlist){
    let items_in_store = document.querySelectorAll(".buy-items-wrap .items-list li:not(.empty):not(.clear)");

    for(let item of items_in_store){
        let item_id = item.querySelector(".item-desc .item").getAttribute("itemid");
        let name = item.querySelector(".item-desc .name").innerText;
        let buy_price = parseInt(item.querySelector(".item-desc .price").innerText.replace("$", "").replace(/,/g, ""));
        // console.log(name+':', price);

        let market_price = itemlist.items[item_id].market_value;

        let profit = (market_price/buy_price*100).toFixed(0);

        let negative = false;
        if(buy_price > market_price)
            negative = true;

        // console.log(name+":", profit);

        let span = document.createElement("span");
        span.style.float = "right";
        span.setAttribute("style", `
            float: right;
            font-weight: 400;
            font-size: 11px;
        `);
        negative ? span.style.color = "#de0000" : span.style.color = "#00a500";
        span.innerText = `${numberWithCommas(profit)}%`
        
        let triangle_div = document.createElement("div");
        triangle_div.setAttribute("style", `
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            float: left;
            position: relative;
            top: 5px;
            margin-right: 2px;
        `);
        
        negative ? triangle_div.style.borderTop = "8px solid #de0000" : triangle_div.style.borderBottom = "8px solid #00a500";

        span.appendChild(triangle_div);
        item.querySelector(".item-desc .name").appendChild(span);
    }
}