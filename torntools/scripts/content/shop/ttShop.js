window.addEventListener('load', async (event) => {
    console.log("TT - Shop");

    if(await flying())
        return

    local_storage.get(["settings", "itemlist"], function([settings, itemlist]) {
        if(!settings.pages.shop.show)
            return;

        let items = doc.findAll(".buy-items-wrap .items-list li:not(.empty):not(.clear)");
        for(let item of items){
            let id = item.find(".item-desc .item").getAttribute("itemid");
            let buy_price = parseInt(item.find(".item-desc .price").innerText.replace("$", "").replace(/,/g, ""));
            let market_price = itemlist.items[id].market_value;
            let profit = (market_price/buy_price*100).toFixed(0);

            let span = doc.new("span");
                span.setClass("tt-shop-price");
                span.innerText = `${numberWithCommas(profit)}%`;

            let triangle_div = doc.new("div");
                triangle_div.setClass("tt-shop-price-indicator");

            if(buy_price > market_price){
                span.style.color = "#de0000";
                triangle_div.style.borderTop = "8px solid #de0000";
            } else if( buy_price < market_price){
                span.style.color = "#00a500";
                triangle_div.style.borderBottom = "8px solid #00a500"
            }

            span.appendChild(triangle_div);
            item.find(".item-desc .name").appendChild(span);
        }
    });
});