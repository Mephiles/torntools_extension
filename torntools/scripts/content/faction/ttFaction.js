let ownFaction = false;
let member_info_added = false;

requireDatabase().then(() => {
    doc.find("head").appendChild(doc.new({
        type: "script",
        attributes: {type: "text/javascript", src: chrome.runtime.getURL("/scripts/content/faction/ttFactionInject.js")}
    }));

    window.addEventListener("tt-xhr", (event) => {
        const {page, json, xhr} = event.detail;
        if (!json) return;

        if (page === "factions") {
            const params = new URLSearchParams(xhr.requestBody);
            const step = params.get("step");

            if (step === "mainnews" && parseInt(params.get("type")) === 4 && settings.pages.faction.armory) {
                newstabLoaded("armory").then(shortenArmoryNews);
            }
        }
    });

    requireContent().then(() => {
        console.log("TT - Faction");

        if (getSearchParameters().get("step") === "your") {
            ownFaction = true;

            switch(subpage()){
                case "main":
                    loadMain();
                    break;
                case "info":
                    loadInfo();
                    break;
                case "crimes":
                    loadCrimes();
                    break;
                case "upgrades":
                    loadUpgrades();
                    break;
                case "armoury":
                    loadArmory();
                    break;
                default:
                    break;
            }

            // Main page
            doc.find(".faction-tabs li[data-case=main]").addEventListener("click", loadMain);

            // Info page
            doc.find(".faction-tabs li[data-case=info]").addEventListener("click", loadInfo);

            // Crimes page
            doc.find(".faction-tabs li[data-case=crimes]").addEventListener("click", loadCrimes);

            // Upgrades page
            doc.find(".faction-tabs li[data-case=upgrades]").addEventListener("click", loadUpgrades);

            // Armory page
            doc.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);
        } else {
            ownFaction = false;

            loadInfo();
        }
    });
});

function loadMain() {
    subpageLoaded("main").then(function(){
        fullInfoBox("main");
    });
}

function loadInfo() {
    if (ownFaction) {
        subpageLoaded("info").then(function(){
            fullInfoBox("info");

            if(settings.pages.faction.armory_worth) armoryWorth();
        });
    }

    requirePlayerList(".members-list .table-body").then(function(){
        if(settings.pages.faction.member_info) showUserInfo();

        // Player list filter
        let list = doc.find(".members-list .table-body");
        let title = list.previousElementSibling;

        addFilterToTable(list, title);
    });
}

function loadCrimes() {
    if(!doc.find(".faction-crimes-wrap.tt-modified")){
        subpageLoaded("crimes").then(function(){
            if(settings.pages.faction.oc_time && Object.keys(oc).length > 0){
                ocTimes(oc, settings.format);
            } else if(Object.keys(oc).length === 0) {
                console.log("NO DATA (might be no API access)");
            }

            if(settings.pages.faction.oc_advanced){
                openOCs();
                showAvailablePlayers();
                showRecommendedNNB();
                showNNB();
            }

            doc.find(".faction-crimes-wrap").classList.add("tt-modified");
        });
    }
}

function loadUpgrades() {
    upgradesInfoListener();
}

function loadArmory() {
    if(settings.pages.items.drug_details) drugInfo();

    armoryTabsLoaded().then(() => {
        armoryFilter();

        if (settings.pages.items.highlight_bloodbags !== "none") highlightBloodBags();
    });
}

function ocTimes(oc, format){
    let crimes = doc.findAll(".organize-wrap .crimes-list>li");
    for(let crime of crimes){
        let crime_id = crime.find(".details-wrap").getAttribute("data-crime");

        let finish_time;
        let span = doc.new({type: "span", class: "tt-oc-time"});

        if(oc[crime_id]){
            finish_time = oc[crime_id].time_ready;
            // noinspection JSUnusedLocalSymbols
            let [day, month, year, hours, minutes, seconds]  = dateParts(new Date(finish_time*1000));

            span.innerText =`${formatTime([hours, minutes, 0], format.time)} | ${formatDate([day, month, 0], format.date)}`;
        } else {
            span.innerText = "N/A";
        }

        crime.find(".status").appendChild(span);
    }
}

function shortenArmoryNews(){
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
        let li = doc.new({type: "li"});
        let date = doc.new({type: "span", class: "date"});
        let info = doc.new({type: "span", class: "info"});
        let a = doc.new({type: "a", text: db[key].username, attributes: {href: db[key].link}});
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

            if (upper_time !== lower_time || upper_date !== lower_date) {
                date.appendChild(upper_date_span);
                date.appendChild(separator);
            }
            date.appendChild(lower_date_span);
        } else {
            date.innerText = db[key].last_date;
        }

        let keywords = ["used", "filled", "lent", "retrieved", "returned", "deposited", "gave"];
        let inner_span = doc.new("span");

        for(let keyword of keywords){
            if(key.includes(keyword)){
                if(key.includes("one")){
                    let amount_span = doc.new({type: "span", text: " "+db[key].count+"x", attributes: {style: "font-weight: 600"}});
                    inner_span.innerHTML += ` ${keyword}`;
                    inner_span.appendChild(amount_span);
                    inner_span.innerHTML += key.split(" one")[1];
                } else {
                    inner_span.innerText = ` ${keyword}` + key.split(keyword)[1];
                }
                break;
            }
        }

        // if(key.indexOf("used one") > -1 || key.indexOf("filled one") > -1){
        //     let used = key.indexOf("used one") > -1;

        //     let left_side = doc.new("span");
        //     left_side.innerText = used ? " used " : " filled ";
        //     let amount = doc.new("span");
        //     amount.innerText = db[key].count + "x ";
        //     amount.style.fontWeight = "600";
        //     let right_side = doc.new("span");
        //     right_side.innerText = used ? key.split(" used one ")[1] : key.split(" filled one ")[1];

        //     inner_span.appendChild(left_side);
        //     inner_span.appendChild(amount);
        //     inner_span.appendChild(right_side);
        // } else if(key.indexOf("lent one") > -1){
        //     inner_span.innerText = " lent one"+key.split(" lent one")[1];
        // } else if(key.indexOf("retrieved one") > -1){
        //     inner_span.innerText = " retrieved one"+key.split(" retrieved one")[1];
        // } else if(key.indexOf("returned one") > -1){
        //     inner_span.innerText = " returned one"+key.split(" returned one")[1];
        // } else if(key.includes("deposited one")){
        //     inner_span.innerText = " deposited one"+key.split(" deposited one")[1];
        // } else if(key.includes("gave one")){
        //     inner_span.innerText = " gave one"+key.split(" gave one")[1];
        // } else {
        //     inner_span.innerText = key;
        // }

        info.appendChild(inner_span);
        li.appendChild(date);
        li.appendChild(info);
        doc.find("#tab4-4 .news-list").appendChild(li);
    }
}

function subpage(){
    let hash = window.location.hash.replace("#/", "");
    if(hash === "" || hash === "war/chain"){
        return "main";
    }

    if(getHashParameters().has("tab")){
        return getHashParameters().get("tab")
    }
    
    return "";
}

function subpageLoaded(page){
    return new Promise(function(resolve){
        let checker = setInterval(function(){
            console.log("checking", page);
            if(page === "crimes" && doc.find("#faction-crimes .organize-wrap ul.crimes-list li")){
                resolve(true);
                return clearInterval(checker);
            } else if(page === "main" && !doc.find("#faction-main div[data-title='announcement']+div .ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            } else if(page === "info" && !doc.find("#faction-info .ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            } else if(page === "upgrades" && !doc.find("#faction-upgrades>.ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function newstabLoaded(tab){
    return new Promise(function(resolve){
        let checker = setInterval(function(){
            if(tab === "armory" && doc.find("#tab4-4 .news-list li:not(.last)")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 25);
    });
}

function openOCs(){
    let crimes = doc.findAll(".organize-wrap .crimes-list>li");
    
    for(let crime of crimes){
        if(crime.find(".status .br") || crime.find(".status .bold").innerText.trim() !== "Ready"){
            continue;
        }

        let all_players_ready = true;
        for(let player of crime.findAll(".details-list>li")){
            if(player.find(".member").innerText === "Member") continue;

            if(player.find(".stat").innerText !== "Okay"){
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
                if(mobile){
                    player.find(".member").classList.add("torntools-modified");
                    player.find(".stat").classList.add("torntools-modified");
                    player.find(".member").classList.add("torntools-mobile");
                    player.find(".level").classList.add("torntools-mobile");
                    player.find(".stat").classList.add("torntools-mobile");
                }    

                if(player.find(".member").innerText === "Member"){
                    let col = doc.new({type: "li", class: `tt-nnb ${mobile? "torntools-mobile":""}`, text: mobile?"NNB":"TornStats NNB"});
                    player.find(".stat").parentElement.insertBefore(col, player.find(".stat"));

                    continue;
                }

                let player_id = player.find(".h").getAttribute("href").split("XID=")[1];
                let nnb = result.members[player_id] ? result.members[player_id].natural_nerve : "N/A";

                let col = doc.new({type: "li", class: `tt-nnb ${mobile? "torntools-mobile":""}`, text: nnb});
                player.find(".stat").parentElement.insertBefore(col, player.find(".stat"));
            }
        }

        // Populate new crime selection
        for(let player of doc.findAll(".plans-list .item")){
            player.find(".offences").classList.add("torntools-modified");
            if(mobile){
                player.find(".member").classList.add("torntools-modified");
                player.find(".level").classList.add("torntools-modified");
                player.find(".act").classList.add("torntools-modified");
                player.find(".member").classList.add("torntools-mobile");
                player.find(".level").classList.add("torntools-mobile");
                player.find(".act").classList.add("torntools-mobile");
                player.find(".offences").classList.add("torntools-mobile");
            } 

            if(player.find(".member").innerText.trim() === "Member"){
                let col = doc.new({type: "li", class: `tt-nnb short ${mobile?"torntools-mobile":""}`, text: mobile?"NNB":"TornStats NNB"});
                player.find(".act").parentElement.insertBefore(col, player.find(".act"));

                continue;
            }

            let player_id = player.find(".h").getAttribute("href").split("XID=")[1];
            let nnb = result.members[player_id] ? result.members[player_id].natural_nerve : "N/A";

            let col = doc.new({type: "li", class: `tt-nnb short ${mobile?"torntools-mobile":""}`, text: nnb});
            player.find(".act").parentElement.insertBefore(col, player.find(".act"));
        }
    });
}

function fullInfoBox(page){
    let info_box;
    if(getSearchParameters().get("step") === "profile"){
        info_box = doc.find("#factions div[data-title='description']").nextElementSibling;
    } else if(page === "main"){
        info_box = doc.find("div[data-title='announcement']").nextElementSibling;
    } else if(page === "info"){
        info_box = doc.find("#faction-info .faction-info-wrap.faction-description .faction-info");
    }

    let title = info_box.previousElementSibling;

    if(title.classList.contains("tt-modified")){
        return;
    }
    
    title.classList.add("title");
    title.classList.add("tt-modified");

    let key;
    if(page === "main"){
        key = "announcements_page_full";
    } else if(page === "info"){
        key = "info_page_full";
    }

    let options_div = doc.new({type: "div", class: "tt-options"});

    let setting_div = doc.new({type: "div", class: "tt-checkbox-wrap in-title"});
    let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
    let text = doc.new({type: "div", text: "Show full page"});

    if(settings.pages.faction[key]){
        checkbox.checked = true;
        info_box.classList.toggle("tt-force-full");
    }

    setting_div.appendChild(checkbox);
    setting_div.appendChild(text);
    options_div.appendChild(setting_div);
    title.appendChild(options_div);

    checkbox.onclick = function(){
        info_box.classList.toggle("tt-force-full");
        
        ttStorage.change({"settings": {"pages": {"faction": {[key]: checkbox.checked}}}})
    }
}

function upgradesInfoListener(){
    subpageLoaded("upgrades").then(function(){
        let upgrades_info_listener = new MutationObserver(function(mutations){
            for(let mutation of mutations){
                if(mutation.type === "childList"){
                    if(mutation.addedNodes[0]){
                        for(let added_node of mutation.addedNodes){
                            if(added_node.classList && added_node.classList.contains("confirm") && added_node.classList.length >= 3){
                                let available_respect = parseInt(doc.find(".residue-respect").innerText.replace(/,/g, ""));
                                let required_respect;
                                let needed_respect;

                                for(let text of added_node.findAll(".text")){
                                    if(text.innerText.indexOf("Requires:") > -1){
                                        required_respect = parseInt(text.innerText.trim().split("Requires: ")[1].split(" respect")[0].replace(/,/g, ""));
                                        
                                        needed_respect = required_respect - available_respect;
                                        if(needed_respect < 0) needed_respect = 0;
        
                                        let span = doc.new({type: "span", text: ` (${numberWithCommas(needed_respect)} respect to go)`});
                                        text.appendChild(span);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        upgrades_info_listener.observe(doc.find(".skill-tree"), {childList: true, subtree: true});
    });
}

function armoryWorth(){
    fetchApi(`https://api.torn.com/faction/?selections=weapons,armor,temporary,medical,drugs,boosters,cesium,currency`, api_key)
    .then(function(result){
        if (!result.ok) {
            if (result.error === 'Incorrect ID-entity relation') {
                let li = doc.new({type: "li", text: `Armory value: NO API ACCESS`});
                doc.find(".f-info-wrap .f-info.right").insertBefore(li, doc.find(".f-info-wrap .f-info.right>li:nth-of-type(2)"));
            }
            return false;
        }

        result = result.result;
        console.log("result", result);

        let total = 0;
        let lists = ["weapons", "armor", "temporary", "medical", "drugs", "boosters"];

        for(let type of lists){
            if(result[type]){
                for(let item of result[type]){
                    total += itemlist.items[item.ID].market_value * item.quantity;
                }
            }
        }

        // Cesium
        if(result.cesium){

        }

        // Points
        total += result.points * torndata.pawnshop.points_value;

        let li = doc.new({type: "li", text: `Armory value: $${numberWithCommas(total, false)}`});
        doc.find(".f-info-wrap .f-info.right").insertBefore(li, doc.find(".f-info-wrap .f-info.right>li:nth-of-type(2)"));
    });
}

function showUserInfo(){
    let factionId = doc.find(".faction-info-wrap .faction-info[data-faction]").getAttribute("data-faction");

    fetchApi(`https://api.torn.com/faction/${factionId}?selections=${ownFaction ? 'donations,' : ''}basic`, api_key)
    .then(function(result) {
        if (!result.ok) {
            if (result.error === 'Incorrect ID-entity relation') {
                doc.findAll(".members-list .table-body>li").forEach((value) => {
                    let li = doc.new({type: "li", class: "tt-user-info"});
                    let inner_wrap = doc.new({type: "div", class: "tt-user-info-inner-wrap"});

                    inner_wrap.appendChild(doc.new({type: "div", text: "No API access."}));

                    li.appendChild(inner_wrap);
                    value.parentElement.insertBefore(li, value.nextElementSibling);
                });
            }
            return false;
        }
        
        result = result.result;
        console.log("result", result);

        doc.find(".members-list .table-body").classList.add("tt-modified");

        for(let user of doc.findAll(".members-list .table-body>li")){
            let user_id = user.find("a.user.name").getAttribute("data-placeholder")? user.find("a.user.name").getAttribute("data-placeholder").split(" [")[1].split("]")[0] : user.find("a.user.name").getAttribute("href").split("XID=")[1];

            let li = doc.new({type: "li", class: "tt-user-info", attributes: {"last-action": ((new Date() - result.members[user_id].last_action.timestamp*1000)/1000).toFixed(0)}});
            let inner_wrap = doc.new({type: "div", class: "tt-user-info-inner-wrap"});
            let texts = [
                `Last action: ${result.members[user_id].last_action.relative}`
            ]

            if(result.donations && result.donations[user_id]){
                if(result.donations[user_id].money_balance > 0){
                    texts.push(`Money balance: $${numberWithCommas(result.donations[user_id].money_balance, false)}`);
                }
                if(result.donations[user_id].points_balance > 0){
                    texts.push(`Points balance: ${numberWithCommas(result.donations[user_id].points_balance, false)}`);
                }
            }
    
            for(let text of texts){
                let div = doc.new({type: "div", text: text});
                inner_wrap.appendChild(div);
    
                if(texts.indexOf(text) !== texts.length-1){
                    let divider = doc.new({type: "div", class: "tt-divider", text: "—"});
                    inner_wrap.appendChild(divider);
                }
            }
    
            li.appendChild(inner_wrap);
            user.parentElement.insertBefore(li, user.nextElementSibling);

            // Activity notifications
            let checkpoints = settings.inactivity_alerts_faction;
            for(let checkpoint of Object.keys(checkpoints).sort(function(a,b){return b-a})){
                if(new Date() - new Date(result.members[user_id].last_action.timestamp*1000) >= parseInt(checkpoint)){
                    console.log(checkpoints[checkpoint])
                    user.style.backgroundColor = `${checkpoints[checkpoint]}`;
                    break;
                }
            }
        }
        member_info_added = true;
    });
}

function showAvailablePlayers(){
    let count = 0;

    if(doc.find("div.plans-list.p10")){
        display(count);
        return;
    }

    let list = doc.find("ul.plans-list");
    for(let member of list.findAll(":scope .item")){
        count++;
    }

    display(count);

    function display(number){
        let msg_cont_inner = `
            <div class="info-msg border-round">
                <i class="info-icon"></i>
                <div class="delimiter">
                    <div class="msg right-round">
                        ${number} member${number!==1? "s":""} available for OCs.
                    </div>
                </div>
            </div>
        `

        let msg_cont = doc.new({type: "div", class: "info-msg-cont border-round m-top10"});
        msg_cont.innerHTML = msg_cont_inner;

        doc.find("#faction-crimes").insertBefore(msg_cont, doc.find("#faction-crimes").firstElementChild);
    }
}

function showRecommendedNNB(){
    let nnb_dict = {
        "Blackmail": "0+",
        "Kidnapping": "~20",
        "Bomb Threat": "~25",
        "Planned Robbery": "~35",
        "Rob a money train": "~45",
        "Take over a cruise liner": "~50",
        "Hijack a plane": "55-60",
        "Political Assassination": "~60"
    }

    let parent = doc.findAll(".faction-crimes-wrap")[1];

    let heading = parent.find(".plan-crimes[role=heading]");
    let span = doc.new({type: "span", class: "tt-span", text: mobile? "NNB":"Recommended NNB"});
    heading.appendChild(span);


    for(let crime_type of parent.findAll(".crimes-list .item-wrap")){
        let name_div = crime_type.find(".plan-crimes")
        let inner_span = doc.new({type: "span", class: "tt-span", text: nnb_dict[name_div.innerText]});
        name_div.appendChild(inner_span);
    }
}

function drugInfo(){
    let item_info_container_mutation = new MutationObserver(function(mutations){
        for(let mutation of mutations){
            if(mutation.target.classList.contains("view-item-info") && (mutation.addedNodes.length > 0 || mutation.attributeName === "style")){
                let el = mutation.target;
                itemInfoLoaded(el).then(function(){
                    let item_name = el.find("span.bold").innerText;
                    if(item_name.indexOf("The") > -1) item_name = item_name.split("The ")[1];

                    let drug_details = DRUG_INFORMATION[item_name.toLowerCase().replace(/ /g, "_")];
                    if(drug_details === undefined){
                        return;
                    }

                    // Remove current info
                    for(let eff of el.findAll(".item-effect")){
                        eff.remove();
                    }

                    // Pros
                    if(drug_details.pros){
                        let pros_header = doc.new({type: "div", class: "t-green bold item-effect m-top10", text: "Pros:"});
                        el.find(".info-msg").appendChild(pros_header);
                        
                        for(let eff of drug_details.pros){
                            let pros_div = doc.new({type: "div", class: "t-green bold item-effect tabbed", text: eff});
                            el.find(".info-msg").appendChild(pros_div);
                        }
                    }

                    // Cons
                    if(drug_details.cons){
                        let cons_header = doc.new({type: "div", class: "t-red bold item-effect", text: "Cons:"});
                        el.find(".info-msg").appendChild(cons_header);
                        
                        for(let eff of drug_details.cons){
                            let cons_div = doc.new({type: "div", class: "t-red bold item-effect tabbed", text: eff});
                            el.find(".info-msg").appendChild(cons_div);
                        }
                    }

                    // Cooldown
                    if(drug_details.cooldown){
                        let cooldown_div = doc.new({type: "div", class: "t-red bold item-effect", text: `Cooldown: ${drug_details.cooldown}`});
                        el.find(".info-msg").appendChild(cooldown_div);
                    }

                    // Overdose
                    if(drug_details.overdose){
                        let od_header = doc.new({type: "div", class: "t-red bold item-effect", text: "Overdose:"});
                        el.find(".info-msg").appendChild(od_header);

                        // bars
                        if(drug_details.overdose.bars){
                            let bars_header = doc.new({type: "div", class: "t-red bold item-effect tabbed", text: "Bars"});
                            el.find(".info-msg").appendChild(bars_header);
                            
                            for(let bar_eff of drug_details.overdose.bars){
                                let bar_eff_div = doc.new({type: "div", class: "t-red bold item-effect double-tabbed", text: bar_eff});
                                el.find(".info-msg").appendChild(bar_eff_div);
                            }
                        }

                        // faction time
                        if(drug_details.overdose.hosp_time){
                            let hosp_div = doc.new({type: "div", class: "t-red bold item-effect tabbed", text: `faction: ${drug_details.overdose.hosp_time}`});
                            el.find(".info-msg").appendChild(hosp_div);
                        }

                        // extra
                        if(drug_details.overdose.extra){
                            let extra_div = doc.new({type: "div", class: "t-red bold item-effect tabbed", text: `Extra: ${drug_details.overdose.extra}`});
                            el.find(".info-msg").appendChild(extra_div);
                        }
                    }
                });
            }
        }
    });
    item_info_container_mutation.observe(doc.find("body"), {childList: true, subtree: true, attributes: true});
}

function itemInfoLoaded(element){
    return new Promise(function (resolve) {
        let checker = setInterval(function () {
            if(!element.find(".ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function addFilterToTable(list, title){
    let filter_container = content.newContainer("Filters", {id: "tt-player-filter", class: "filter-container", next_element: title}).find(".content");
    filter_container.innerHTML = `
        <div class="filter-header">
            <div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">Y</span> users</div>
        </div>
        <div class="filter-content ${mobile ? "tt-mobile" : ""}">
            <div class="filter-wrap" id="activity-filter">
                <div class="filter-heading">Activity</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="online">Online</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="idle">Idle</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="offline">Offline</div>
                </div>
            </div>
            <div class="filter-wrap" id="status-filter">
                <div class="filter-heading">Status</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="okay">Okay</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="hospital">Hospital</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="traveling">Traveling</div>
                </div>
            </div>
            <!--
            <div class="filter-wrap" id="faction-filter">
                <div class="filter-heading">Faction</div>
                <select name="faction" id="tt-faction-filter">
                    <option selected value="">none</option>
                </select>
            </div>
            -->
            <!--
            <div class="filter-wrap" id="time-filter">
                <div class="filter-heading">Days</div>
                <div id="tt-time-filter" class="filter-slider"></div>
                <div class="filter-slider-info"></div>
            </div>
            -->
            <div class="filter-wrap" id="level-filter">
                <div class="filter-heading">Level</div>
                <div id="tt-level-filter" class="filter-slider"></div>
                <div class="filter-slider-info"></div>
            </div>
            <div class="filter-wrap ${settings.pages.faction.member_info && getSearchParameters().get("step") !== "profile" ? '' : 'filter-hidden'}" id="last-action-filter">
                <div class="filter-heading">Last Action</div>
                <div id="tt-last-action-filter" class="filter-slider"></div>
                <div class="filter-slider-info"></div>
            </div>
        </div>
    `;

    // Initializing
    // let time_start = filters.faction.time[0] || 0;
    // let time_end = filters.faction.time[1] || 99999;
    let level_start = filters.faction.level[0] || 0;
    let level_end = filters.faction.level[1] || 100;
    let last_action_start = settings.pages.faction.member_info? filters.faction.last_action[0]/60/60 || 0 : 0;
    // let last_action_end = filters.faction.last_action[1] || 744;

    // for(let faction of filters.preset_data.factions.data){
    //     let option = doc.new({type: "option", value: faction, text: faction});
    //     if(faction == filters.preset_data.factions.default) option.selected = true;

    //     filter_container.find("#tt-faction-filter").appendChild(option);
    // }
    // let divider_option = doc.new({type: "option", value: "----------", text: "----------", attributes: {disabled: true}});
    // filter_container.find("#tt-faction-filter").appendChild(divider_option);

    // // Time slider
    // let time_slider = filter_container.find('#tt-time-filter');
    // noUiSlider.create(time_slider, {
    //     start: [time_start, time_end],
    //     step: 1,
    //     connect: true,
    //     range: {
    //         'min': 0,
    //         'max': 99999
    //     }
    // });

    // let time_slider_info = time_slider.nextElementSibling;
    // time_slider.noUiSlider.on('update', function (values) {
    //     values = values.map(x => parseInt(x));
    //     time_slider_info.innerHTML = `Days: ${values.join(' - ')}`;
    // });

    // Level slider
    let level_slider = filter_container.find('#tt-level-filter');
    noUiSlider.create(level_slider, {
        start: [level_start, level_end],
        step: 1,
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });

    let level_slider_info = level_slider.nextElementSibling;
    level_slider.noUiSlider.on('update', function (values) {
        values = values.map(x => parseInt(x));
        level_slider_info.innerHTML = `Level: ${values.join(' - ')}`;
    });

    // Last Action slider
    let last_action_slider = filter_container.find('#tt-last-action-filter');
    noUiSlider.create(last_action_slider, {
        start: last_action_start,
        step: 1,
        connect: true,
        range: {
            'min': 0,
            'max': 744
        }
    });

    let last_action_slider_info = last_action_slider.nextElementSibling;
    last_action_slider.noUiSlider.on('update', function (values) {
        values = values.map(x => (timeUntil(parseFloat(x)*60*60*1000, {max_unit: "h", hide_nulls: true})));
        last_action_slider_info.innerHTML = `Min Hours: ${values.join(' - ')}`;
    });

    // Event listeners
    for(let checkbox of filter_container.findAll(".tt-checkbox-wrap input")){
        checkbox.onclick = applyFilters;
    }
    for(let dropdown of filter_container.findAll("select")){
        dropdown.onchange = applyFilters;
    }
    let filter_observer = new MutationObserver(function(mutations){
        for(let mutation of mutations){
            if(mutation.type === "attributes"
            && mutation.target.classList 
            && mutation.attributeName === "aria-valuenow"
            && (mutation.target.classList.contains("noUi-handle-lower") || mutation.target.classList.contains("noUi-handle-upper"))){
                applyFilters();
            }
        }
    });
    filter_observer.observe(filter_container, {attributes: true, subtree: true});

    // Page changing
    doc.addEventListener("click", function(event){
        if(event.target.classList && !event.target.classList.contains("gallery-wrapper") && hasParent(event.target, {class: "gallery-wrapper"})){
            console.log("click");
            setTimeout(function(){
                requirePlayerList(".users-list").then(function(){
                    console.log("loaded");
                    populateFactions();
                    applyFilters();
                });
            }, 300);
        }
    });

    // Initializing
    for(let state of filters.faction.activity){
        doc.find(`#activity-filter input[value='${state}']`).checked = true;
    }
    for(let state of filters.faction.status){
        doc.find(`#status-filter input[value='${state}']`).checked = true;
    }
    // if(filters.faction.faction.default){
    //     doc.find(`#faction-filter option[value='${filters.faction.faction}']`).selected = true;
    // }

    // populateFactions();
    if(settings.pages.faction.member_info){
        memberInfoAdded().then(applyFilters);
    } else {
        applyFilters();
    }

    // Look for Search bar changes
    doc.find("#faction-info-members .table-header .table-cell.member input.search-input").addEventListener("keyup", function(){
        setTimeout(function(){
            for(let row of doc.findAll("#faction-info-members .table-body>.table-row")){
                if(row.style.display == "none" && row.nextElementSibling && row.nextElementSibling.classList.contains("tt-user-info")){
                    row.classList.add("filter-hidden");
                } else if((row.style.display == "flex" || row.style.display == "") && row.nextElementSibling && row.nextElementSibling.classList.contains("tt-user-info")){
                    row.classList.remove("filter-hidden");
                }
            }
        }, 100);
    });
    
    function applyFilters(){
        let active_dict = {
            "online": "icon1_",
            "idle": "icon62_",
            "offline": "icon2_"
        }

        let activity = [];
        let status = [];
        // let faction = ``;
        // let time = [];
        let level = [];
        let last_action = [];

        // Activity
        for(let checkbox of doc.findAll("#activity-filter .tt-checkbox-wrap input:checked")){
            activity.push(checkbox.getAttribute("value"));
        }
        // Status
        for(let checkbox of doc.findAll("#status-filter .tt-checkbox-wrap input:checked")){
            status.push(checkbox.getAttribute("value"));
        }
        // // Faction
        // faction = doc.find("#faction-filter select option:checked").value;
        // // Time
        // time.push(parseInt(doc.find("#time-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
        // time.push(parseInt(doc.find("#time-filter .noUi-handle-upper").getAttribute("aria-valuenow")));
        // Level
        level.push(parseInt(doc.find("#level-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
        level.push(parseInt(doc.find("#level-filter .noUi-handle-upper").getAttribute("aria-valuenow")));
        // Last Action
        last_action.push(parseInt(doc.find("#last-action-filter .noUi-handle-lower").getAttribute("aria-valuenow"))*60*60);  // convert to seconds
        // last_action.push(parseInt(doc.find("#last-action-filter .noUi-handle-upper").getAttribute("aria-valuenow"))*60*60);  // convert to seconds

        // console.log("Activity", activity);
        // console.log("Faction", faction);
        // console.log("Time", time);
        // console.log("Level", level);

        // Filtering
        for(let li of list.findAll(":scope>li")){
            if(li.classList.contains("tt-user-info")){
                continue;
            }
            li.classList.remove("filter-hidden");

            // Level
            let player_level = parseInt(li.find(".lvl").innerText.trim().replace("Level:", "").trim());
            if(!(level[0] <= player_level && player_level <= level[1])){
                li.classList.add("filter-hidden");
                continue;
            }

            // // Time
            // let player_time = parseInt(li.find(".days").innerText.trim().replace("Days:", "").trim());
            // if(!(time[0] <= player_time && player_time <= time[1])){
            //     li.classList.add("filter-hidden");
            //     continue;
            // }

            // Last Action
            let player_last_action = "N/A";
            if(li.nextElementSibling && li.nextElementSibling.classList && li.nextElementSibling.classList.contains("tt-user-info") && li.nextElementSibling.getAttribute("last-action")){
                player_last_action = parseInt(li.nextElementSibling.getAttribute("last-action"));
            }
            if(player_last_action !== "N/A" && !(last_action[0] <= player_last_action)){
                li.classList.add("filter-hidden");
                continue;
            }

            // Activity
            let matches_one_activity = activity.length === 0;
            for(let state of activity){
                if(li.querySelector(`li[id^='${active_dict[state]}']`)){
                    matches_one_activity = true;
                }
            }
            if(!matches_one_activity){
                li.classList.add("filter-hidden");
                continue;
            }

            // Status
            let matches_one_status = status.length === 0;
            for(let state of status){
                if(li.find(`.status`).innerText.replace("Status:", "").trim().toLowerCase() === state){
                    matches_one_status = true;
                }
            }
            if(!matches_one_status){
                li.classList.add("filter-hidden");
            }

            // // Faction
            // if(faction != "" && !li.querySelector(`img[title='${faction}']`)){
            //     li.classList.add("filter-hidden");
            //     continue;
            // }
        }

        ttStorage.change({"filters": {"faction": {
            activity: activity,
            // faction: faction,
            // time: time,
            status: status,
            level: level,
            last_action: last_action
        }}});

        updateStatistics();
    }

    function updateStatistics(){
        const users = [...list.findAll(":scope>li:not(.tt-user-info)")];

        doc.find(".statistic#showing .filter-total").innerText = users.length;
        doc.find(".statistic#showing .filter-count").innerText = users.filter(x => (!x.classList.contains("filter-hidden"))).length;
    }

    function populateFactions(){
        let faction_tags = [...list.findAll(":scope>li")].map(x => (x.find(".user.faction img")? x.find(".user.faction img").getAttribute("title"):"")).filter(x => x !== "");
        
        for(let tag of faction_tags){
            if(filter_container.find(`#tt-faction-filter option[value='${tag}']`)) continue;

            let option = doc.new({type: "option", value: tag, text: tag});
            filter_container.find("#tt-faction-filter").appendChild(option);
        }
    }
}

function armoryFilter(){
    let armory_filter = content.newContainer("Armory Filter", {
        header_only: true,
        id: "ttArmoryFilter",
        next_element: doc.find("#faction-armoury-tabs"),
        all_rounded: true
    });

    if(!["weapons", "armour"].includes(doc.find("ul[aria-label='faction armoury tabs']>li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", ""))){
        armory_filter.classList.add("filter-hidden");
    }

    // Switching page
    if(!mobile){
        for(let link of doc.findAll("ul[aria-label='faction armoury tabs']>li")){
            if(["weapons", "armour"].includes(link.getAttribute("aria-controls").replace("armoury-", ""))){
                link.addEventListener("click", function(){
                    console.log("filter tab")
                    if(doc.find("#ttArmoryFilter")){
                        doc.find("#ttArmoryFilter").classList.remove("filter-hidden");
                    }
                });
            } else {
                link.addEventListener("click", function(){
                    console.log("other tab");
                    if(doc.find("#ttArmoryFilter")){
                        doc.find("#ttArmoryFilter").classList.add("filter-hidden");
                    }
                });
            }
        }
    } else {
        doc.find(".armoury-drop-list select#armour-nav-list").addEventListener("change", function(){
            if(["weapons", "armour"].includes(doc.find("ul[aria-label='faction armoury tabs']>li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", ""))){
                console.log("filter tab")
                if(doc.find("#ttArmoryFilter")){
                    doc.find("#ttArmoryFilter").classList.remove("filter-hidden");
                }
            } else {
                console.log("other tab");
                if(doc.find("#ttArmoryFilter")){
                    doc.find("#ttArmoryFilter").classList.add("filter-hidden");
                }
            }
        });
    }

    let unavailable_wrap = doc.new({type: "div", class: "tt-checkbox-wrap in-title hide-unavailable-option"});
    let unavailable_checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
    let unavailable_text = doc.new({type: "div", text: "Hide unavailable"});

    if(filters.faction_armory.hide_unavailable){
        unavailable_checkbox.checked = filters.faction_armory.hide_unavailable;
    }

    unavailable_wrap.appendChild(unavailable_checkbox);
    unavailable_wrap.appendChild(unavailable_text);

    unavailable_checkbox.onclick = filter;

    armory_filter.find(".tt-options").appendChild(unavailable_wrap);

    armoryItemsLoaded().then(filter);

    let items_added_observer = new MutationObserver(function(mutations){
        for(let mutation of mutations){
            if(mutation.type === "childList" && mutation.addedNodes[0]){
                for(let added_node of mutation.addedNodes){
                    if(added_node.classList && added_node.classList.contains("item-list")){
                        if(["weapons", "armour"].includes(doc.find("ul[aria-label='faction armoury tabs']>li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", ""))){
                            console.log("items added")
                            filter();
                        }
                    }
                }
            }
        }
    });
    items_added_observer.observe(doc.find(`#faction-armoury-tabs`), {childList: true, subtree: true});

    function filter(){
        let item_list = doc.findAll(`#faction-armoury-tabs .armoury-tabs[aria-expanded='true'] .item-list>li`);
        let unavailable = doc.find(".hide-unavailable-option input").checked;

        for(let item of item_list){
            item.classList.remove("filter-hidden");

            // Unavailable filter
            if(unavailable && item.find(".loaned a")){
                item.classList.add("filter-hidden");
            }
        }

        ttStorage.change({"filters": {"faction_armory": {"hide_unavailable": unavailable}}});
    }
}

const ALLOWED_BLOOD = {
    "o+": [ 738, 739 ], // 738
    "o-": [ 739 ], // 739
    "a+": [ 732, 733, 738, 739 ], // 732
    "a-": [ 733, 739 ], // 733
    "b+": [ 734, 735, 738, 739 ], // 734
    "b-": [ 735, 739 ], // 735
    "ab+": [ 732, 733, 734, 735, 736, 737, 738, 739 ], // 736
    "ab-": [ 733, 735, 737, 739 ], // 737
}

function highlightBloodBags(){
    const section = doc.find("ul[aria-label='faction armoury tabs'] > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
    if (section === "medical") highlight();

    new MutationObserver((mutations) => {
        if (!mutations
            .filter((mut) => mut.type === "childList" && mut.addedNodes.length)
            .flatMap((mut) => Array.from(mut.addedNodes))
            .some((node) => node.classList && node.classList.contains("item-list"))) {
            return;
        }

        const section = doc.find("ul[aria-label='faction armoury tabs'] > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
        if (section !== "medical") return;

        highlight();
    }).observe(doc.find(`#faction-armoury-tabs`), {childList: true, subtree: true});

    function highlight() {
        const allowedBlood = ALLOWED_BLOOD[settings.pages.items.highlight_bloodbags];
        const items = doc.findAll(`#faction-armoury-tabs .armoury-tabs[aria-expanded='true'] .item-list > li`);

        for (let item of items) {
            if (!item.find(".name") || item.find(".name").classList.contains(".tt-modified")) continue;

            if (item.find(".img-wrap").getAttribute("data-id") === "1012") continue; // is an irradiated blood bag

            if (!item.find(".name").innerText.split(" x")[0].includes("Blood Bag : ")) continue; // is not a filled blood bag

            const classes = item.find(".name").classList;

            classes.add("tt-modified");

            if (allowedBlood.includes(parseInt(item.find(".img-wrap").getAttribute("data-id")))) classes.add("tt-good_blood");
            else classes.add("tt-bad_blood")
        }
    }
}

function armoryTabsLoaded(){
    return new Promise(function(resolve){
        let checker = setInterval(function(){
            if(doc.find("ul[aria-label='faction armoury tabs']>li[aria-selected='true']")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function armoryItemsLoaded(){
    return new Promise(function(resolve){
        let checker = setInterval(function(){
            if(doc.find("#faction-armoury-tabs .armoury-tabs[aria-expanded='true'] .item-list>li:not(.ajax-placeholder)")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function memberInfoAdded(){
    return new Promise(function(resolve){
        let checker = setInterval(function(){
            if(member_info_added){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}