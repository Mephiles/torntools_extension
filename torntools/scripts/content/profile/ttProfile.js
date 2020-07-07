var money_key_list = ["networth", "moneymugged", "largestmug", "peopleboughtspent", "receivedbountyvalue"]
var key_dict = {
    "useractivity": "User Activity",
    "itemsbought": "Items Bought",
    "pointsbought": "Points Bought",
    "itemsboughtabroad": "Items Bought Abroad",
    "weaponsbought": "Weapons Bought",
    "itemssent": "Items Sent",
    "auctionswon": "Auctions Won",
    "auctionsells": "Items Auctioned",
    "attackswon": "Attacks Won",
    "attackslost": "Attacks Lost",
    "attacksdraw": "Attacks Drawn",
    "bestkillstreak": "Best Killstreak",
    "moneymugged": "Money Mugged",
    "attacksstealthed": "Attacks Stealthed",
    "attackhits": "Attack Hits",
    "attackmisses": "Attack Misses",
    "attackdamage": "Total Damage",
    "attackcriticalhits": "Critical Hits",
    "respectforfaction": "Respect Earned",
    "onehitkills": "One Hit Kills",
    "defendswon": "Def. Won",
    "defendslost": "Def. Lost",
    "defendsstalemated": "Def. Stalemated",
    "roundsfired": "Ammo Fired",
    "yourunaway": "Times Escaped",
    "theyrunaway": "Foes Escaped",
    "highestbeaten": "Highest Level Beaten",
    "peoplebusted": "People Busted",
    "failedbusts": "Failed Busts",
    "peoplebought": "People Bailed",
    "peopleboughtspent": "Bail Fees Spent",
    "virusescoded": "Viruses Coded",
    "cityfinds": "Items Found",
    "traveltimes": "Time Traveled",
    "bountiesplaced": "Bounties Placed",
    "bountiesreceived": "Times Bountied",
    "bountiescollected": "Bounties Completed",
    "totalbountyreward": "Bounty Rewards",
    "revives": "Revives Given",
    "revivesreceived": "Revive Received",
    "medicalitemsused": "Meds Used",
    "statenhancersused": "Stat Enhancers Used",
    "trainsreceived": "Times Trained",
    "totalbountyspent": "Spent On Bounties",
    "drugsused": "Drugs Used",
    "overdosed": "Times Overdosed",
    "meritsbought": "Merits Bought",
    "logins": "Logins",
    "personalsplaced": "Personal Ads Placed",
    "classifiedadsplaced": "Classified Ads Placed",
    "mailssent": "Total Mail Sent",
    "friendmailssent": "Friend Mail Sent",
    "factionmailssent": "Faction Mail Sent",
    "companymailssent": "Company Mail Sent",
    "spousemailssent": "Spouse Mail Sent",
    "largestmug": "Largest Mug",
    "medstolen": "Meds Stolen",
    "spydone": "Spies Done",
    "cantaken": "Cannabis Taken",
    "exttaken": "Ecstasy Taken",
    "lsdtaken": "LSD taken",
    "shrtaken": "Shrooms Taken",
    "xantaken": "Xanax Taken",
    "victaken": "Vicodin Taken",
    "chahits": "Mechanical Finishers",
    "axehits": "Clubbing Finishers",
    "grehits": "Temporary Finishers",
    "pishits": "Pistol Finishers",
    "rifhits": "Rifle FInishers",
    "smghits": "SMG Finishers",
    "piehits": "Piercing Finishers",
    "slahits": "Slashing Finishers",
    "argtravel": "Argentina Travel",
    "mextravel": "Mexico Travel",
    "dubtravel": "UAE Travel",
    "hawtravel": "Hawaii Travel",
    "japtravel": "Japan Travel",
    "lontravel": "UK Travel",
    "soutravel": "South Africa Travel",
    "switravel": "Switzerland Travel",
    "chitravel": "China Travel",
    "cantravel": "Canada Travel",
    "dumpfinds": "Dump Finds",
    "dumpsearches": "Dump Searches",
    "itemsdumped": "Items Dumped",
    "daysbeendonator": "Days Been A Donator",
    "caytravel": "Cayman Travel",
    "jailed": "Times In Jail",
    "hospital": "Times In Hospital",
    "kettaken": "Ketamine Taken",
    "shohits": "Shotgun Finishers",
    "opitaken": "Opium Taken",
    "heahits": "Heavy Art. Finishers",
    "spetaken": "Speed Taken",
    "attacksassisted": "Attacks Assisted",
    "bloodwithdrawn": "Blood Bags Filled",
    "networth": "Networth",
    "missionscompleted": "Missions Completed",
    "missioncreditsearned": "Miss. Creds Earned",
    "contractscompleted": "Contracts Completed",
    "dukecontractscompleted": "Duke Contracts",
    "pcptaken": "PCP Taken",
    "h2hhits": "Unarmed Finishers",
    "unarmoredwon": "Unarmored Wins",
    "arrestsmade": "Arrests Made",
    "territorytime": "Territory Time",
    "consumablesused": "Consumables Used",
    "candyused": "Candy Used",
    "alcoholused": "Alcohol Used",
    "energydrinkused": "Energy Drinks Used",
    "nerverefills": "Nerve Refills",
    "tokenrefills": "Token Refills",
    "organisedcrimes": "Organised Crimes",
    "booksread": "Books Read",
    "traveltime": "Time Spent Traveling",
    "boostersused": "Boosters Used",
    "rehabs": "Rehabs Done",
    "rehabcost": "Money Spent On Rehab",
    "machits": "Machine Gun Finishers",
    "awards": "Awards",
    "bestdamage": "Best Damage",
    "racingpointsearned": "Racing Points Earned",
    "raceswon": "Races Won",
    "racesentered": "Races Entered",
    "specialammoused": "Special AMmo Used",
    "cityitemsbought": "Shop Purchases",
    "hollowammoused": "Hollow Point Ammo Used",
    "piercingammoused": "Piercing Ammo Used",
    "tracerammoused": "Tracer Ammo Used",
    "incendiaryammoused": "Incendiary Ammo Used",
    "attackswonabroad": "Attacks Won Abroad",
    "defendslostabroad": "Defends Lost Abroad",
    "refills": "Refills",
    "receivedbountyvalue": "Recieved Bounties"
}
var spy_info;

profileLoaded().then(async function(){
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

    if((extensions.doctorn == true || extensions.doctorn == "force_true") && !settings.force_tt){
        return;
    }

    if(getUserId() == userdata.player_id) return;

    // Profile stats
    let info_container = content.new_container("User Info", {next_element_heading: "Medals", id: "tt-target-info"});
    let profile_stats_div = doc.new({type: "div", class: `profile-stats ${mobile?'tt-mobile':""}`});
    info_container.find(".content").appendChild(profile_stats_div);

    if(!filters.profile_stats.auto_fetch){
        let button = doc.new({type: "div", class: `fetch-button ${mobile?"tt-mobile":""}`, text: "Fetch Info via API"});
        profile_stats_div.appendChild(button);

        button.addEventListener("click", async function(){
            button.remove();
            await displayProfileStats();
            // Show Spy info
            showSpyInfo();
        });
    } else {
        await displayProfileStats();
        // Show Spy info
        showSpyInfo();
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
    // Add hr separator
    doc.find("#tt-target-info .content").appendChild(doc.new({type: "hr"}));

    let user_id = getUserId();
    let content_container = doc.find("#tt-target-info .content");

    if (!targets[user_id]){
        let span = doc.new({type: "span", class: "no-btl-data", text: "No battle data on user.", });
        content_container.appendChild(span);
    } else {
        let table = doc.new({type: "div", class: `tt-table ${mobile?"tt-mobile":""}`});

        let headings = [
            { name: "Wins", type: "win", class: "good tt-item" },
            { name: "Mugs", type: "mug", class: "good tt-item tt-advanced" },
            { name: "Leaves", type: "leave", class: "good tt-item tt-advanced" },
            { name: "Hosps", type: "hosp", class: "good tt-item tt-advanced" },
            { name: "Arrests", type: "arrest", class: "good tt-item tt-advanced" },
            { name: "Specials", type: "special", class: "good tt-item tt-advanced" },
            { name: "Assists", type: "assist", class: "good tt-item tt-advanced" },
            { name: "Defends", type: "defend", class: "good tt-item tt-advanced" },
            { name: "Lost", type: "lose", class: "new-section bad tt-item" },
            { name: "Defends lost", type: "defend_lose", class: "bad tt-item tt-advanced" },
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
            
            if(mobile){
                th.classList.add("tt-mobile");
            }

            header_row.appendChild(th);
        }

        // data row
        let row = doc.new("div");
        row.setClass("tt-row");

        for (let heading of headings) {
            let td = doc.new("div");
            td.setClass(heading.class);

            if(mobile){
                td.classList.add("tt-mobile");
            }

            if (heading.name == "Respect") {
                let [value, color] = getRespect(targets, user_id);
                td.innerText = value;
                td.style.backgroundColor = color;
            } else{
                td.innerText = targets[user_id][heading.type];
            }

            row.appendChild(td);
        }

        // compiling
        table.appendChild(header_row);
        table.appendChild(row);
        content_container.appendChild(table);
    }

    content_container.appendChild(doc.new({type: "hr"}));
}

async function displayProfileStats(){
    let user_id = getUserId();
    let profile_stats = doc.find("#tt-target-info .profile-stats");
    let result;

    if(cache && cache.profile_stats[user_id]){
        result = cache.profile_stats[user_id];
    } else {
        result = await new Promise(function(resolve, reject){
            get_api(`https://api.torn.com/user/${user_id}?selections=personalstats`, api_key)
            .then(data => {
                fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=spy&target=${user_id}`)
                .then(async response => {
                    let result = await response.json();

                    if(result.error){
                        if(result.error.indexOf("User not found") > -1){
                            return resolve({"error": `Can't display user stats because no TornStats account was found. Please register an account @ www.tornstats.com`});
                        } else {
                            return resolve({"error": result.error});
                        }
                    } else {
                        return resolve({...data.result.personalstats, ...result.compare.data, "spy": {...result.spy}, "date": new Date().toString()});
                    }
                });
            });
        });
        local_storage.change({"cache": {"profile_stats": {[user_id]: result}}});
    }

    console.log("result", result);
    spy_info = result.spy;

    if(result.error){
        let error_div = doc.new({type: "div", class: "tt-error-message", text: result.error});
        profile_stats.appendChild(error_div);
    } else {

    }

    let table = doc.new({type: "div", class: `tt-stats-table ${mobile?'tt-mobile':""}`});
    let col_chosen = doc.new({type: "div", class: "col-chosen active"});
    let col_other = doc.new({type: "div", class: "col-other"});

    let header = doc.new({type: "div", class: "tt-row tt-header"});
    for(let heading of ["Stat", "Them", "You"]){
        let item = doc.new({type: "div", class: "item", text: heading});
        header.appendChild(item);
    }
    let header_other = doc.new({type: "div", class: "tt-row tt-header"});
    for(let heading of ["Stat", "Them", "You"]){
        let item = doc.new({type: "div", class: "item", text: heading});
        header_other.appendChild(item);
    }

    col_chosen.appendChild(header);
    col_other.appendChild(header_other)
    table.appendChild(col_chosen);
    table.appendChild(col_other);
    profile_stats.appendChild(table);

    for(let key of Object.keys(result).sort()){
        if(["Xanax Taken", "Attacks Won", "Defends Won", "Networth", "spy", "date"].includes(key)) continue;

        let their_value, your_value, their_value_modified, your_value_modified;
        if(typeof result[key] == "object"){
            their_value = result[key].amount;
            your_value = result[key].amount + result[key].difference;
        } else {
            their_value = result[key];
            your_value = userdata.personalstats[key] || 0;
        }

        if(money_key_list.includes(key)){
            let negative = their_value < 0 ? true : false;
            their_value_modified = "$"+numberWithCommas(Math.abs(their_value), false);
            if(negative) their_value_modified = "-"+their_value;

            negative = your_value < 0 ? true : false;
            your_value_modified = "$"+numberWithCommas(Math.abs(your_value), false);
            if(negative) your_value_modified = "-"+your_value;
        } else {
            their_value_modified = numberWithCommas(their_value, false);
            your_value_modified = numberWithCommas(your_value, false);
        }

        let row = doc.new({type: "div", class: "tt-row", attributes: {key: key}});
        let key_cell = doc.new({type: "div", text: key_dict[key] || key, class: "item"});
        let their_cell = doc.new({type: "div", text: their_value_modified, class: "item"});
        let your_cell = doc.new({type: "div", text: your_value_modified, class: "item"});

        if(their_value > your_value){
            your_cell.classList.add("negative");
            their_cell.classList.add("positive");
        } else if(their_value < your_value){
            their_cell.classList.add("negative");
            your_cell.classList.add("positive");
        }

        row.appendChild(key_cell)
        row.appendChild(their_cell)
        row.appendChild(your_cell)
        col_other.appendChild(row);

        row.onclick = function(){
            if(hasParent(row, {class: "col-chosen"})){
                col_other.appendChild(row);
            } else if(hasParent(row, {class: "col-other"})){
                col_chosen.appendChild(row);
            }

            saveProfileStats();
        }

    }

    col_other.onclick = function(){
        if(!col_other.classList.contains("active")){
            col_other.classList.add("active");
            col_chosen.classList.remove("active");
            table.classList.add("active");
        }
    }
    col_chosen.onclick = function(){
        if(!col_chosen.classList.contains("active")){
            col_chosen.classList.add("active");
            col_other.classList.remove("active");
            table.classList.remove("active");
        }
    }

    // Move chosen ones
    for(let stat of filters.profile_stats.chosen_stats){
        col_chosen.appendChild(col_other.find(`:scope>[key='${stat}']`));
    }

    // Footer
    let footer_div = doc.new({type: "div", class: "tt-footer"});
    let footer_text = doc.new({type: "div", text: "Automatically load info"});
    let footer_input = doc.new({type: "input", attributes: {type: "checkbox"}});
    footer_div.appendChild(footer_text);
    footer_div.appendChild(footer_input);
    doc.find("#tt-target-info .content").insertBefore(footer_div, doc.find("#tt-target-info .content .profile-stats").nextElementSibling)

    if(filters.profile_stats.auto_fetch){
        footer_input.checked = true;
    }

    footer_input.onclick = function(){
        local_storage.change({"filters": {"profile_stats": {"auto_fetch": footer_input.checked}}});
    };

    // Fix overflows
    for(let el of table.findAll(".tt-row .item")){
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

    function saveProfileStats(){
        let chosen_keys = [];

        for(let row of doc.findAll(".col-chosen .tt-row:not(.header)")){
            if(row.getAttribute("key")){
                chosen_keys.push(row.getAttribute("key"));
            }
        }

        local_storage.change({"filters": {"profile_stats": {"chosen_stats": chosen_keys}}});
    }
}

function showSpyInfo(){
    console.log("spy info", spy_info);
    
    // Add hr separator
    let hr = doc.new({type: "hr"})
    doc.find("#tt-target-info .content").insertBefore(hr, doc.find("#tt-target-info .content .tt-footer").nextElementSibling);

    let spy_section = doc.new({type: "div", class: "spy-section"});
    doc.find("#tt-target-info .content").insertBefore(spy_section, hr.nextElementSibling);

    if(!spy_info.status){
        let div = doc.new({type: "div", class: "tt-spy-info", text: spy_info.message});
        spy_section.appendChild(div);
    } else {
        let heading = doc.new({type: "div", class: "spy-heading", text: `Spy type: ${spy_info.type} (${spy_info.difference})`});
        spy_section.appendChild(heading);

        let table = doc.new({type: "div", class: "spy-table"});
        let header = doc.new({type: "div", class: "tt-row tt-header"});
        let item_key = doc.new({type: "div", class: "item", text: "Stat"});
        let item_them = doc.new({type: "div", class: "item", text: "Them"});
        let item_you = doc.new({type: "div", class: "item", text: "You"});
        header.appendChild(item_key);
        header.appendChild(item_them);
        header.appendChild(item_you);
        table.appendChild(header);

        for(let stat of ["strength", "defense", "speed", "dexterity", "total"]){
            let row = doc.new({type: "div", class: "tt-row"});
            let item_key = doc.new({type: "div", class: "item", text: capitalize(stat)});
            let item_them = doc.new({type: "div", class: "item", text: numberWithCommas(parseInt(spy_info[stat]), false)});
            let item_you = doc.new({type: "div", class: "item", text: numberWithCommas(parseInt(userdata[stat]), false)});

            if(parseInt(spy_info[stat]) > parseInt(userdata[stat])){
                item_you.classList.add("negative");
                item_them.classList.add("positive");
            } else if(parseInt(spy_info[stat]) < parseInt(userdata[stat])){
                item_them.classList.add("negative");
                item_you.classList.add("positive");
            }

            row.appendChild(item_key);
            row.appendChild(item_them);
            row.appendChild(item_you);
            table.appendChild(row);
        }

        let score_row = doc.new({type: "div", class: "tt-row"});
        let score_item_key = doc.new({type: "div", class: "item", text: "Score"});
        let score_item_them = doc.new({type: "div", class: "item", text: numberWithCommas(parseInt(spy_info.target_score), false)});
        let score_item_you = doc.new({type: "div", class: "item", text: numberWithCommas(parseInt(spy_info.your_score), false)});

        if(parseInt(spy_info.target_score) > parseInt(spy_info.your_score)){
            score_item_you.classList.add("negative");
            score_item_them.classList.add("positive");
        } else if(parseInt(spy_info.target_score) < parseInt(spy_info.your_score)){
            score_item_them.classList.add("negative");
            score_item_you.classList.add("positive");
        }

        score_row.appendChild(score_item_key);
        score_row.appendChild(score_item_them);
        score_row.appendChild(score_item_you);
        table.appendChild(score_row);
        spy_section.appendChild(table);
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
    let user_id = getUserId();

    let stakeout_div = doc.new({type: "div", class: "stakeout-section"});
    doc.find("#tt-target-info .content").appendChild(stakeout_div);

    let watchlist_wrap = doc.new({type: "div", class: "tt-checkbox-wrap"});
    let input = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text = doc.new({type: "div", text: "Add this player to Watch List"});
    watchlist_wrap.appendChild(input);
    watchlist_wrap.appendChild(text);
    stakeout_div.appendChild(watchlist_wrap);

    for(let user of watchlist){
        if(user.id == user_id){
            input.checked = true;
        }
    }

    input.onclick = function(){
        saveStakeoutSettings();
    }

    let heading = doc.new({type: "div", class: "tt-sub-heading", text: "Let me know when this player:"});
    stakeout_div.appendChild(heading);

    let option_okay = doc.new({type: "div", class: "tt-checkbox-wrap"});
    let checkbox_okay = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_okay = doc.new({type: "div", text: "is okay"});
    option_okay.appendChild(checkbox_okay);
    option_okay.appendChild(text_okay);

    let option_lands = doc.new({type: "div", class: "tt-checkbox-wrap"});
    let checkbox_lands = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_lands = doc.new({type: "div", text: "lands"});
    option_lands.appendChild(checkbox_lands);
    option_lands.appendChild(text_lands);

    let option_online = doc.new({type: "div", class: "tt-checkbox-wrap"});
    let checkbox_online = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text_online = doc.new({type: "div", text: "comes online"});
    option_online.appendChild(checkbox_online);
    option_online.appendChild(text_online);

    if(stakeouts[user_id]){
        checkbox_okay.checked = stakeouts[user_id].okay;
        checkbox_lands.checked = stakeouts[user_id].lands;
        checkbox_online.checked = stakeouts[user_id].online;
    }

    stakeout_div.appendChild(option_okay);
    stakeout_div.appendChild(option_lands);
    stakeout_div.appendChild(option_online);

    checkbox_okay.onclick = function(){
        saveStakeoutSettings();
    };
    checkbox_lands.onclick = function(){
        saveStakeoutSettings();
    };
    checkbox_online.onclick = function(){
        saveStakeoutSettings();
    };

    function saveStakeoutSettings(){

        if(input.checked){
            local_storage.get("watchlist", function(watchlist){
                let is_in_list = false;
                for(let item of watchlist){
                    if(item.id == user_id){
                        is_in_list = true;
                        break;
                    }
                }

                if(!is_in_list){
                    watchlist.push({
                        id: user_id,
                        username: getUsername(),
                        status: getStatus(),
                        traveling: getTraveling()
                    });
                }
                local_storage.set({"watchlist": watchlist});
            });
        } else {
            local_storage.get("watchlist", function(watchlist){
                for(let item of watchlist){
                    if(item.id == user_id){
                        watchlist.splice(watchlist.indexOf(item), 1);
                        break;
                    }
                }
                local_storage.set({"watchlist": watchlist});
            });
        }

        if(checkbox_okay.checked == true || checkbox_lands.checked  == true || checkbox_online.checked == true ){
            local_storage.change({"stakeouts": {
                [user_id]: {
                    "okay": checkbox_okay.checked,
                    "lands": checkbox_lands.checked,
                    "online": checkbox_online.checked
                }
            }});
        } else {
            local_storage.get("stakeouts", function(stakeouts){
                delete stakeouts[user_id];
                local_storage.set({"stakeouts": stakeouts});
            });
        }
    }
}

function getUsername(){
    return doc.find(".basic-information ul.basic-list li:nth-of-type(1) div:nth-of-type(2)").innerText.split(" [")[0].trim();
}

function getStatus(){
    let desc = doc.find(".main-desc").innerText;

    if(desc.indexOf("Okay") > -1){
        return "okay";
    } else if(desc.indexOf("hospital") > -1){
        return "hospital";
    } else if(desc.indexOf("jail") > -1){
        return "jail";
    }
}

function getTraveling(){
    let desc = doc.find(".main-desc").innerText;

    if(desc.indexOf("Traveling") > -1 || desc.indexOf("Returning") > -1){
        return true;
    }
    return false;
}