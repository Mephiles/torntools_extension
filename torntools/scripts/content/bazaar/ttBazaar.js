bazaarLoaded().then(function(){
    console.log("TT - Bazaar");

    if(visiting()){
        console.log("visiting");
        // // Shop profits
        // if(settings.pages.shop.profits){
        //     let items = doc.findAll(".buy-items-wrap .items-list li:not(.empty):not(.clear)");
        //     for(let item of items){
        //         let id = item.find(".item-desc .item").getAttribute("itemid");
        //         let buy_price = parseInt(item.find(".item-desc .price").innerText.replace("$", "").replace(/,/g, ""));
        //         let market_price = itemlist.items[id].market_value;
        //         let profit = (market_price/buy_price*100).toFixed(0);
        
        //         let span = doc.new("span");
        //             span.setClass("tt-shop-price");
        //             span.innerText = `${numberWithCommas(profit)}%`;
        
        //         let triangle_div = doc.new("div");
        //             triangle_div.setClass("tt-shop-price-indicator");
        
        //         if(buy_price > market_price){
        //             span.style.color = "#de0000";
        //             triangle_div.style.borderTop = "8px solid #de0000";
        //         } else if( buy_price < market_price){
        //             span.style.color = "#00a500";
        //             triangle_div.style.borderBottom = "8px solid #00a500"
        //         }
        
        //         span.appendChild(triangle_div);
        //         item.find(".item-desc .name").appendChild(span);
        //     }
        // }

        // Bazaar worth
        if(settings.pages.bazaar.worth){
            let bazaar_user_id = getSearchParameters().userId;
            get_api(`https://api.torn.com/user/${bazaar_user_id}?selections=bazaar`, api_key)
            .then(function(result){
                let total = 0;
    
                for(let item in result.bazaar){
                    total += result.bazaar[item].market_price * result.bazaar[item].quantity;
                }
    
                let div = doc.new({type: "div", class: "tt-bazaar-text", text: `This bazaar is worth `});
                let span = doc.new({type: "span", class: "tt-money", text: `$${numberWithCommas(total, false)}`});
    
                div.appendChild(span);
                doc.find(".info-msg-cont .msg").appendChild(div);
            });
        }

        // Highlight item
        let params = getSearchParameters();
        if(params.tt_itemid){
            let item_id = params.tt_itemid;
            let item_price = params.tt_itemprice;
            let item_name = itemlist.items[item_id].name;

            let found_item = false;
            for(let item of doc.findAll(".item___2GvHm")){
                if(item.find(".name___IJ_Q-").innerText.trim() == item_name && 
                item.find(".price___8AdTw").innerText.replace("$", "").replace(/,/g, "") == item_price){
                    found_item = true;

                    item.style.backgroundColor = "rgba(177, 206, 130, 0.5)";
                    flashColor(item, "background", "slow", 0.2, 1);
                    break;
                }
            }

            if(!found_item){
                let div = doc.new({type: "div", class: "tt-bazaar-text bold", text: `[${item_name}] `});
                let span = doc.new({type: "span", class: "not-bold", text: `Could not find item. Please try using the Search function.`});
    
                div.appendChild(span);
                doc.find(".info-msg-cont .msg").appendChild(div);
            }
        }
    
        // Max buy button
        document.addEventListener("click", function(event){
            if(event.target.classList.contains("controlPanelButton___3mqHY") && event.target.getAttribute("aria-label").indexOf("Buy") > -1){
                let parent = doc.find(".buyMenu____p9jd").parentElement;

                let max_span = doc.new({type: "span", text: "fill max", class: "tt-max-buy bold"});
                parent.find(".buy___C9yzh").parentElement.appendChild(max_span);
        
                max_span.addEventListener("click", function(event){
                    event.stopPropagation();
                    let max = parent.find(".buyAmountInput___Aooaf").max;
                    let price = parseInt(parent.find(".price___3p35J").innerText.replace(/,/g, "").replace("$",""));
                    let user_money = doc.find("#user-money").innerText.replace(/,/g, "").replace("$","");
                    
                    max = Math.floor(user_money/price) < max ? Math.floor(user_money/price) : max;

                    parent.find(".buyAmountInput___Aooaf").value = max;

                    // for value to be accepted
                    parent.find(".buyAmountInput___Aooaf").dispatchEvent(new Event("input", {bubbles: true}));
                });
            }
        });
    }
});

function bazaarLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".item___2GvHm")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function visiting(){
    if(window.location.search.indexOf("userId") > -1){
        return true;
    }
    return false;
}