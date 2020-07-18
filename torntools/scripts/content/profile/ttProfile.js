var money_key_list = ["networth", "moneymugged", "largestmug", "peopleboughtspent", "receivedbountyvalue", "totalbountyspent", "totalbountyreward", "rehabcost"]
var key_dict = {
    basic: {
        "awards": "Awards",
        "logins": "Logins",
        "networth": "Networth",
        "useractivity": "User Activity",
        "statenhancersused": "Stat Enhancers Used",
    },
    attacks: {
        "attackswon": "Attacks: Won",
        "attackslost": "Attacks: Lost",
        "attacksdraw": "Attacks: Draw",
        "attacksstealthed": "Attacks: Stealthed",
        "attackhits": "Attacks: Total Hits",
        "attackmisses": "Attacks: Misses",
        "attacksassisted": "Attacks: Assisted",
        "attackswonabroad": "Attacks: Won Abroad",
        "highestbeaten": "Attacks: Highest Lvl Beaten",
        "largestmug": "Attacks: Largest Mug",
        "moneymugged": "Attacks: Money Mugged",
        "onehitkills": "Attacks: One Hit Kills",
        "attackdamage": "Attacks: Total Damage",
        "yourunaway": "Attacks: Escaped",
        "unarmoredwon": "Attacks: Unarmored Wins",
        "weaponsbought": "Attacks: Weapons Bought",
        "attackcriticalhits": "Attacks: Critical Hits",
        "bestdamage": "Attacks: Best Damage",
        "bestkillstreak": "Attacks: Best Killstreak",
        "arrestsmade": "Attacks: Arrests",
        "roundsfired": "Attacks: Ammo: Fired",
        "incendiaryammoused": "Attacks: Ammo: Incendiary",
        "piercingammoused": "Attacks: Ammo: Piercing",
        "tracerammoused": "Attacks: Ammo: Tracer",
        "specialammoused": "Attacks: Ammo: Special Total",
        "hollowammoused": "Attacks: Ammo: Hollow Point",
    },
    bounties: {
        "bountiesplaced": "Bounties: Placed",
        "bountiescollected": "Bounties: Completed",
        "totalbountyreward": "Bounties: Rewards",
        "totalbountyspent": "Bounties: Spent On",
        "receivedbountyvalue": "Bounties: Recieved",
        "bountiesreceived": "Bounties: Times Bountied"
    },
    crimes: {
        "selling_illegal_products": "Crimes: Sell illegal products",
        "theft": "Crimes: Theft",
        "auto_theft": "Crimes: Auto theft",
        "drug_deals": "Crimes: Drug deals",
        "computer_crimes": "Crimes: Computer",
        "murder": "Crimes: Murder",
        "fraud_crimes": "Crimes: Fraud",
        "other": "Crimes: Other",
        "total": "Crimes: Total",
        "organisedcrimes": "Crimes: Organised Crimes"
    },
    consumables: {
        "candyused": "Consumables: Candy",
        "energydrinkused": "Consumables: Energy Drinks",
        "consumablesused": "Consumables: Total",
        "alcoholused": "Consumables: Alcohol",
        "boostersused": "Consumables: Boosters"
    },
    contracts: {
        "contractscompleted": "Contracts: Completed",
        "dukecontractscompleted": "Contracts: Duke",
        "missionscompleted": "Contracts: Missions Completed",
        "missioncreditsearned": "Contracts: Miss. Creds Earned"
    },
    defends: {
        "defendswon": "Defends: Won",
        "defendslost": "Defends: Lost",
        "defendsstalemated": "Defends: Stalemated",
        "defendslostabroad": "Defends: Lost Abroad"
    },
    drugs: {
        "cantaken": "Drugs: Cannabis",
        "exttaken": "Drugs: Ecstasy",
        "lsdtaken": "Drugs: LSD",
        "shrtaken": "Drugs: Shrooms",
        "xantaken": "Drugs: Xanax",
        "victaken": "Drugs: Vicodin",
        "drugsused": "Drugs: Total",
        "kettaken": "Drugs: Ketamine",
        "opitaken": "Drugs: Opium",
        "spetaken": "Drugs: Speed",
        "pcptaken": "Drugs: PCP",
        "overdosed": "Drugs: Overdosed"
    },
    finishers: {
        "chahits": "Finishers: Mechanical",
        "axehits": "Finishers: Clubbing",
        "grehits": "Finishers: Temporary",
        "pishits": "Finishers: Pistol",
        "rifhits": "Finishers: Rifle",
        "smghits": "Finishers: SMG",
        "piehits": "Finishers: Piercing",
        "slahits": "Finishers: Slashing",
        "shohits": "Finishers: Shotgun",
        "heahits": "Finishers: Heavy Artillery",
        "machits": "Finishers: Machine Guns",
        "h2hhits": "Finishers: Unarmed"
    },
    items: {
        "itemsbought": "Items: Bought",
        "itemsboughtabroad": "Items: Bought Abroad",
        "itemssent": "Items: Sent",
        "auctionsells": "Items: Auctioned",
        "cityfinds": "Items: Found in City",
        "itemsdumped": "Items: Dumped"
    },
    refills: {
        "nerverefills": "Refills: Nerve",
        "tokenrefills": "Refills: Token",
        "refills": "Refills: Energy"
    },
    revives: {
        "revives": "Revives: Given",
        "revivesreceived": "Revives: Received"
    },
    travel: {
        "argtravel": "Travel: Argentina",
        "mextravel": "Travel: Mexico",
        "dubtravel": "Travel: UAE",
        "hawtravel": "Travel: Hawaii",
        "japtravel": "Travel: Japan",
        "lontravel": "Travel: UK",
        "soutravel": "Travel: South Africa",
        "switravel": "Travel: Switzerland",
        "chitravel": "Travel: China",
        "cantravel": "Travel: Canada",
        "caytravel": "Travel: Cayman Islands",
        "traveltimes": "Travel: Total",
        "traveltime": "Travel: Time Spent"
    },
    other: {
        "auctionswon": "Auctions Won",

        "peopleboughtspent": "Bail Fees Spent",
        "booksread": "Books Read",
        "bloodwithdrawn": "Blood Bags Filled",
    
        "classifiedadsplaced": "Classified Ads Placed",
        "companymailssent": "Company Mail Sent",
    
        "dumpfinds": "Dump Finds",
        "dumpsearches": "Dump Searches",
        "daysbeendonator": "Days Been A Donator",
    
        "failedbusts": "Failed Busts",
        "theyrunaway": "Foes Escaped",
        "friendmailssent": "Friend Mail Sent",
        "factionmailssent": "Faction Mail Sent",

        "peoplebusted": "Jail: Busted",
        "peoplebought": "Jail: Bailed",
        "jailed": "Jail: Total",
        
        "medicalitemsused": "Meds Used",
        "medstolen": "Meds Stolen",
        "meritsbought": "Merits Bought",
        "rehabcost": "Money Spent On Rehab",
        
        "pointsbought": "Points Bought",
        "personalsplaced": "Personal Ads Placed",
        
        "respectforfaction": "Respect Earned",
        "rehabs": "Rehabs Done",
        "racingpointsearned": "Racing: Points Earned",
        "raceswon": "Racing: Won",
        "racesentered": "Racing: Entered",
        
        "spousemailssent": "Spouse Mail Sent",
        "spydone": "Spies Done",
        "cityitemsbought": "Shop Purchases",
        
        "trainsreceived": "Times Trained",
        "mailssent": "Total Mail Sent",
        "hospital": "Times In Hospital",
        "territorytime": "Territory Time",
    
        "virusescoded": "Viruses Coded"
    }
}
var spy_info;

DBloaded().then(function(){
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

        if (shouldDisable()) return

        if(getUserId() == userdata.player_id) return;

        // Profile stats
        let info_container = content.new_container("User Info", {next_element_heading: "Medals", id: "tt-target-info"});
        let profile_stats_div = doc.new({type: "div", class: `profile-stats ${mobile?'tt-mobile':""}`});
        info_container.find(".content").appendChild(profile_stats_div);

        if(!filters.profile_stats.auto_fetch){
            let button = doc.new({type: "div", class: `fetch-button`, text: "Fetch Info via API"});
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
        loadingPlaceholder(profile_stats, true);
        result = await new Promise(function(resolve, reject){
            get_api(`https://api.torn.com/user/${user_id}?selections=personalstats,crimes`, api_key)
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
                    } else if(!data.ok){
                        return resolve({"error": data.error});
                    } else {
                        let modified_result = modifyResult(data.result.personalstats, data.result.criminalrecord, result.compare.data || {}, result.spy);

                        return resolve(modified_result);
                    }
                });
            });
        });
        
        if(!result.error){
            local_storage.change({"cache": {"profile_stats": {[user_id]: result}}});
        }
        loadingPlaceholder(profile_stats, false);
    }

    console.log("result", result);
    spy_info = result.spy;

    if(result.error){
        let error_div = doc.new({type: "div", class: "tt-error-message", text: result.error});
        profile_stats.appendChild(error_div);
        return;
    }

    profile_stats.classList.add("populated");
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

    // Add all to other column
    for(let section in key_dict){
        let section_heading = doc.new({type: "div", class: "tt-row sub-heading"});
        let inner_text = doc.new({type: "div", class: "item", text: capitalize(section)});
        section_heading.appendChild(inner_text);
        col_other.appendChild(section_heading);

        let keys = Object.keys(key_dict[section]);
        keys.sort(function(a,b){
            if(key_dict[section][a] < key_dict[section][b]) return -1;
            if(key_dict[section][b] < key_dict[section][a]) return 1;
            return 0;
        });

        for(let key of keys){
            let row_title = key_dict[section][key];

            let their_value = result[key] || 0;
            let your_value = userdata.personalstats[key] || userdata.criminalrecord[key] || 0;
            
            let their_value_modified, your_value_modified;

            if(money_key_list.includes(key)){
                let neg = their_value < 0 ? true:false;
                their_value_modified = `$${numberWithCommas(Math.abs(their_value), false)}`;
                if(neg) their_value_modified = "-"+their_value_modified;
                
                neg = your_value < 0 ? true:false;
                your_value_modified = `$${numberWithCommas(Math.abs(your_value), false)}`;
                if(neg) your_value_modified = "-"+your_value_modified;
            } else {
                their_value_modified = numberWithCommas(their_value, false);
                your_value_modified = numberWithCommas(your_value, false);
            }

            let row = doc.new({type: "div", class: "tt-row", attributes: {key: key}});
            let key_cell = doc.new({type: "div", text: row_title, class: "item"});
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
        if(col_other.find(`:scope>[key='${stat}']`)){
            col_chosen.appendChild(col_other.find(`:scope>[key='${stat}']`));
        }
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

    // Add Edit button
    let edit_button = doc.new({type: "div", id: "tt-edit", class: "tt-option"});
    let icon = doc.new({type: "i", class: "fas fa-cog"});
    edit_button.appendChild(icon);
    edit_button.innerHTML += " Edit";

    doc.find("#tt-target-info .tt-options").appendChild(edit_button);

    edit_button.onclick = function(event){
        event.stopPropagation();

        if(doc.find(".tt-black-overlay").classList.contains("active")){
            doc.find(".tt-black-overlay").classList.remove("active");
            doc.find(".tt-stats-table .active").classList.remove("tt-highlight-sector");
            doc.find(".tt-title .tt-options .tt-option#tt-edit").classList.remove("tt-highlight-sector");

            for(let item of doc.findAll(".tt-stats-table .active .tt-row:not(.tt-header):not(.sub-heading)")){
                item.onclick = undefined;
            }
        } else {
            doc.find(".tt-black-overlay").classList.add("active");
            doc.find(".tt-stats-table .active").classList.add("tt-highlight-sector");
            doc.find(".tt-title .tt-options .tt-option#tt-edit").classList.add("tt-highlight-sector");

            for(let row of doc.findAll(".tt-stats-table .active .tt-row:not(.tt-header):not(.sub-heading)")){
                row.onclick = function(event){
                    event.stopPropagation();
                    event.preventDefault();

                    row.onclick = undefined;

                    if(hasParent(row, {class: "col-chosen"})){
                        col_other.appendChild(row);
                    } else if(hasParent(row, {class: "col-other"})){
                        col_chosen.appendChild(row);
                    }
        
                    saveProfileStats();
                }
            }            
        }

    }

    function saveProfileStats(){
        let chosen_keys = [];

        for(let row of doc.findAll(".col-chosen .tt-row:not(.header):not(.sub-heading)")){
            if(row.getAttribute("key")){
                chosen_keys.push(row.getAttribute("key"));
            }
        }

        local_storage.change({"filters": {"profile_stats": {"chosen_stats": chosen_keys}}});
    }
}

function showSpyInfo(){
    console.log("spy info", spy_info);
    if(!spy_info) return;
    
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

function modifyResult(personalstats, criminalrecord, comparison_data, spy_data){
    const record = {
        // total: "totalcrimes",
        // other: "othercrimes",
    };
    const comparison = {
        "Xanax Taken": { name: "xantaken", field: "amount" },
        "Attacks Won": { name: "attackswon", field: "amount" },
        "Attacks Lost": { name: "attackslost", field: "amount" },
    };

    for (let key in record) {
        if (!(key in criminalrecord)) continue;

        criminalrecord[record[key]] = criminalrecord[key];
        delete criminalrecord[key];
    }

    for (let key in comparison) {
        if (!(key in comparison_data)) continue;

        let r = comparison[key];

        if (r.field) comparison_data[r.name] = comparison_data[key][r.field]
        else comparison_data[r.name] = comparison_data[key];

        delete comparison_data[key];
    }
    delete comparison_data["Networth"];

    let data = {...personalstats, ...criminalrecord, ...comparison_data, spy: {...spy_data}, date: new Date().toString()}
    return data;
}