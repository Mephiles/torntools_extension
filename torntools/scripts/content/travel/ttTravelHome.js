var country_dict = {  // time = minutes
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

DBloaded().then(function(){
    mapLoaded().then(function(){
        console.log("TT - Travel (home)");

        if(!settings.pages.travel.destination_table){
            return;
        }
    
        modifyTimeAndCost();

        let container = content.new_container("Travel Destinations", {id: "ttTravelTable"}).find(".content");
        
        addLegend();
        setTravelItems();

        let travel_items = doc.find("#ttTravelTable #tt-items").value;

        let table = doc.new({type: "div", class: "table"});
        container.appendChild(table);

        addTableContent(travel_items);

        // Set initial table mode
        if(filters.travel.table_type == "basic"){
            doc.find("#ttTravelTable .table-type-button span[type='basic']").click();
        } else if(filters.travel.table_type == "advanced"){
            doc.find("#ttTravelTable .table-type-button span[type='advanced']").click();
        }

        // Sort by country
        sort(doc.find("#ttTravelTable .table"), 1, "text");

        filterTable();
    
        for (let tab of [...doc.findAll("#tab-menu4>.tabs>li:not(.clear)")]) {
            // tab.classList.remove("ui-state-disabled");  // Testing purposes
            tab.addEventListener("click", function () {
                setTravelItems();
                reloadTable();
            });
        }
    });
});

function modifyTimeAndCost() {
    let business_class_ticket_price = itemlist.items["396"].market_value;

    let airstrip = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "AIRSTRIP" ? true : false;
    let wlt = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "PRIVATE" ? true : false;
    let business = doc.find("#tab-menu4 li[aria-selected=true]").innerText == "BUSINESS" ? true : false;

    for (let key in country_dict) {
        if (airstrip) {
            country_dict[key].time = parseFloat((country_dict[key].time * 0.7).toFixed(1)).toFixed(0);
            country_dict[key].cost = 0;
        } else if (wlt) {
            country_dict[key].time = parseFloat((country_dict[key].time * 0.5).toFixed(1)).toFixed(0);
            country_dict[key].cost = 0;
        } else if (business) {
            country_dict[key].time = parseFloat((country_dict[key].time * 0.3).toFixed(1)).toFixed(0);
            country_dict[key].cost = business_class_ticket_price;
        }
    }
}

function addLegend(){
    let legend = 
    `
<div class="legend">
    <div class="top-row">
        <div class="filter-button"><i class="fas ${filters.travel.open? 'fa-chevron-up':'fa-chevron-down'}"></i><div>&nbsp;Filters</div></div>
        <div class="table-type-button">
            <span class="table-type" type="advanced">Advanced</span>
            <span>&nbsp;/&nbsp;</span>
            <span class="table-type" type="basic">Basic</span>
        </div>
    </div>
    <div class="legend-content ${filters.travel.open?"":"collapsed"}">
        <div class="row">
            <div>Travel items:&nbsp;<input type="number" id="tt-items"></div>
        </div>
        <div class="heading">Items</div>
        <div class="row">
            <div class="radio-item"><input type="radio" name="item" _type="all">All</div>
            <div class="radio-item"><input type="radio" name="item" _type="plushie">Plushies</div>
            <div class="radio-item"><input type="radio" name="item" _type="flower">Flowers</div>
            <div class="radio-item"><input type="radio" name="item" _type="plushie,flower">Plushies/Flowers</div>
            <div class="radio-item"><input type="radio" name="item" _type="drug">Drugs</div>
            <div class="radio-item"><input type="radio" name="item" _type="other">Other</div>
        </div>
        <div class="heading">Countries</div>
        <div class="row">
            <div class="radio-item"><input type="radio" name="country" _type="all">All</div>
            <div class="radio-item"><input type="radio" name="country" _type="mexico">Mexico</div>
            <div class="radio-item"><input type="radio" name="country" _type="cayman islands">Cayman Islands</div>
            <div class="radio-item"><input type="radio" name="country" _type="canada">Canada</div>
            <div class="radio-item"><input type="radio" name="country" _type="hawaii">Hawaii</div>
            <div class="radio-item"><input type="radio" name="country" _type="united kingdom">United Kingdom</div>
            <div class="radio-item"><input type="radio" name="country" _type="argentina">Argentina</div>
            <div class="radio-item"><input type="radio" name="country" _type="switzerland">Switzerland</div>
            <div class="radio-item"><input type="radio" name="country" _type="japan">Japan</div>
            <div class="radio-item"><input type="radio" name="country" _type="china">China</div>
            <div class="radio-item"><input type="radio" name="country" _type="uae">UAE</div>
            <div class="radio-item"><input type="radio" name="country" _type="south africa">South Africa</div>
        </div>
    </div>
</div>
    `

    doc.find("#ttTravelTable .content").innerHTML += legend;

    // Set right filters
    doc.find(`#ttTravelTable .legend-content input[name='item'][_type='${filters.travel.item_type}']`).checked = true;
    doc.find(`#ttTravelTable .legend-content input[name='country'][_type='${filters.travel.country}']`).checked = true;

    // Open/Close filter
    for(let el of doc.findAll("#ttTravelTable .content .filter-button *")){
        el.onclick = function(){
            doc.find("#ttTravelTable .content .legend-content").classList.toggle("collapsed");
            rotateElement(doc.find("#ttTravelTable .content .filter-button i"), 180);

            saveSettings();
        }
    }

    // Switch between modes
    let basic_mode_button = doc.find("#ttTravelTable .table-type-button span[type='basic']");
    let advanced_mode_button = doc.find("#ttTravelTable .table-type-button span[type='advanced']");
    
    basic_mode_button.onclick = function(){
        if(!basic_mode_button.classList.contains("active")){
            basic_mode_button.classList.add("active");
        }
        advanced_mode_button.classList.remove("active");

        // Hide advanced elements
        for(let el of doc.findAll("#ttTravelTable .table .advanced")){
            if(!el.classList.contains("hidden")){
                el.classList.add("hidden");
            }
        }

        saveSettings();
    }
    advanced_mode_button.onclick = function(){
        if(!advanced_mode_button.classList.contains("active")){
            advanced_mode_button.classList.add("active");
        }
        basic_mode_button.classList.remove("active");

        // Show advanced elements
        for(let el of doc.findAll("#ttTravelTable .table .advanced")){
            el.classList.remove("hidden");
        }
        
        saveSettings();
    }

    // Filtering
    for(let el of doc.findAll("#ttTravelTable .legend-content .row .radio-item input")){
        el.onclick = function(){
            filterTable();
            saveSettings();
        }
    }

    // Change travel items count
    doc.find("#ttTravelTable .legend-content #tt-items").onchange = function(){
        reloadTable();
    }
}

function setTravelItems(){
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

    // item_dict = modifyTimeAndCost(item_dict, airstrip, wlt, business, itemlist["396"].market_value);  // business class ticket price

    // if(!carry_items){
    //     carry_items = 5 + suitcase + job_perk + faction_perk + book_perk;
    //     if (airstrip || wlt || business) {
    //         carry_items += 10;
    //     }
    // }

    let travel_items = 5 + suitcase + job_perk + faction_perk + book_perk;
    if(airstrip || wlt || business){
        travel_items += 10;
    }

    console.log("-----------------------------")
    console.log("airstrip", airstrip);
    console.log("wlt", wlt);
    console.log("business", business);
    console.log("suitcase", suitcase);
    console.log("job_perk", job_perk);
    console.log("faction_perk", faction_perk);
    console.log("book_perk", book_perk);
    console.log("carry_items", travel_items);

    doc.find("#ttTravelTable #tt-items").value = travel_items;
}

function addTableContent(travel_items){
    addTableHeader();

    let body = doc.new({type: "div", class: "body"});
    doc.find("#ttTravelTable .table").appendChild(body);

    let body_html = ``;

    // Add rows
    for(let item of travel_market){
        let time = country_dict[item.country_name.toLowerCase()].time;
        let cost = country_dict[item.country_name.toLowerCase()].cost;
        
        body_html += addRow(item, time, cost, travel_items);
    }
    body.innerHTML = body_html;
}

function addTableHeader(){
    let row = 
    `
<div class="row header-row">
    <div>Destination</div>
    <div>Item</div>
    <div>Stock</div>
    <div class="advanced" sort-type="value">Buy Price</div>
    <div class="advanced" sort-type="value">Market Value</div>
    <div class="advanced" sort-type="value">Profit/Item</div>
    <div sort-type="value">Profit/Minute</div>
    <div class="advanced" sort-type="value">Total Profit</div>
    <div class="advanced" sort-type="value">Cash Needed</div>
</div>
    `
    doc.find("#ttTravelTable .table").innerHTML += row;

    doc.addEventListener("click", function(event){
        
        if(hasParent(event.target, {class: "header-row"})){
            let parent = event.target;
            
            if(event.target.nodeName == "I") parent = event.target.parentElement;

            sort(doc.find("#ttTravelTable .table"), [...parent.parentElement.children].indexOf(parent)+1, parent.getAttribute("sort-type") == "value" ? "value":"text");
        }
    });
}

function addRow(item, time, cost, travel_items) {
    let market_value = itemlist.items[item.item_id].market_value;
    let total_profit = (market_value - item.abroad_cost)*travel_items - cost;
    let profit_per_minute = (total_profit / time).toFixed(0);
    let profit_per_item = (total_profit / travel_items).toFixed(0);
    let update_time = time_ago(item.timestamp*1000);
    let item_types = ["plushie", "flower", "drug"];
    let background_style = `url(/images/v2/travel_agency/flags/fl_${item.country_name.toLowerCase().replace("united kingdom", "uk").replace(" islands", "").replace(" ", "_")}.svg) center top no-repeat`
    let item_type = item_types.includes(item.item_type.toLowerCase()) ? item.item_type.toLowerCase() : "other";

    let row = 
    `
<div class="row">
    <div country='${item.country_name.toLowerCase()}'><div class="flag" style="background: ${background_style}"></div>${item.country_name}</div>
    <div item='${item_type}'>${item.item_name}</div>
    <div>${item.abroad_quantity.toString()} <br> <span class="update-time">(${update_time})</span></div>
    <div class="advanced" value="${item.abroad_cost}">$${numberWithCommas(item.abroad_cost, item.abroad_cost>=1e6?true:false)}</div>
    <div class="advanced" value="${market_value}">$${numberWithCommas(market_value, market_value>=1e6?true:false)}</div>
    
    `
    let profit_per_item_div;
    if (profit_per_item > 0) {
        profit_per_item_div = `<div class="positive profit advanced" value="${profit_per_item}">+$${numberWithCommas(profit_per_item, profit_per_item>=1e6?true:false)}</div>`
    } else if (profit_per_item < 0) {
        profit_per_item_div = `<div class="negative profit advanced" value="${profit_per_item}">-$${numberWithCommas(Math.abs(profit_per_item), profit_per_item<=-1e6?true:false)}</div>`
    } else {
        profit_per_item_div = `<div class="advanced" value="0">$0</div>`
    }
    row+=profit_per_item_div;
    
    let profit_per_minute_div;
    if (profit_per_minute > 0) {
        profit_per_minute_div = `<div class="positive profit" value="${profit_per_minute}">+$${numberWithCommas(profit_per_minute, profit_per_minute>=1e6?true:false)}</div>`
    } else if (profit_per_minute < 0) {
        profit_per_minute_div = `<div class="negative profit" value="${profit_per_minute}">-$${numberWithCommas(Math.abs(profit_per_minute), profit_per_minute<=-1e6?true:false)}</div>`
    } else {
        profit_per_minute_div = `<div value="0">$0</div>`
    }
    row+=profit_per_minute_div;

    let total_profit_div;
    if (total_profit > 0) {
        total_profit_div = `<div class="positive profit advanced" value="${total_profit}">+$${numberWithCommas(total_profit, total_profit>=1e6?true:false)}</div>`
    } else if (total_profit < 0) {
        total_profit_div = `<div class="negative profit advanced" value="${total_profit}">-$${numberWithCommas(Math.abs(total_profit), total_profit<=-1e6?true:false)}</div>`
    } else {
        total_profit_div = `<div class="advanced" value="0">$0</div>`
    }
    row+=total_profit_div;

    row+= `<div class="advanced" value="${item.abroad_cost * travel_items}">$${numberWithCommas((item.abroad_cost * travel_items), item.abroad_cost>=1e6?true:false)}</div>`

    row+="</div>"
    return row;
}

function filterTable(){
    let types = {}
    for(let el of doc.findAll("#ttTravelTable .legend-content .radio-item input:checked")){
        types[el.getAttribute("name")] = el.getAttribute("_type").split(",");
    }

    let cols = {
        "country": 1,
        "item": 2
    }

    for(let row of doc.findAll("#ttTravelTable .table .body .row")){
        row.classList.remove("hidden");

        for(let type in types){
            if(types[type][0] == "all"){
                continue;
            }

            let is_in_list = false;
            let row_type = [...row.children][cols[type]-1].getAttribute(type);

            for(let filter of types[type]){
                if(filter == row_type){
                    is_in_list = true;
                }
            }

            if(!is_in_list){
                row.classList.add("hidden");
            }
        }
    }
}

function mapLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".travel-map")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function saveSettings(){
    let travel = {
        table_type: doc.find(".table-type.active")? doc.find(".table-type.active").getAttribute("type") : "basic",
        open: doc.find(".legend-content").classList.contains("collapsed")? false:true,
        item_type: doc.find(".legend-content input[name='item']:checked").getAttribute("_type"),
        country: doc.find(".legend-content input[name='country']:checked").getAttribute("_type")
    }

    local_storage.change({"filters": {"travel": travel}});
}

function reloadTable(){
    let travel_items = doc.find("#tt-items").value;

    doc.find("#ttTravelTable .table .body").innerHTML = "";
    let body_html = ``;

    // Add rows
    for(let item of travel_market){
        let time = country_dict[item.country_name.toLowerCase()].time;
        let cost = country_dict[item.country_name.toLowerCase()].cost;
        
        body_html += addRow(item, time, cost, travel_items);
    }
    doc.find("#ttTravelTable .table .body").innerHTML = body_html;

    // Set Table mode
    local_storage.get("filters", function(filters){
        if(filters.travel.table_type == "basic"){
            doc.find("#ttTravelTable .table-type-button span[type='basic']").click();
        } else if(filters.travel.table_type == "advanced"){
            doc.find("#ttTravelTable .table-type-button span[type='advanced']").click();
        }

        // Sort by country
        doc.find("#ttTravelTable .header-row i").remove();
        sort(doc.find("#ttTravelTable .table"), 1, "text");
    
        filterTable();
    });
}