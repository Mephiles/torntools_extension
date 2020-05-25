window.addEventListener('load', async (event) => {
    console.log("TT - Travel (home)");

    if (await flying() || await abroad())
        return;

    local_storage.get(["settings", "itemlist", "userdata", "travel_market"], function ([settings, itemlist, userdata, travel_market]) {
        if (settings.pages.travel.destination_table) {
            if(settings.force_tt){
                hideDoctorn();
            }

            let container = content.new_container("TornTools - Travel Destinations", { id: "ttTravelTable", theme: settings.theme, collapsed: false}).find(".content");
            displayTravelDestinations(container, itemlist.items, userdata, travel_market);

            for (let tab of [...doc.findAll("#tab-menu4>.tabs>li:not(.clear)")]) {
                // tab.classList.remove("ui-state-disabled");
                tab.addEventListener("click", function () {
                    container.innerHTML = "";
                    displayTravelDestinations(container, itemlist.items, userdata, travel_market);
                });
            }

            // Travel items input
            doc.addEventListener("change", function(event){
                if(event.target.id == "ttTravelItemsInput"){
                    let amount = event.target.value;
                
                    container.innerHTML = "";
                    displayTravelDestinations(container, itemlist.items, userdata, travel_market, amount);
                }
            });
        }
    });
});

function displayTravelDestinations(container, itemlist, userdata, travel_market, carry_items) {
    let item_dict = {  // time - minutes
        "argentina": {
            time: 167,
            cost: 21000
        },
        "canada": {
            time: 41,
            cost: 9000
        },
        "cayman islands": {
            time: 35,
            cost: 10000
        },
        "china": {
            time: 242,
            cost: 35000
        },
        "hawaii": {
            time: 134,
            cost: 11000
        },
        "japan": {
            time: 225,
            cost: 32000
        },
        "mexico": {
            time: 26,
            cost: 6500
        },
        "south africa": {
            time: 297,
            cost: 40000
        },
        "switzerland": {
            time: 175,
            cost: 27000
        },
        "uae": {
            time: 271,
            cost: 32000
        },
        "united kingdom": {
            time: 159,
            cost: 18000
        }
    }

    // Travel items calculation
    let airstrip = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "AIRSTRIP" ? true : false;
    let wlt = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "PRIVATE" ? true : false;
    let business = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "BUSINESS" ? true : false;
    let suitcase = (function () {
        for (let perk of userdata.enhancer_perks) {
            if (perk.indexOf("(Large Suitcase)") > -1) {
                return 4;
            } else if (perk.indexOf("(Medium Suitcase)") > -1) {
                return 3;
            } else if (perk.indexOf("(Small Suitcase)") > -1) {
                return 2;
            }
        }
        return 0;
    })();
    let job_perk = (function () {
        let total = 0;
        for (let perk of userdata.company_perks) {
            if (perk.indexOf("travel capacity") > -1) {
                total += parseInt(perk.replace("+ ", "").split(" ")[0]);
            }
        }
        return total;
    })();
    let faction_perk = (function () {
        for (let perk of userdata.faction_perks) {
            if (perk.indexOf("Increases maximum traveling capacity by") > -1) {
                return parseInt(perk.split("by ")[1]);
            }
        }
        return 0;
    })();
    let book_perk = (function () {
        for (let perk of userdata.book_perks) {
            if (perk.indexOf("travel capacity") > -1) {
                return parseInt(perk.replace("+ ", "").split(" ")[0]);
            }
        }
        return 0;
    })();

    item_dict = modifyTimeAndCost(item_dict, airstrip, wlt, business, itemlist["396"].market_value);  // business class ticket price

    if(!carry_items){
        carry_items = 5 + suitcase + job_perk + faction_perk + book_perk;
        if (airstrip || wlt || business) {
            carry_items += 10;
        }
    }

    console.log("-----------------------------")
    console.log("airstrip", airstrip);
    console.log("wlt", wlt);
    console.log("business", business);
    console.log("suitcase", suitcase);
    console.log("job_perk", job_perk);
    console.log("faction_perk", faction_perk);
    console.log("book_perk", book_perk);
    console.log("carry_items", carry_items);

    let table = doc.new({type: "div", class:"table"});
    let body = doc.new({type: "div", class:"body"});

    addTableLegend(table);
    addTableHeader(table);

    for(let item of travel_market){
        let time = item_dict[item.country_name.toLowerCase()].time;
        let travel_cost = item_dict[item.country_name.toLowerCase()].cost;

        addRow(body, itemlist, item, time, carry_items, travel_cost);
    }

    table.appendChild(body);
    container.appendChild(table);

    sort(table, 9, "text");

    doc.find("#ttTravelItemsInput").value = carry_items;
}

function modifyTimeAndCost(dict, airstrip, wlt, business, bct_price) {
    for (let key in dict) {
        if (airstrip) {
            dict[key].time = parseFloat((dict[key].time * 0.7).toFixed(1)).toFixed(0);
            dict[key].cost = 0;
        } else if (wlt) {
            dict[key].time = parseFloat((dict[key].time * 0.5).toFixed(1)).toFixed(0);
            dict[key].cost = 0;
        } else if (business) {
            dict[key].time = parseFloat((dict[key].time * 0.3).toFixed(1)).toFixed(0);
            dict[key].cost = bct_price;
        }
    }
    return dict;
}

function addTableLegend(table){
    let legend = doc.new({type: "div", class: "legend"});
    let item = doc.new({type: "div", class: "item"});
    let marker = doc.new({type: "div", class: "marker"});
    let text = doc.new({type: "div", class: "text", text: "Travel items:"});
    let input = doc.new({type: "input", id: "ttTravelItemsInput", attributes: {type: "number"}});

    marker.appendChild(input);
    item.appendChild(text);
    item.appendChild(marker);
    legend.appendChild(item);
    table.appendChild(legend);
}

function addTableHeader(table) {
    let row = doc.new("div");
    row.setClass("row");

    let destination_heading = doc.new({type: "div", text: "Destination"});
    // let flight_time_heading = doc.new({type: "div", text: "Flight time"});
    let items_abroad_heading = doc.new({type: "div", text: "Stock"});
    let item_heading = doc.new({type: "div", text: "Item"});
    let buy_price_heading = doc.new({type: "div", text: "Buy price"});
    let cash_needed_heading = doc.new({type: "div", text: "Cash needed"});
    let market_value_heading = doc.new({type: "div", text: "Market value"});
    let profit_per_item_heading = doc.new({type: "div", text: "Profit/item"});
    let profit_per_minute_heading = doc.new({type: "div", text: "Profit/minute"});
        let sorting_icon = doc.new({type: "i", class: "fas fa-caret-up"});
    profit_per_minute_heading.appendChild(sorting_icon);
    let total_profit_heading = doc.new({type: "div", text: "Total profit"});

    let headings = [destination_heading, items_abroad_heading, item_heading,
        buy_price_heading, cash_needed_heading, market_value_heading,
        profit_per_item_heading, total_profit_heading, profit_per_minute_heading];

    for (let heading of headings) {
        heading.addEventListener("click", function () {
            sort(table, headings.indexOf(heading) + 1, "text");
        });
        row.appendChild(heading);
    }

    table.appendChild(row);
}

function addRow(body, itemlist, item, time, carry_items, travel_cost) {
    let market_value = itemlist[item.item_id].market_value;
    let total_profit = (market_value - item.abroad_cost) * carry_items - travel_cost;
    let profit_per_minute = (total_profit / time).toFixed(0);
    let profit_per_item = (total_profit / carry_items).toFixed(0);
    let update_time = time_ago(item.timestamp*1000).replace(" minutes", "min").replace(" minute", "min").replace(" seconds", "sec").replace(" hours", "h").replace(" hour", "h");

    let row = doc.new({type: "div", class: "row"});

    let destination_div = doc.new("div");
        let destination_name_span = doc.new({type: "span", text: item.country_name});
        let flag_span = doc.new({
            type: "span", class:"flag", 
            attributes: {
                style: `background: url(/images/v2/travel_agency/flags/fl_${item.country_name.toLowerCase().replace("united kingdom", "uk").replace(" islands", "").replace(" ", "_")}.svg) center top no-repeat`
            }
        });
    destination_div.appendChild(destination_name_span);
    destination_div.appendChild(flag_span);

    // let flight_time_div = doc.new({type: "div", text: time});
    let stock_div = doc.new({type: "div", text: `${item.abroad_quantity.toString()} \n (${update_time})`});
    let item_div = doc.new({type: "div", text: item.item_name});
    let buy_price_div = doc.new({type: "div", text: `$${numberWithCommas(item.abroad_cost, shorten = false)}`});
    let cash_needed_div = doc.new({type: "div", text: `$${numberWithCommas((item.abroad_cost * carry_items), shorten = false)}`});
    let market_value_div = doc.new({type: "div", text: `$${numberWithCommas(market_value, shorten = false)}`});
    
    let profit_per_item_div = doc.new("div");
        if (profit_per_item > 0) {
            profit_per_item_div.setClass("positive profit");
            profit_per_item_div.innerText = `+$${numberWithCommas(profit_per_item, shorten = false)}`;
        } else if (profit_per_item < 0) {
            profit_per_item_div.setClass("negative profit");
            profit_per_item_div.innerText = `-$${numberWithCommas(Math.abs(profit_per_item), shorten = false)}`;
        } else {
            profit_per_item_div.innerText = `$0`;
        }
    
    let profit_per_minute_div = doc.new("div");
        if (profit_per_minute > 0) {
            profit_per_minute_div.setClass("positive profit");
            profit_per_minute_div.innerText = `+$${numberWithCommas(profit_per_minute, shorten = false)}`;
        } else if (profit_per_minute < 0) {
            profit_per_minute_div.setClass("negative profit");
            profit_per_minute_div.innerText = `-$${numberWithCommas(Math.abs(profit_per_minute), shorten = false)}`;
        } else {
            profit_per_minute_div.innerText = `$0`;
        }
    
    let total_profit_div = doc.new("div");
        if (total_profit > 0) {
            total_profit_div.setClass("positive profit");
            total_profit_div.innerText = `+$${numberWithCommas(total_profit, shorten = false)}`;
        } else if (total_profit < 0) {
            total_profit_div.setClass("negative profit");
            total_profit_div.innerText = `-$${numberWithCommas(Math.abs(total_profit), shorten = false)}`;
        } else {
            total_profit_div.innerText = `$0`;
        }

    row.appendChild(destination_div);
    row.appendChild(stock_div);
    row.appendChild(item_div);
    row.appendChild(buy_price_div);
    row.appendChild(cash_needed_div);
    row.appendChild(market_value_div);
    row.appendChild(profit_per_item_div);
    row.appendChild(total_profit_div);
    row.appendChild(profit_per_minute_div);
    body.appendChild(row);
}