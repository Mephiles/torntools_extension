window.addEventListener("load", async function(){
    console.log("TT - Faction");

    // OC
    if(subpage() == "crimes"){
        ocMain();
    }

    doc.find(".faction-tabs li[data-case=crimes]").addEventListener("click", function(){
        ocMain();
    });
    
    // Simplify Armory
    if(settings.pages.faction.armory){
        if(subpage() == "main"){
            armoryLog();
        }

        doc.find(".faction-tabs li[data-case=main]").addEventListener("click", function(){
            armoryLog();
        });
    }

    if(!mobile){
        // Player list filter
        if(subpage() == "info"){
            playersLoaded(".member-list").then(function(){
                let list = doc.find(".member-list");
                let title = list.previousElementSibling;
    
                addFilterToTable(list, title);
            });
        }
        doc.find(".faction-tabs li[data-case=info]").addEventListener("click", function(){
            playersLoaded(".member-list").then(function(){
                let list = doc.find(".member-list");
                let title = list.previousElementSibling;
    
                addFilterToTable(list, title);
            });
        });
    }
});

function ocMain(){
    subpageLoaded("crimes").then(function(){
        if(settings.pages.faction.oc_time && Object.keys(oc).length > 0){
            ocTimes(oc, settings.format);
        } else if(Object.keys(oc).length == 0) {
            console.log("NO DATA (might be no API access)");
        }

        if(settings.pages.faction.open_ready_oc){
            openOCs();
        }
        if(settings.pages.faction.show_nnb){
            showNNB();
        }
    });
}

function ocTimes(oc, format){
    let crimes = doc.findAll(".organize-wrap .crimes-list>li");
    for(let crime of crimes){
        let crime_id = crime.find(".details-wrap").getAttribute("data-crime");

        let finish_time = oc[crime_id].time_ready;
        let [day, month, year, hours, minutes, seconds]  = dateParts(new Date(finish_time*1000));

        let span = doc.new("span");
            span.setClass("tt-oc-time");
            span.innerText =`${formatTime([hours, minutes], format.time)} | ${formatDate([day, month], format.date)}`;

        crime.find(".status").appendChild(span);
    }
}

function armoryLog(){
    subpageLoaded("main").then(function(){
        
        newstabLoaded("armory").then(function(){
            shortenNews();

            document.addEventListener("click", function(event){
                if(event.target.classList.contains("page-number") || 
                event.target.classList.contains("page-nb") || 
                event.target.classList.contains("pagination-left") || 
                event.target.classList.contains("pagination-right")){
                    setTimeout(function(){
                        newstabLoaded("armory").then(function(){
                            shortenNews();
                        });
                    }, 400)
                }
            })

            function shortenNews(){
                let all_news = doc.findAll("#tab4-4 .news-list>li");
                let db = {}
                for(let news of all_news){
                    let info = news.find(".info").innerText;

                    if(info in db){
                        db[info].count++;
                        db[info].first_date = news.find(".date").innerText;
                    } else {
                        db[info] = {
                            count: 1,
                            username: news.find(".info a").innerText,
                            link: news.find(".info a").getAttribute("href"),
                            last_date: news.find(".date").innerText
                        };
                    }
                }
                
                doc.find("#tab4-4 .news-list").innerHTML = "";
                console.log("db", db)

                for(let key in db){
                    let li = doc.new("li");
                    let date = doc.new("span");
                        date.setClass("date");
                    let info = doc.new("span");
                        info.setClass("info");
                        let a = doc.new("a");
                            a.href = db[key].link;
                            a.innerText = db[key].username;
                            info.appendChild(a);

                    if(db[key].first_date){
                        let upper_time = db[key].first_date.slice(0, db[key].first_date.length-(db[key].first_date.indexOf("\n")+4));
                        let upper_date = db[key].first_date.slice(db[key].first_date.indexOf("\n"), db[key].first_date.length-3);
                        let lower_time = db[key].last_date.slice(0, db[key].last_date.length-(db[key].last_date.indexOf("\n")+4));
                        let lower_date = db[key].last_date.slice(db[key].last_date.indexOf("\n"), db[key].last_date.length-3);

                        let upper_date_span = doc.new("span");
                            upper_date_span.setClass("left-date");
                            upper_date_span.innerText = `${upper_time}${upper_date}`;
                        let separator = doc.new("span");
                            separator.setClass("separator");
                            separator.innerText = "-";
                        let lower_date_span = doc.new("span");
                            lower_date_span.setClass("right-date");
                            lower_date_span.innerText = `${lower_time}${lower_date}`;

                        date.appendChild(upper_date_span);
                        date.appendChild(separator);
                        date.appendChild(lower_date_span);
                    } else {
                        date.innerText = db[key].last_date;
                    }

                    let inner_span = doc.new("span");

                    if(key.indexOf("used one") > -1 || key.indexOf("filled one") > -1){
                        let used = key.indexOf("used one") > -1;

                        let left_side = doc.new("span");
                            left_side.innerText = used ? " used " : " filled ";
                        let amount = doc.new("span");
                            amount.innerText = db[key].count + "x ";
                            amount.style.fontWeight = "600";
                        let right_side = doc.new("span");
                            right_side.innerText = used ? key.split(" used one ")[1] : key.split(" filled one ")[1];

                        inner_span.appendChild(left_side);
                        inner_span.appendChild(amount);
                        inner_span.appendChild(right_side);
                    } else {
                        inner_span.innerText = key;
                    }

                    info.appendChild(inner_span);
                    li.appendChild(date);
                    li.appendChild(info);
                    doc.find("#tab4-4 .news-list").appendChild(li);
                }
            }
        });
    });
}

function subpage(){
    let hash = window.location.hash.replace("#/", "");
    if(hash == ""){
        return "main";
    }

    let key = hash.split("=")[0];
    let value = hash.split("=")[1];

    if(key == "tab"){
        return value;
    }
    return "";
}

function subpageLoaded(page){
    return new Promise(function(resolve, reject){
        let counter = 50;
        let checker = setInterval(function(){
            console.log("checking");
            if(page == "crimes" && doc.find(".organize-wrap ul.crimes-list li")){
                resolve(true);
                return clearInterval(checker);
            } else if(page == "main" && doc.find("#war-react-root")){
                resolve(true);
                return clearInterval(checker);
            } else if(counter == 0){
                resolve(false);
                return clearInterval(checker);
            } else {
                counter--;
            }
        }, 100);
    });
}

function newstabLoaded(tab){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(tab == "armory" && doc.find("#tab4-4 .news-list li:not(.last)")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
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

    // Age filter
    let age_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let age_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Age"});
    age_filter.appendChild(age_heading);
    
    let age_wrap = doc.new({type: "div", class: "tt-filter"});
    let from__age_input = doc.new({type: "input", class: "tt-filter-from", attributes: {type: "number"}});
    let from_to_age_divider = doc.new({type: "div", class: "tt-from-to-divider", text: "-"});
    let to_age_input = doc.new({type: "input", class: "tt-filter-to", attributes: {type: "number"}});
    age_wrap.appendChild(from__age_input);
    age_wrap.appendChild(from_to_age_divider);
    age_wrap.appendChild(to_age_input);
    age_filter.appendChild(age_wrap);

    filter_container.appendChild(age_filter);

    // Status filter
    let status_filter = doc.new({type: "div", class:"tt-filter-wrap"});
    let status_heading = doc.new({type: "div", class: "tt-filter-heading", text: "Status"});
    status_filter.appendChild(status_heading);

    for(let option of ["Okay", "Hospital", "Jail", "Traveling"]){
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
            if(wrap.find("input[type=number]")){
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

                    let user_level = parseInt(user.find(".lvl").innerText.trim());
                    if(user_level >= from && user_level <= to){
                        filtered = true;
                        user.style.display = "block";
                    }
                } else if(heading == "Age"){
                    let from = filters[heading].from || 0;
                    let to = filters[heading].to || 999999999;

                    let user_age = parseInt(user.find(".days").innerText.trim());
                    if(user_age >= from && user_age <= to){
                        filtered = true;
                        user.style.display = "block";
                    }
                } else {
                    for(let filter of filters[heading]){
                        switch(heading){
                            case "Active":
                                if(user.find(".member.icons #iconTray li").id.indexOf(active_dict[filter]) > -1){
                                    filtered = true;
                                    user.style.display = "block";
                                }
                                break;
                            case "Icons":
                                for(let icon of user.findAll(".member-icons.icons #iconTray li")){
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

function openOCs(){
    let crimes = doc.findAll(".organize-wrap .crimes-list>li");
    
    for(let crime of crimes){
        let all_players_ready = true;
        
        for(let player of crime.findAll(".details-list>li")){
            if(player.find(".member").innerText == "Member") continue;

            if(player.find(".stat").innerText != "Okay"){
                all_players_ready = false;
                break;
            }
        }

        if(all_players_ready){
            crime.classList.add("active");
        }
    }
}

function showNNB(){
    fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=crimes`)
    .then(async function(response){
        let result = await response.json();

        // Populate active crimes
        let crimes = doc.findAll(".organize-wrap .crimes-list>li");
        for(let crime of crimes){
            for(let player of crime.findAll(".details-list>li")){
                player.find(".level").classList.add("torntools-modified");

                if(player.find(".member").innerText == "Member"){
                    let col = doc.new({type: "li", class: "tt-nnb", text: "TornStats NNB"});
                    player.find(".stat").parentElement.insertBefore(col, player.find(".stat"));

                    continue;
                }

                let player_id = player.find(".h").getAttribute("href").split("XID=")[1];
                let nnb = result.members[player_id] ? result.members[player_id].natural_nerve : "N/A";

                let col = doc.new({type: "li", class: "tt-nnb", text: nnb});
                player.find(".stat").parentElement.insertBefore(col, player.find(".stat"));
            }
        }

        // Populate new crime selection
        for(let player of doc.findAll(".plans-list .item")){
            player.find(".offences").classList.add("torntools-modified");

            if(player.find(".member").innerText.trim() == "Member"){
                let col = doc.new({type: "li", class: "tt-nnb short", text: "TornStats NNB"});
                player.find(".act").parentElement.insertBefore(col, player.find(".act"));

                continue;
            }

            let player_id = player.find(".h").getAttribute("href").split("XID=")[1];
            let nnb = result.members[player_id] ? result.members[player_id].natural_nerve : "N/A";

            let col = doc.new({type: "li", class: "tt-nnb short", text: nnb});
            player.find(".act").parentElement.insertBefore(col, player.find(".act"));
        }
    });
}