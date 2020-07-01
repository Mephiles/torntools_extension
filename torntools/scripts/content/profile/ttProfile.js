var money_key_list = ["networth", "moneymugged", "largestmug", "peopleboughtspent", "receivedbountyvalue"]
var key_dict = {
    "networth": "Networth",
    "refills": "Refills",
    "receivedbountyvalue": "Recieved Bounties",
    "dukecontractscompleted": "Duke Contracts",
    "contractscompleted": "Total Contracts",
    "missioncreditsearned": "Mis. Cred. Earned",
    "defendslostabroad": "Def. lost abroad",
    "attackswonabroad" : "Att. won abroad"
}

profileLoaded().then(function(){
    console.log("TT - Profile");

    let user_faction = userdata.faction.faction_name;

    if(settings.pages.profile.show_id){
        showId();
    }

    if(settings.pages.profile.friendly_warning){
        displayAlly(user_faction, allies);
    }
        
    if(settings.pages.profile.loot_times){
        displayLootLevel(loot_times);
    }

    if(settings.pages.profile.status_indicator){
        addStatusIndicator();
    }
    displayCreator();

    // Profile stats
    let info_container = content.new_container("User Info", {next_element_heading: "Medals", id: "tt-target-info", collapsed: false});
    let content_container = info_container.find(".content");

    let button = doc.new({type: "div", class: "fetch-button", text: "Fetch Info via API"});
    content_container.appendChild(button);

    if(settings.profile_stats.auto_fetch){
        displayProfileStats();
    } else {
        button.addEventListener("click", function(){
            displayProfileStats();
        });
    }

    // Target info
    if(target_list.show){
        displayTargetInfo(target_list.targets);
    }

    // Stakeout
    displayStakeoutOptions();
});

function displayCreator() {
    let name = doc.find("#skip-to-content span") || doc.find("#skip-to-content");

    if (name.innerText == "Mephiles' Profile" || name.innerText == "Mephiles [2087524]") {
        let span1 = doc.new({type: "span", text: " - Thanks for using ", attributes: {
            style: `font-size: 17px;`
        }});

        let span2 = doc.new({type: "span", text: "TornTools", attributes: {
            style: `font-size: 17px; color: #6b8817;`
        }});

        span1.appendChild(span2);
        name.appendChild(span1);
    }
}

function profileLoaded() {
    let promise = new Promise(function (resolve, reject) {
        let counter = 0;
        let checker = setInterval(function () {
            if (document.querySelector(".basic-information ul.basic-list li")) {
                resolve(true);
                return clearInterval(checker);
            } else if (counter > 10000) {
                resolve(false);
                return clearInterval(checker);
            } else
                counter++;
        }, 100);
    });

    return promise.then(function (data) {
        return data;
    });
}

function displayAlly(user_faction, allies) {
    let profile_faction = doc.find(".basic-information ul.basic-list li:nth-of-type(3) div:nth-of-type(2)").innerText;

    if (user_faction == profile_faction) {
        showWarning('user');
        return;
    }

    for (let ally of allies) {
        if (ally.trim() == profile_faction) {
            showWarning('ally');
            return;
        }
    }
}

function showWarning(type) {
    let title = doc.find(".profile-left-wrapper .title-black");
    let span = document.createElement("span");
    span.setClass("tt-warning-message");

    if (type == 'user')
        span.innerText = "This user is in your faction!";
    else if (type == 'ally')
        span.innerText = "This user is an ally!";

    title.appendChild(span);
}

function displayTargetInfo(targets) {
    let user_id = getUserId();
    let content_container = doc.find("#tt-target-info .content");

    if (!targets[user_id]){
        let span = doc.new({type: "span", text: "No battle data on user.", });
        content_container.appendChild(span);
    } else {
        let table = doc.new("div");
        table.setClass("tt-table");

        let headings = [
            { name: "Wins", type: "win", class: "good tt-item" },
            { name: "Mugs", type: "mug", class: "good tt-item" },
            { name: "Leaves", type: "leave", class: "good tt-item" },
            { name: "Hosps", type: "hosp", class: "good tt-item" },
            { name: "Arrests", type: "arrest", class: "good tt-item" },
            { name: "Specials", type: "special", class: "good tt-item" },
            { name: "Assists", type: "assist", class: "good tt-item" },
            { name: "Defends", type: "defend", class: "good tt-item" },
            { name: "Lost", type: "lose", class: "new-section bad tt-item" },
            { name: "Defends lost", type: "defend_lose", class: "bad tt-item" },
            { name: "Stalemates", type: "stalemate", class: "bad tt-item" },
            { name: "Stealths", type: "stealth", class: "new-section neutral tt-item" },
            { name: "Respect", type: "respect_base", class: "neutral tt-item" }
        ]

        // header row
        let header_row = doc.new("div");
        header_row.setClass("tt-header-row tt-row");

        for (let heading of headings) {
            let th = doc.new("div");
            th.innerText = heading.name;
            th.setClass(heading.class);
            header_row.appendChild(th);
        }

        // data row
        let row = doc.new("div");
        row.setClass("tt-row");

        for (let heading of headings) {
            let td = doc.new("div");
            td.setClass(heading.class);

            if (heading.name == "Respect") {
                let [value, color] = getRespect(targets, user_id);
                td.innerText = value;
                td.style.backgroundColor = color;
            } else
                td.innerText = targets[user_id][heading.type];

            row.appendChild(td);
        }

        // compiling
        table.appendChild(header_row);
        table.appendChild(row);
        content_container.appendChild(table);
    }
}

function displayProfileStats(){
    doc.find(".fetch-button").style.display = "none";
    get_api(`https://api.torn.com/user/${getUserId()}?selections=personalstats`, api_key)
    .then(async function(data){
        return new Promise(function(resolve, reject){
            fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=spy&target=${getUserId()}`)
            .then(async function(response){
                let result = await response.json();
                if(result.error){
                    console.log("TornStats API result", result);
                    
                    let text;
                    if(result.error.indexOf("User not found") > -1){
                        text = "Please register an account @ www.tornstats.com";
                    }
                    let div = doc.new({type: "div", text: text || result.error, attributes: {style: "margin-bottom: 10px;"}});
                    doc.find(".fetch-button").parentElement.insertBefore(div, doc.find(".fetch-button"));
                    return resolve({});
                }
                return resolve({...data.personalstats, ...result.compare.data});
            });
        });
    })
    .then(function(data){
        if(Object.keys(data).length == 0){
            return;
        }
        console.log("data", data);

        let table = doc.new({type: "div", class: "tt-profile-stats"});
        let col_chosen = doc.new({type: "div", class: `tt-col col-left ${mobile?'mobile':''}`});
        let col_all = doc.new({type: "div", class: `tt-col col-right ${mobile?'mobile':''}`});
        
        // Setup headers
        for(let el of [col_chosen, col_all]){
            let header = doc.new({type: "div", class: "tt-row tt-header"});
            let header_1 = doc.new({type: "div", class: "tt-header-item", text: "Key"});
            let header_2 = doc.new({type: "div", class: "tt-header-item", text: "Value"});
            let header_3 = doc.new({type: "div", class: "tt-header-item", text: "Your stats"});
            header.appendChild(header_1);
            header.appendChild(header_2);
            header.appendChild(header_3);

            el.appendChild(header);
        }

        // Setup all data
        for(let key of Object.keys(data).reverse()){
            if(["Networth"].includes(key)) continue;

            let original_value = typeof data[key] == "object" ? data[key].amount : data[key];
            let original_user_value = typeof data[key] == "object" ? data[key].amount + data[key].difference : (userdata.personalstats[key] || 0);

            let value = numberWithCommas(original_value, shorten=false);
            let user_value = numberWithCommas(original_user_value, false);

            if(money_key_list.includes(key)){
                let negative = value < 0 ? true : false;
                value = "$"+numberWithCommas(Math.abs(original_value), false);
                value = negative? "-"+value : value;

                negative = user_value < 0 ? true : false;
                user_value = "$"+numberWithCommas(Math.abs(original_user_value), false);
                user_value = negative? "-"+user_value : user_value;
            }

            let row = doc.new({type: "div", class: "tt-row", attributes: {key: key}});
            let key_cell = doc.new({type: "div", text: key_dict[key] || key, class: "tt-key"});
            let value_cell = doc.new({type: "div", text: value, class: "tt-value"});
            let user_value_cell = doc.new({type: "div", text: user_value, class: "tt-user-value"});
            let icon_div = doc.new({type: "div", class: "tt-icon"});
            let icon = doc.new({type: "i", class: `fas ${mobile? 'fa-caret-up':'fa-caret-left'}`});

            if(original_user_value > original_value){
                user_value_cell.classList.add("positive");
                value_cell.classList.add("negative");
            } else if(original_user_value == original_value){
            } else {
                value_cell.classList.add("positive");
                user_value_cell.classList.add("negative");
            }

            icon_div.appendChild(icon);
            row.appendChild(icon_div);
            row.appendChild(key_cell);
            row.appendChild(value_cell);
            row.appendChild(user_value_cell);
            col_all.appendChild(row);

            icon.addEventListener("click", function(){
                moveLeft(row);
            });
        }

        // Footer
        let footer_div = doc.new({type: "div", class: "tt-footer"});
        let footer_text = doc.new({type: "div", text: "Automatically load info"});
        let footer_input = doc.new({type: "input", attributes: {type: "checkbox"}});
        footer_div.appendChild(footer_text);
        footer_div.appendChild(footer_input);

        if(settings.profile_stats.auto_fetch){
            footer_input.checked = true;
        }

        footer_input.addEventListener("click", function(){
            local_storage.change({"settings": {"profile_stats": {"auto_fetch": footer_input.checked}}});
        });

        table.appendChild(col_chosen);
        table.appendChild(col_all);
        doc.find("#tt-target-info .fetch-button").parentElement.insertBefore(table, doc.find("#tt-target-info .fetch-button"));
        doc.find("#tt-target-info .fetch-button").parentElement.insertBefore(footer_div, doc.find("#tt-target-info .fetch-button"))

        // Move chosen keys to left side
        for(let row of doc.findAll(".tt-profile-stats .tt-col.col-right .tt-row:not(.tt-header)")){
            if(row.getAttribute("key") && settings.profile_stats.stats.includes(row.getAttribute("key"))){
                moveLeft(row);
            }
        }

        // Fix overflows
        for(let el of table.findAll(".tt-row .tt-value, .tt-row .tt-user-value")){
            if(isOverflownX(el)){
                let money = el.innerText.indexOf("$") > -1 ? true:false;
                let negative = el.innerText.indexOf("-") > -1 ? true:false;
                let value = el.innerText.replace(/,/g, "").replace("$", "");

                el.setAttribute("true-value", value);

                if(money){
                    if(negative){
                        el.innerText = "-$"+numberWithCommas(value);
                    } else {
                        el.innerText = "$"+numberWithCommas(value);
                    }
                } else {
                    el.innerText = numberWithCommas(value);
                }
            }
        }
    });

    function moveLeft(row){
        row.appendChild(row.find(".tt-icon"));
        row.find(".tt-icon i").setClass(`fas ${mobile? 'fa-caret-down':'fa-caret-right'}`);
        doc.find(".tt-profile-stats .tt-col.col-left").appendChild(row);

        row.find(".tt-icon i").addEventListener("click", function(){
            moveRight(row);
        });

        savePreferences();
    }

    function moveRight(row){
        row.insertBefore(row.find(".tt-icon"), row.firstElementChild);
        row.find(".tt-icon i").setClass(`fas ${mobile? 'fa-caret-up':'fa-caret-left'}`);
        doc.find(".tt-profile-stats .tt-col.col-right").appendChild(row);

        row.find(".tt-icon i").addEventListener("click", function(){
            moveLeft(row);
        });
        
        savePreferences();
    }

    function savePreferences(){
        let chosen_keys = [];

        for(let row of doc.findAll(".tt-col.col-left .tt-row:not(.tt-header)")){
            if(row.getAttribute("key")){
                chosen_keys.push(row.getAttribute("key"));
            }
        }

        local_storage.change({"settings": {"profile_stats": {"stats": chosen_keys}}});
    }
}

function getUserId() {
    return doc.find(".basic-information ul.basic-list li:nth-of-type(1) div:nth-of-type(2)").innerText.split("[")[1].replace("]", "");
}

function getRespect(target_list, id) {
    let respect_type = "respect";
    let respect_value;
    let color;

    for (let list in target_list[id]["respect_base"]) {
        if (target_list[id]["respect_base"][list].length > 0) {
            respect_type = "respect_base";
            break;
        }
    }

    let leaves = target_list[id][respect_type]["leave"].length > 0 ? true : false;

    if (leaves)
        respect_value = getAverage(target_list[id][respect_type]["leave"]);
    else {
        let averages = [];

        for (let list in target_list[id][respect_type]) {
            let avrg_of_list = getAverage(target_list[id][respect_type][list]);

            if (avrg_of_list != 0)
                averages.push(avrg_of_list);
        }
        respect_value = getAverage(averages);
    }

    if (respect_type == "respect")
        respect_value = respect_value + "*";
    else if (respect_type == "respect_base") {
        if (leaves)
            color = "#dfffdf";
        else
            color = "#fffdcc";
    }

    if (respect_value == "0*")
        respect_value = "-"

    return [respect_value, color];
}

function getAverage(arr) {
    if (arr.length == 0)
        return 0;

    let sum = 0;
    for (let item of arr) {
        sum += item;
    }
    return parseFloat((sum / arr.length).toFixed(2));
}

function showId(){
    let text = doc.find(`.profile-container .basic-list>li .user-info-value`).innerText;
    doc.find("#skip-to-content").innerText = text;
}

function displayLootLevel(loot_times){
    console.log(loot_times)
    let profile_id = doc.find(`.profile-container .basic-list>li .user-info-value`).innerText.split(" [")[1].replace("]", "");
    
    if(profile_id in loot_times){
        let current_time = parseInt(((new Date().getTime())/ 1000).toFixed(0));
        let next_level = loot_times[profile_id].levels.next;
        let next_loot_time = loot_times[profile_id].timings[next_level].ts;
        let time_left;

        if(next_loot_time - current_time <= 60){  // New info hasn't been fetched yet
            next_level = next_level+1 > 5 ? 1 : next_level+1;
            next_loot_time = loot_times[profile_id].timings[next_level].ts;
            time_left = time_until((next_loot_time - current_time)*1000);
        } else {
            time_left = time_until((next_loot_time - current_time)*1000);
        }
        
        let span = doc.new("span");
            span.setClass("tt-loot-time");
            span.innerText = `Next loot level in: ${time_left}`;
            span.setAttribute("seconds", (next_loot_time - current_time));
        
        doc.find(".profile-wrapper .profile-status .description .sub-desc").appendChild(span);
        
        // Time decrease
        let time_decrease = setInterval(function(){
            let seconds = parseInt(span.getAttribute("seconds"));
            let time_left = time_until((seconds-1)*1000);

            span.innerText = `Next loot in: ${time_left}`;
            span.setAttribute("seconds", seconds-1);
        }, 1000);
    }
}

function addStatusIndicator(){
    let status_icon = doc.find(".icons ul>li");
    let icon_span = doc.new({type: "div", class: status_icon.classList[0], attributes: {
        style: `margin-top: 1px; margin-right: 3px; float: left; background-position: ${window.getComputedStyle(status_icon).getPropertyValue('background-position')};`
    }});
    let text_span = doc.new({type: "span", text: doc.find("#skip-to-content").innerText, attributes: {
        style: `font-size: 22px; color: #333;`
    }});

    doc.find("#skip-to-content").innerText = "";
    doc.find("#skip-to-content").appendChild(icon_span);
    doc.find("#skip-to-content").appendChild(text_span);

    // Event listener
    let status_observer = new MutationObserver(function(mutationsList, observer){
        for(let mutation of mutationsList){
            console.log("MUTATION", mutation);
            if(mutation.type == "childList"){
                console.log(doc.find(".icons ul>li"));
                icon_span.setAttribute("class", doc.find(".icons ul>li").classList[0]);
                icon_span.style.backgroundPosition = window.getComputedStyle(doc.find(".icons ul>li")).getPropertyValue('background-position');
            }
        }
    });
    status_observer.observe(status_icon.parentElement, {childList: true});
}

function displayStakeoutOptions(){
    let heading = doc.new({type: "div", class: "tt-sub-heading", text: "Let me know when this player"});

    let option_okay = doc.new({type: "div", class: "tt-option"});
    let checkbox_okay = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_okay = doc.new({type: "div", text: "is okay"});

    option_okay.appendChild(checkbox_okay);
    option_okay.appendChild(text_okay);

    let option_lands = doc.new({type: "div", class: "tt-option"});
    let checkbox_lands = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_lands = doc.new({type: "div", text: "lands"});

    option_lands.appendChild(checkbox_lands);
    option_lands.appendChild(text_lands);

    let option_online = doc.new({type: "div", class: "tt-option"});
    let checkbox_online = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_online = doc.new({type: "div", text: "comes online"});

    option_online.appendChild(checkbox_online);
    option_online.appendChild(text_online);

    let user_id = getUserId()
    if(stakeouts[user_id]){
        checkbox_okay.checked = stakeouts[user_id].okay;
        checkbox_lands.checked = stakeouts[user_id].lands;
        checkbox_online.checked = stakeouts[user_id].online;
    }

    doc.find("#tt-target-info .content").appendChild(heading);
    doc.find("#tt-target-info .content").appendChild(option_okay);
    doc.find("#tt-target-info .content").appendChild(option_lands);
    doc.find("#tt-target-info .content").appendChild(option_online);

    checkbox_okay.addEventListener("click", function(){
        saveStakoutSettings();
    });
    checkbox_lands.addEventListener("click", function(){
        saveStakoutSettings();
    });
    checkbox_online.addEventListener("click", function(){
        saveStakoutSettings();
    });

    function saveStakoutSettings(){
        if(checkbox_okay.checked || checkbox_lands.checked || checkbox_online.checked){
            local_storage.change({"stakeouts": {
                [getUserId()]: {
                    "okay": checkbox_okay.checked,
                    "lands": checkbox_lands.checked,
                    "online": checkbox_online.checked
                }
            }});
        } else {
            local_storage.get("stakeouts", function(stakeouts){
                delete stakeouts[getUserId()];
                local_storage.set({"stakeouts": stakeouts});
            });
        }
    }
}