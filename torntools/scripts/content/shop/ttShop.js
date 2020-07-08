DBloaded().then(function(){
	shopLoaded().then(function(){
        console.log("TT - Shop");

        // Shop profits
        if(settings.pages.shop.profits){
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
        }

        // Max buy button
        for(let buy_btn of doc.findAll("span.buy-act")){
            let max_span = doc.new({type: "span", text: "fill max", class: "tt-max-buy bold"});
            buy_btn.appendChild(max_span);

            max_span.addEventListener("click", function(event){
                event.stopPropagation();

                let max = parseInt(buy_btn.parentElement.parentElement.find(".instock").innerText.replace(/,/g, ""));
                let price = parseInt(buy_btn.parentElement.parentElement.find(".price").innerText.replace(/,/g, "").replace("$",""));
                let user_money = doc.find("#user-money").innerText.replace(/,/g, "").replace("$","");
                
                max = max > 100 ? 100:max;
                max = Math.floor(user_money/price) < max ? Math.floor(user_money/price) : max;
                
                buy_btn.parentElement.find("input").value = max;
            });
        }
    });
});

function shopLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find("span.item")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}