window.addEventListener('load', async (event) => {
    console.log("TT - Travel (home)");

    if(await flying() || await abroad())
        return;

	local_storage.get(["settings", "itemlist", "userdata"], function([settings, itemlist, userdata]){
        console.log(userdata);
        if(settings.pages.travel.destination_table)
            displayItemValuesList(itemlist.items, userdata);
	});
});

function displayItemValuesList(itemlist, userdata){
    let item_dict = {  // time - minutes
        "argentina": {
            time: 167,
            cost: 21000,
            items: [269, 271, 199, 196, 204, 198, 203]
        },
        "canada": {
            time: 41,
            cost: 9000,
            items: [261, 263, 197, 196, 201, 205, 206]
        },
        "cayman islands": {
            time: 35,
            cost: 10000,
            items: [618, 617]
        },
        "china": {
            time: 242,
            cost: 35000,
            items: [274, 276, 199, 197, 204, 200, 201]
        },
        "hawaii": {
            time: 134,
            cost: 11000,
            items: [264]
        },
        "japan": {
            time: 225,
            cost: 32000,
            items: [277, 197, 206, 204, 200, 198, 203, 205]
        },
        "mexico": {
            time: 26,
            cost: 6500,
            items: [258, 260]
        },
        "south africa": {
            time: 297,
            cost: 40000,
            items: [206, 281, 282, 199, 200, 201, 203]
        },
        "switzerland": {
            time: 175,
            cost: 27000,
            items: [273, 272, 199, 196, 204, 198, 201, 203]
        },
        "uae": {
            time: 271,
            cost: 32000,
            items: [384, 385]
        },
        "united kingdom": {
            time: 159,
            cost: 18000,
            items: [268, 266, 267, 197, 196, 198, 201, 203, 205, 206]
        }
    }

    let item_prices = {
        "xanax": {
            "canada": 0
        }
    }

    let airstrip = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "AIRSTRIP" ? true : false;
    let wlt = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "PRIVATE" ? true : false;
    let business = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "BUSINESS" ? true : false;
    let suitcase = (function(){
        for(let perk of userdata.enhancer_perks){
            if(perk.indexOf("(Large Suitcase)") > -1){
                return 4;
            } else if(perk.indexOf("(Medium Suitcase)") > -1){
                return 3;
            } else if(perk.indexOf("(Small Suitcase)") > -1){
                return 2;
            }
        }
        return 0;
    })();
    let job_perk = (function(){
        let total = 0;
        for(let perk of userdata.company_perks){
            if(perk.indexOf("travel capacity") > -1){
                total += parseInt(perk.replace("+ " ,"").split(" ")[0]);
            }
        }
        return total;
    })();
    let faction_perk = (function(){
        for(let perk of userdata.faction_perks){
            if(perk.indexOf("Increases maximum traveling capacity by") > -1){
                return parseInt(perk.split("by ")[1]);
            }
        }
        return 0;
    })();
    let book_perk = (function(){
        for(let perk of userdata.book_perks){
            if(perk.indexOf("travel capacity") > -1){
                return parseInt(perk.replace("+ " ,"").split(" ")[0]);
            }
        }
        return 0;
    })();

    item_dict = modifyTimeAndCost(item_dict, airstrip, wlt, business, itemlist["368"].market_value);  // business class ticket price

    let carry_items = 5 + suitcase + job_perk + faction_perk + book_perk;
    if(airstrip || wlt || business){
        carry_items += 10;
    }

    console.log("airstrip", airstrip);
    console.log("wlt", wlt);
    console.log("business", business);
    console.log("suitcase", suitcase);
    console.log("job_perk", job_perk);
    console.log("faction_perk", faction_perk);
    console.log("book_perk", book_perk);
    console.log("carry_items", carry_items);

    let container = content.new_container("TornTools - Travel Destinations", {id: "ttTravelTable"}).find(".content");
    let table = doc.new("div");
        table.setClass("table");

    addTableHeader(table);

    for(let location in item_dict){
        let time = item_dict[location].time;

        for(let item_id of item_dict[location].items){
            console.log(itemlist[item_id]);
            let buy_price = itemlist[item_id].buy_price;
            let market_value = itemlist[item_id].market_value;
            let total_profit = (market_value - buy_price) * carry_items;
            let profit_per_minute = (total_profit / time).toFixed(0);

            addRow(table, itemlist, item_id, carry_items, buy_price, market_value, total_profit, profit_per_minute, time, location);
        }
    }
    container.appendChild(table);
}

function modifyTimeAndCost(dict, airstrip, wlt, business, bct_price){
    for(let key in dict){
        if(airstrip){
            dict[key].time = parseFloat((dict[key].time*0.7).toFixed(1)).toFixed(0);
            dict[key].cost = 0;
        } else if(wlt) {
            dict[key].time =  parseFloat((dict[key].time*0.5).toFixed(1)).toFixed(0);
            dict[key].cost = 0;
        } else if(business) {
            dict[key].time =  parseFloat((dict[key].time*0.3).toFixed(1)).toFixed(0);
            dict[key].cost = bct_price;
        }
    }
    return dict;
}

function addTableHeader(table){
    let row = doc.new("div");
        row.setClass("row");

    let destination_heading = doc.new("div");
        destination_heading.innerText = "Destination";
    let flight_time_heading = doc.new("div");
        flight_time_heading.innerText = "Flight time";
    let item_heading = doc.new("div");
        item_heading.innerText = "Item";
    let buy_price_heading = doc.new("div");
        buy_price_heading.innerText = "Buy price";
    let market_value_heading = doc.new("div");
        market_value_heading.innerText = "Market value";
    let profit_per_minute_heading = doc.new("div");
        profit_per_minute_heading.innerText = "Profit/minute";
    let cash_needed_heading = doc.new("div");
        cash_needed_heading.innerText = "Cash needed";
    let total_profit_heading = doc.new("div");
        total_profit_heading.innerText = "Total profit";

    row.appendChild(destination_heading);
    row.appendChild(flight_time_heading);
    row.appendChild(item_heading);
    row.appendChild(buy_price_heading);
    row.appendChild(market_value_heading);
    row.appendChild(profit_per_minute_heading);
    row.appendChild(cash_needed_heading);
    row.appendChild(total_profit_heading);
    table.appendChild(row);
}

function addRow(table, itemlist, item_id, carry_items, buy_price, market_value, total_profit, profit_per_minute, time, location){
    let row = doc.new("div");
        row.setClass("row");

    let destination_div = doc.new("div");
        destination_div.innerText = location == "uae" ? "UAE" : capitalize(location);
    let flight_time_div = doc.new("div");
        flight_time_div.innerText = time;
    let item_div = doc.new("div");
        item_div.innerText = itemlist[item_id].name, every_word=true;
    let buy_price_div = doc.new("div");
        buy_price_div.innerText = `$${numberWithCommas(buy_price, shorten=false)}`;
    let market_value_div = doc.new("div");
        market_value_div.innerText = `$${numberWithCommas(market_value, shorten=false)}`;
    let profit_per_minute_div = doc.new("div");
        profit_per_minute_div.innerText = `$${numberWithCommas(profit_per_minute, shorten=false)}`;
    let cash_needed_div = doc.new("div");
        cash_needed_div.innerText = `$${numberWithCommas((buy_price*carry_items), shorten=false)}`;
    let total_profit_div = doc.new("div");
        total_profit_div.innerText = `$${numberWithCommas(total_profit, shorten=false)}`;

    row.appendChild(destination_div);
    row.appendChild(flight_time_div);
    row.appendChild(item_div);
    row.appendChild(buy_price_div);
    row.appendChild(market_value_div);
    row.appendChild(profit_per_minute_div);
    row.appendChild(cash_needed_div);
    row.appendChild(total_profit_div);
    table.appendChild(row);
}