window.addEventListener('load', async (event) => {
    console.log("TT - Travel (abroad)");

    if(await flying() || !(await abroad())){
        return;
    }

    if(settings.pages.travel.profits && subpage("main")){
        displayItemProfits(itemlist.items);
    }

    if(subpage("main") && !doc.find(".info-msg-cont.red")){
        updateYATAprices();
    }

});

// playersLoaded(".users-list").then(function(){
//     if(subpage("people")){
//         let list = doc.find(".users-list");
//         let title = list.previousElementSibling;
    
//         addFilterToTable(list, title);
//     }
// });

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
        "items": []
    }

    // Table content
    let rows = doc.findAll(".users-list>li");
    for(let row of rows){
        let id = parseInt(row.find(".item img").getAttribute("src").split("items/")[1].split("/")[0]);
        let quantity = parseInt(row.find(".stck-amount").innerText.replace(/,/g, ""));
        let price = parseInt(row.find(".cost .c-price").innerText.replace("$", "").replace(/,/g, ""));

        // post_data.items[id] = {quantity: quantity, cost: price}
        post_data.items.push({
            id: id,
            quantity: quantity,
            cost: price
        });
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

function subpage(type){
    let search = window.location.search;

    if(type == "main" && search == ""){
        return true;
    }

    if(search.indexOf(type) > -1){
        return true;
    }
    return false;
}

function addFilterToTable(list, title){
    let active_dict = {
        "Online": "icon1_",
        "Idle": "icon62_",
        "Offline": "icon2_"
    }
    let icons_dict = {
        "Male": "icon6_",
        "Female": "icon7_",
        "Donator": "icon3_",
        "Subscriber": "icon4_",
        "Company": "icon27_",
        "Bazaar": "icon35_",
        "Traveling": "icon71_"
    }

    let filter_container = content.new_container("Filters", {id: "tt-player-filter", collapsed: false, next_element: title}).find(".content");
    filter_container.setAttribute("class", "cont-gray bottom-round tt-content content");

    // Active filter
    let active_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let active_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Active"});
    active_filter.appendChild(active_heading);

    for(let option of ["Online", "Idle", "Offline"]){
        let wrap = doc.new({type: "div", class: "tt-filter"});
        let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
        let text = doc.new({type: "div", text: option});
        
        wrap.appendChild(checkbox);
        wrap.appendChild(text);
        active_filter.appendChild(wrap);
    }
    filter_container.appendChild(active_filter);

    // // Time filter
    // let time_filter = doc.new({type: "div", class: "tt-filter-wrap"});
    // let time_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Time"});
    // time_filter.appendChild(time_heading);
    
    // let time_wrap = doc.new({type: "div", class: "tt-filter"});
    // let from_time_input = doc.new({type: "input", class: "tt-filter-from", attributes: {type: "text", style: `width: 60px;`}});
    // let from_to_time_divider = doc.new({type: "div", class: "tt-from-to-divider", text: "-"});
    // let to_time_input = doc.new({type: "input", class: "tt-filter-to", attributes: {type: "text", style: `width: 60px;`}});
    // let note = doc.new({type: "span", class: "tt-filter-note", text: "Format: (1h 2m 3s)", attributes: {style: `left: 30px`}});
    // time_wrap.appendChild(from_time_input);
    // time_wrap.appendChild(from_to_time_divider);
    // time_wrap.appendChild(to_time_input);
    // time_wrap.appendChild(note);
    // time_filter.appendChild(time_wrap);

    // filter_container.appendChild(time_filter);

    // Level filter
    let level_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let level_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Level"});
    level_filter.appendChild(level_heading);
    
    let level_wrap = doc.new({type: "div", class: "tt-filter"});
    let from_level_input = doc.new({type: "input", class: "tt-filter-from", attributes: {type: "number"}});
    let from_to_level_divider = doc.new({type: "div", class: "tt-from-to-divider", text: "-"});
    let to_level_input = doc.new({type: "input", class: "tt-filter-to", attributes: {type: "number"}});
    level_wrap.appendChild(from_level_input);
    level_wrap.appendChild(from_to_level_divider);
    level_wrap.appendChild(to_level_input);
    level_filter.appendChild(level_wrap);

    filter_container.appendChild(level_filter);

    // Icons filter
    let icons_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let icons_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Icons"});
    icons_filter.appendChild(icons_heading);

    for(let option of ["Male", "Female", "Donator", "Subscriber", "Company", "Bazaar", "Traveling"]){
        let wrap = doc.new({type: "div", class: "tt-filter"});
        let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
        let text = doc.new({type: "div", text: option});
        
        wrap.appendChild(checkbox);
        wrap.appendChild(text);
        icons_filter.appendChild(wrap);
    }
    filter_container.appendChild(icons_filter);

    // // Age filter
    // let age_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    // let age_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Age"});
    // age_filter.appendChild(age_heading);
    
    // let age_wrap = doc.new({type: "div", class: "tt-filter"});
    // let from__age_input = doc.new({type: "input", class: "tt-filter-from", attributes: {type: "number"}});
    // let from_to_age_divider = doc.new({type: "div", class: "tt-from-to-divider", text: "-"});
    // let to_age_input = doc.new({type: "input", class: "tt-filter-to", attributes: {type: "number"}});
    // age_wrap.appendChild(from__age_input);
    // age_wrap.appendChild(from_to_age_divider);
    // age_wrap.appendChild(to_age_input);
    // age_filter.appendChild(age_wrap);

    // filter_container.appendChild(age_filter);

    // Status filter
    let status_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let status_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Status"});
    status_filter.appendChild(status_heading);

    for(let option of ["Okay", "Hospital"]){
        let wrap = doc.new({type: "div", class: "tt-filter"});
        let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
        let text = doc.new({type: "div", text: option});
        
        wrap.appendChild(checkbox);
        wrap.appendChild(text);
        status_filter.appendChild(wrap);
    }
    filter_container.appendChild(status_filter);

    // Event Listeners
    doc.addEventListener("click", function(event){
        if(event.target.nodeName == "INPUT" && event.target.parentElement.classList.contains("tt-filter")){
            applyFilter();
        }
    });

    doc.addEventListener("keyup", function(event){
        if(event.target.nodeName == "INPUT" && event.target.parentElement.classList.contains("tt-filter")){
            applyFilter();
        }
    });

    function showAllUsers(list){
        for(let user of list.findAll(":scope>li")){
            user.style.display = "block";
        }
    }

    function applyFilter(){
        let filters = {}

        // Populate filters
        for(let wrap of doc.findAll("#tt-player-filter .tt-filter-wrap")){
            if(wrap.find("input[type=number]") || wrap.find("input[type=text]")){
                filters[wrap.find(".tt-filter-heading").innerText] = {}
                if(wrap.find(".tt-filter-from").value != ""){
                    filters[wrap.find(".tt-filter-heading").innerText].from = wrap.find(".tt-filter-from").value
                }
                if(wrap.find(".tt-filter-to").value != ""){
                    filters[wrap.find(".tt-filter-heading").innerText].to = wrap.find(".tt-filter-to").value
                }
                continue;
            }
            filters[wrap.find(".tt-filter-heading").innerText] = [...wrap.findAll("input:checked")].map(x => x.nextElementSibling.innerText);
        }
        
        console.log(filters);

        // Check for filter count
        let filters_count = 0;
        for(let type in filters){
            if(typeof filters[type] == "object" && !Array.isArray(filters[type])){
                if(Object.keys(filters[type]).length > 0){
                    filters_count++;
                    continue;
                }
            } else if (filters[type][0] != undefined) {
                filters_count++;
            }
        }
        if(filters_count == 0){
            console.log("empty filter")
            showAllUsers(list);
            return;
        } else if(filters_count == 1){
            showAllUsers(list);
        }


        for(let user of list.findAll(":scope>li")){
            if(user.style.display == "none"){
                continue;
            }
            
            for(let heading in filters){
                if(Array.isArray(filters[heading]) && filters[heading][0] == undefined) continue;

                let filtered = false;
                if(heading == "Level"){
                    let from = filters[heading].from || 0;
                    let to = filters[heading].to || 100;

                    let user_level = parseInt(user.find(".level").innerText.replace("LEVEL:\n", "").trim());
                    if(user_level >= from && user_level <= to){
                        console.log("filtered level")
                        filtered = true;
                        user.style.display = "block";
                    }
                } /*else if(heading == "Age"){
                    let from = filters[heading].from || 0;
                    let to = filters[heading].to || 999999999;

                    let user_age = parseInt(user.find(".days").innerText.trim());
                    if(user_age >= from && user_age <= to){
                        filtered = true;
                        user.style.display = "block";
                    }
                }*/ /*else if (heading == "Time"){
                    console.log(filters[heading].from)
                    let from = to_seconds(filters[heading].from || "0s");
                    let to = to_seconds(filters[heading].to || "1000h");

                    let user_time = to_seconds(user.find(".time").innerText.trim());
                    if(user_time >= from && user_time <= to){
                        filtered = true;
                        user.style.display = "block";
                    }
                }*/ else {
                    for(let filter of filters[heading]){
                        switch(heading){
                            case "Active":
                                if(user.find(".left-side #iconTray li").id.indexOf(active_dict[filter]) > -1){
                                    console.log("filtered active")
                                    filtered = true;
                                    user.style.display = "block";
                                }
                                break;
                            case "Icons":
                                for(let icon of user.findAll(".center-side-bottom #iconTray li")){
                                    if(icon.id.indexOf(icons_dict[filter]) > -1){
                                        filtered = true;
                                        user.style.display = "block";
                                    }
                                }
                                break;
                            case "Status":
                                if(user.find(".status *:not(.t-show)").innerText == filter){
                                    filtered = true;
                                    user.style.display = "block";
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                if(!filtered){
                    // showAllUsers(list);
                    user.style.display = "none";
                }
            }
        }
    }
}