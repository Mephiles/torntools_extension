playersLoaded(".users-list").then(function(){
    console.log("TT - Hospital");

    let list = doc.find(".users-list");
    let title = list.previousElementSibling;

    addFilterToTable(list, title);
});

function addFilterToTable(list, title){
    let active_dict = {
        "Online": "icon1_",
        "Idle": "icon62_",
        "Offline": "icon2_"
    }
    // let icons_dict = {
    //     "Male": "icon6_",
    //     "Female": "icon7_",
    //     "Donator": "icon3_",
    //     "Subscriber": "icon4_",
    //     "Company": "icon27_",
    //     "Bazaar": "icon35_",
    //     "Traveling": "icon71_"
    // }

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

    // Time filter
    let time_filter = doc.new({type: "div", class: "tt-filter-wrap"});
    let time_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Time"});
    time_filter.appendChild(time_heading);
    
    let time_wrap = doc.new({type: "div", class: "tt-filter"});
    let from_time_input = doc.new({type: "input", class: "tt-filter-from", attributes: {type: "text", style: `width: 60px;`}});
    let from_to_time_divider = doc.new({type: "div", class: "tt-from-to-divider", text: "-"});
    let to_time_input = doc.new({type: "input", class: "tt-filter-to", attributes: {type: "text", style: `width: 60px;`}});
    let note = doc.new({type: "span", class: "tt-filter-note", text: "Format: (1h 2m 3s)", attributes: {style: `left: 30px`}});
    time_wrap.appendChild(from_time_input);
    time_wrap.appendChild(from_to_time_divider);
    time_wrap.appendChild(to_time_input);
    time_wrap.appendChild(note);
    time_filter.appendChild(time_wrap);

    filter_container.appendChild(time_filter);

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

    // // Icons filter
    // let icons_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    // let icons_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Icons"});
    // icons_filter.appendChild(icons_heading);

    // for(let option of ["Male", "Female", "Donator", "Subscriber", "Company", "Bazaar", "Traveling"]){
    //     let wrap = doc.new({type: "div", class: "tt-filter"});
    //     let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
    //     let text = doc.new({type: "div", text: option});
        
    //     wrap.appendChild(checkbox);
    //     wrap.appendChild(text);
    //     icons_filter.appendChild(wrap);
    // }
    // filter_container.appendChild(icons_filter);

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

    // // Status filter
    // let status_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    // let status_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Status"});
    // status_filter.appendChild(status_heading);

    // for(let option of ["Okay", "Hospital", "Jail", "Traveling"]){
    //     let wrap = doc.new({type: "div", class: "tt-filter"});
    //     let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
    //     let text = doc.new({type: "div", text: option});
        
    //     wrap.appendChild(checkbox);
    //     wrap.appendChild(text);
    //     status_filter.appendChild(wrap);
    // }
    // filter_container.appendChild(status_filter);

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

                    let user_level = parseInt(user.find(".level").innerText.trim());
                    if(user_level >= from && user_level <= to){
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
                }*/ else if (heading == "Time"){
                    console.log(filters[heading].from)
                    let from = to_seconds(filters[heading].from || "0s");
                    let to = to_seconds(filters[heading].to || "1000h");

                    let user_time = to_seconds(user.find(".time").innerText.trim());
                    if(user_time >= from && user_time <= to){
                        filtered = true;
                        user.style.display = "block";
                    }
                } else {
                    for(let filter of filters[heading]){
                        switch(heading){
                            case "Active":
                                if(user.find("#iconTray li").id.indexOf(active_dict[filter]) > -1){
                                    filtered = true;
                                    user.style.display = "block";
                                }
                                break;
                            // case "Icons":
                            //     for(let icon of user.findAll(".member-icons.icons #iconTray li")){
                            //         if(icon.id.indexOf(icons_dict[filter]) > -1){
                            //             filtered = true;
                            //             user.style.display = "block";
                            //         }
                            //     }
                            //     break;
                            // case "Status":
                            //     if(user.find(".status *:not(.t-show)").innerText == filter){
                            //         filtered = true;
                            //         user.style.display = "block";
                            //     }
                            //     break;
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