DBloaded().then(function(){
    rewardsLoaded().then(function(){
        console.log("TT - Missions");

        if(!settings.pages.missions.rewards){
            return;
        }

        let user_points = parseInt(doc.find(".total-mission-points").innerText.replace(",", ""));
        let reward_items = doc.findAll(".rewards-list li");
        
        for(let item of reward_items){
            let info = JSON.parse(item.getAttribute("data-ammo-info"));
            let item_id = info.image;
            let price_points = info.points;
            let quantity = info.amount;

            // Show if user can buy
            let actions_wrap = item.find(".act-wrap");
                actions_wrap.style.boxSizing = "border-box";
                actions_wrap.style.borderColor = "black";
                actions_wrap.style.borderImage = "none";

            if(user_points < price_points)
                actions_wrap.style.borderTop = "1px solid red";
            else
                actions_wrap.style.borderTop = "1px solid #2ef42e";

            if(!item_id || typeof item_id == "string")
                continue;

            let market_price = itemlist.items[item_id].market_value;
            item.style.height = "160px";  // to fit value info

            // Show one item price
            let one_item_price = doc.new("span");
                one_item_price.innerText = `$${numberWithCommas(market_price)}`;
                one_item_price.setClass("tt-one-item-price");

            item.find(".img-wrap").appendChild(one_item_price);

            // Show total & point value
            let value_div = doc.new("div");
            
            let div_total_value = doc.new({type: "div", text: "Total value: ", class: "tt-total-value"});
            if(mobile) div_total_value.style.marginTop = "66px";
            let span_total_value = doc.new("span");
                span_total_value.innerText = `$${numberWithCommas(quantity*market_price)}`;

            let div_point_value = doc.new("div");
                div_point_value.innerText = "Point value: ";
                div_point_value.setClass("tt-point-value");
            let span_point_value = doc.new("span");
                span_point_value.innerText = `$${numberWithCommas(((quantity*market_price)/price_points).toFixed())}`;

            div_total_value.appendChild(span_total_value);
            div_point_value.appendChild(span_point_value);
            value_div.appendChild(div_total_value);
            value_div.appendChild(div_point_value);
            actions_wrap.insertBefore(value_div, actions_wrap.find(".actions"));
        }
    });
});

function rewardsLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
           if(doc.find("ul.rewards-list li")){
                resolve(true);
                return clearInterval(checker);
           }
        }, 100);
    });
}