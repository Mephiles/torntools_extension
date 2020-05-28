import changelog from "../../changelog.js";
var version;

window.addEventListener("load", function(){
    console.log("Start Settings");
    version = chrome.runtime.getManifest().version;

    // About info
    doc.find("#about #version span").innerText = `v${version}`;
    if(chrome.storage.local.getBytesInUse){
        chrome.storage.local.getBytesInUse(function(data){
            doc.find("#about #data-used span").innerText = formatBytes(data);
        });
    }

    // setup site
    setupSite();

    // Disable extension auto-checks
    if(!usingChrome()){
        doc.find("#extensions-doctorn-auto input").disabled = true;
    }

    // set "update" to false
    local_storage.set({"updated": false});

    // Content
    setupChangelog();

    local_storage.get(
        ["settings", "api_key", "allies", "custom_links", "target_list", "loot_times", "loot_alerts", "chat_highlight", "extensions"], 
        function([settings, api_key, allies, custom_links, target_list, loot_times, loot_alerts, chat_highlight, extensions]){
        // Preferences
        setupPreferences(settings, allies, custom_links, target_list.show, loot_times, loot_alerts, chat_highlight, extensions);
        
        // Target list
        setupTargetList(target_list.targets);
        setupValueChanger();

        // Fill in API key
        doc.find("#api_field").value = api_key.slice(0, api_key.length-8) + "********";
    });

    // Buttons
    doc.find("#change_api_key").addEventListener("click", function(){
        resetApiKey();
    });
    doc.find("#add_ally").addEventListener("click", function(event){
        addAllyToList(event);
    });
    doc.find("#add_link").addEventListener("click", function(event){
        addLinktoList(event);
    });
    doc.find("#add_highlight").addEventListener("click", function(event){
        addHighlightToList(event);
    });
    doc.find("#clear_target_list").addEventListener("click", function(){
        local_storage.set({"target_list": {
            "last_target": -1,
            "show": true,
            "targets": {}
        }});
        message("Target list reset.", true);
    });

    // Log whole Database
    local_storage.get(null, function(STORAGE){
        console.log("Database", STORAGE);
    });
});

function setupSite(){
    // Navigation bar
    for(let site of [...doc.findAll(".navbar .site")]){
        site.addEventListener("click", function(event){
            doc.find(`.navbar .site.active`).classList.remove("active");
            doc.find(`.container.active`).classList.remove("active");

            doc.find(`.navbar .site#${event.target.id}`).classList.add("active");
            doc.find(`.container#${event.target.id.replace("-link", "").replace("_", "-")}`).classList.add("active");
        });
    }
}

function setupChangelog(){
    let content = doc.find(".container#changelog .content");

    for(let ver in changelog){
        let div = doc.new("div");
        div.setClass("parent");

        // Heading
        let heading = doc.new("div");
            heading.setClass("heading");
            heading.innerText = ver;

            // Icon
            let icon = doc.new("i");
                icon.setClass("fas fa-chevron-down");
            heading.appendChild(icon);
        
        if(Object.keys(changelog).indexOf(ver) == 0){
            heading.style.color = "red";
        }

        div.appendChild(heading);

        // Closeable
        let closeable = doc.new("div");
            closeable.setClass("closeable");

        heading.addEventListener("click", function(){
            if(closeable.style.maxHeight){
                closeable.style.maxHeight = null
            } else {
                closeable.style.maxHeight = closeable.scrollHeight + "px";
            }

            rotateElement(icon, 180);
        });
        
        // Content
        if(Array.isArray(changelog[ver])){
            for(let item of changelog[ver]){
                let item_div = doc.new("div");
                    item_div.setClass("child");
                    item_div.innerText = "- "+item;

                closeable.appendChild(item_div);
            }
        } else {
            (function loopKeyInChangelog(grandparent, parent_name, parent_element){
                for(let _key in grandparent[parent_name]){
                    let _div = doc.new("div");
                    if(typeof grandparent[parent_name][_key] == "object"){
                        _div.setClass("parent");
                        let _heading = doc.new("div");
                            _heading.setClass("heading");
                            _heading.innerText = _key;
                            
                        _div.appendChild(_heading);

                        if(Array.isArray(grandparent[parent_name][_key])){
                            for(let _item of grandparent[parent_name][_key]){
                                let _item_div = doc.new("div");
                                    _item_div.setClass("child");
                                    _item_div.innerText = "- "+_item;

                                _div.appendChild(_item_div);
                            }
                        } else {
                            loopKeyInChangelog(grandparent[parent_name], _key, _div);
                        }

                    } else {
                        _div.setClass("child");
                        _div.innerText = grandparent[parent_name][_key];
                    }
                    parent_element.appendChild(_div);
                }
            })(changelog, ver, closeable);
        }

        // Bottom border on last element
        if(ver.split(" ")[0] == "v3"){
            let hr = doc.new("hr");
            closeable.appendChild(hr);
        }

        // Finish
        div.appendChild(closeable)
        content.appendChild(div);

        if(Object.keys(changelog).indexOf(ver) == 0){
            heading.click();
        }
    }

    // Ending words
    let p = doc.new("p");
        p.innerText = "The rest is history..";
        p.style.textAlign = "center";
    
    content.appendChild(p);
}

function setupPreferences(settings, allies, custom_links, target_list_enabled, loot_times, loot_alerts, chat_highlight, extensions){
    let preferences = doc.find("#preferences");

    // General
    preferences.find(`#update_notification input`).checked = settings.update_notification;
    preferences.find("#force_tt input").checked = settings.force_tt;
    preferences.find(`#format-date-${settings.format.date} input`).checked = true;
    preferences.find(`#format-time-${settings.format.time} input`).checked = true;
    preferences.find(`#theme-${settings.theme} input`).checked = true;

    // Tabs
    for(let tab in settings.tabs){
        if(tab == "default"){
            preferences.find(`#default-${settings.tabs[tab]} input`).checked = true;
        } else {
            preferences.find(`#tab-${tab} input`).checked = settings.tabs[tab];
        }
    }

    // Achievements
    for(let key in settings.achievements){
        preferences.find(`#achievements-${key} input`).checked = settings.achievements[key];
    }

    // Other scripts
    for(let page in settings.pages){
        for(let option in settings.pages[page]){
            preferences.find(`#${page}-${option} input`).checked = settings.pages[page][option];
        }
    }
    preferences.find(`#remove_info_boxes input`).checked = settings.remove_info_boxes;

    // Target list
    preferences.find(`#target_list input`).checked = target_list_enabled;

    // Allies
    for(let ally of allies){
        if(ally == ""){
            break;
        }

        let row = doc.new({type: "div", class: "row"});
        let text_input = doc.new({type: "input", class: "text", value: ally});
        let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
        let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"});

        remove_icon.addEventListener("click", function(event){
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function(event){
            event.target.parentElement.remove();
        });
        
        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(text_input);
        row.appendChild(remove_icon_wrap);
        
        let table_body = preferences.find(`#ff-table .body`);
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Custom links
    for(let link of custom_links){
        let row = doc.new({type: "div", class: "row"});
        let name_input = doc.new({type: "input", class: "text name", value: link.text});
        let href_input = doc.new({type: "input", class: "text href", value: link.href});
        let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
        let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"});

        remove_icon.addEventListener("click", function(event){
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function(event){
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(name_input);
        row.appendChild(href_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find("#custom_links .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Chat highlights
    for(let name in chat_highlight){
        let row = doc.new({type: "div", class: "row"});
        let name_input = doc.new({type: "input", class: "text name", value: name});
        let color_input = doc.new({type: "input", class: "text color", value: chat_highlight[name], attributes: {type: "color"}});
        let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
        let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"});

        remove_icon.addEventListener("click", function(event){
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function(event){
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(name_input);
        row.appendChild(color_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find("#chat_highlight .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Loot alerts
    for(let npc_id in loot_times){
        let row = doc.new({type: "div", class: "row"});
        let name_input = doc.new({type: "input", class: "text name", value: loot_times[npc_id].name, attributes: {disabled: true}});
        let level_input = doc.new({type: "input", class: "text level", value: (loot_alerts[npc_id] ? loot_alerts[npc_id].level : ""), attributes: {placeholder: "level.."}});
        let time_input = doc.new({type: "input", class: "text time", id: `npc-${npc_id}`, value: (loot_alerts[npc_id] ? loot_alerts[npc_id].time : ""), attributes: {placeholder: "minutes.."}});

        row.appendChild(name_input);
        row.appendChild(level_input);
        row.appendChild(time_input);

        let table_body = preferences.find("#loot-table .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Doctorn
    if(extensions.doctorn == "force_true"){
        preferences.find("#extensions-doctorn-true input").checked = true;
    } else if(extensions.doctorn == "force_false"){
        preferences.find("#extensions-doctorn-false input").checked = true;
    } else {
        preferences.find("#extensions-doctorn-auto input").checked = true;
    }

    // Buttons
    preferences.find("#save_settings").addEventListener("click", function(){
        savePreferences(preferences, settings, target_list_enabled);
    });

    preferences.find("#reset_settings").addEventListener("click", function(){
        local_storage.reset();
        message("Settings reset.", true);
    });
}

function savePreferences(preferences, settings, target_list_enabled){
    // General
    settings.update_notification = preferences.find("#update_notification input").checked;
    settings.force_tt = preferences.find("#force_tt input").checked;
    settings.format.date = preferences.find("input[name=format-date]:checked").parentElement.id.split("-")[2];
    settings.format.time = preferences.find("input[name=format-time]:checked").parentElement.id.split("-")[2];
    settings.theme = preferences.find("input[name=theme]:checked").parentElement.id.split("-")[1];

    // Tabs
    for(let tab in settings.tabs){
        if(tab == "default"){
            settings.tabs[tab] = preferences.find(`input[name=default-tab]:checked`).parentElement.innerText.toLowerCase();
        } else {
            settings.tabs[tab] = preferences.find(`#tab-${tab} input`).checked;
        }
    }

    // Achievements
    for(let key in settings.achievements){
        settings.achievements[key] = preferences.find(`#achievements-${key} input`).checked;
    }

    // Other scripts
    for(let page in settings.pages){
        for(let option in settings.pages[page]){
            settings.pages[page][option] = preferences.find(`#${page}-${option} input`).checked;
        }
    }
    settings.remove_info_boxes = preferences.find(`#remove_info_boxes input`).checked;

    // Target list
    target_list_enabled = preferences.find(`#target_list input`).checked;

    // Allies
    let allies = [];
    for(let ally of preferences.findAll("#ff-table .row:not(.input) .text")){
        allies.push(ally.value.trim());
    }

    // Custom links
    let custom_links = [];
    for(let link of preferences.findAll("#custom_links .row:not(.input")){
        custom_links.push({
            text: link.find(".name").value,
            href: link.find(".href").value
        });
    }

    // Loot alerts
    let alerts = {}
    for(let npc of preferences.findAll(`#loot-table .row`)){
        let npc_id = npc.find(".time").id.split("-")[1];
        let level = romanToArabic(npc.find(".level").value);
        let time = parseFloat(npc.find(".time").value);

        alerts[npc_id] = {
            level: level,
            time: time
        }
    }

    // Chat highlight
    let highlights = {}
    for(let row of preferences.findAll("#chat_highlight .row:not(.input)")){
        let name = row.find(".name").value;
        let color = row.find(".color").value;

        highlights[name] = color;
    }

    // Doctorn
    let extensions = {}
    switch(preferences.find("input[name=extensions-doctorn]:checked").parentElement.id.split("-")[2]){
        case "false":
            extensions.doctorn = "force_false";
            break;
        case "true":
            extensions.doctorn = "force_true";
            break;
        case "auto":
            extensions.doctorn = false;
            break;
    }

    console.log("New settings", settings);

    local_storage.set({"settings": settings});
    local_storage.set({"allies": allies});
    local_storage.set({"custom_links": custom_links});
    local_storage.set({"loot_alerts": alerts});
    local_storage.set({"chat_highlight": highlights});
    local_storage.set({"extensions": extensions});

    local_storage.change({"target_list": {"show": target_list_enabled}}, function(){
        local_storage.get("target_list", function(target_list){
            console.log("new target list", target_list);
        });
    });

    message("Settings saved.", true);
}

function setupTargetList(target_list){
    let table = doc.find("#target-list .table");
    let header = table.find(".header");
    let body = table.find(".body");

    let headings = [
        {name: "id", text: "ID", type:"neutral"},
        {name: "win", type:"good"},
        {name: "mug", type:"good"},
        {name: "leave", type:"good"},
        {name: "hosp", type:"good"},
        {name: "arrest", type:"good"},
        {name: "special", type:"good"},
        {name: "assist", type:"good"},
        {name: "defend", type:"good"},
        {name: "lose", text:"Losses", type:"bad"},
        {name: "defend_lose", text: "Defends lost", type:"bad"},
        {name: "stalemate", type:"bad"},
        {name: "stealth", type:"neutral"},
        {name: "respect", text: "Respect", type:"neutral"},
    ]

    // Header row
    let type;
    for(let heading of headings){
        let div = doc.new("div");
            div.setAttribute("name", heading.name);
        
        if((!type || type != heading.type) && heading.name != "id"){
            div.setClass(`new-section ${heading.type}`);
        } else {
            div.setClass(heading.type);
        }

        if(heading.text){
            div.innerText = heading.text;
        } else {
            div.innerText = capitalize(heading.name) + "s";
        }

        // Sorting icon
        if(heading.name == "id"){
            let icon = doc.new("i");
                icon.setClass("fas fa-caret-up");
            div.appendChild(icon);
        }

        type = heading.type;
        header.appendChild(div);

        div.addEventListener("click", function(){
            sort(table, headings.indexOf(heading)+1, "value");
        });
    }

    // Body
    for(let id in target_list){
        if(id == "date")
            continue;

        type = undefined;
        let row = doc.new("div");
            row.setClass("row");

        for(let heading of headings){
            let item = doc.new("div");

            if((!type || type != heading.type) && heading.name != "id"){
                item.setClass(`new-section ${heading.type}`);
            } else {
                item.setClass(heading.type);
            }

            if(heading.name == "id"){
                item.innerText = id;
                item.setAttribute("value", id);
            } else if (heading.name == "respect"){
                let respect_type = getRespectType(target_list[id]);

                let leaves = target_list[id][respect_type]["leave"].length > 0 ? true : false;

                if(leaves) {
                    item.innerText = getAverage(target_list[id][respect_type]["leave"]);
                    item.setAttribute("value", item.innerText);
                } else {
                    let averages = [];

                    for(let list in target_list[id][respect_type]){
                        let avrg = getAverage(target_list[id][respect_type][list]);

                        if(avrg != 0){
                            averages.push(avrg);
                        }
                    }

                    item.innerText = getAverage(averages);
                    item.setAttribute("value", item.innerText);
                }

                if(item.innerText == "0"){
                    item.setAttribute("value", "-");
                    item.innerText = "-";
                    item.setAttribute("priority", "4");
                } else if(respect_type == "respect"){
					item.innerText = item.innerText + "*";
					item.setAttribute("priority", "3");
				} else if(respect_type == "respect_base"){
					if(leaves){
						item.style.backgroundColor = "#dfffdf";
						item.setAttribute("priority", "1");
					} else {
						item.style.backgroundColor = "#fffdcc";
						item.setAttribute("priority", "2");
					}
				}
            } else {
                item.innerText = target_list[id][heading.name];
                item.setAttribute("value", target_list[id][heading.name]);
            }

            // Percentage values
            if(["mug", "leave", "hosp", "arrest", "special", "assist", "stealth"].includes(heading.name)){
				let value = target_list[id][heading.name];
				let percentage = (value/target_list[id]["win"]*100).toFixed();
				percentage = isNaN(percentage) || percentage == Infinity ? 0 : percentage;

				// item.setAttribute("value", value);
				item.setAttribute("percentage", percentage);
			}

            // Finish
            type = heading.type;
            row.appendChild(item);
        }

        body.appendChild(row);
    }

    function getRespectType(enemy){
        let type = "respect";

        for(let list in enemy.respect_base){
            if(enemy.respect_base[list].length > 0){
                type = "respect_base";
                break;
            }
        }

        return type;
    }

    function getAverage(arr){
        if(arr.length == 0)
            return 0;
        
        let sum = 0;
        for(let item of arr){
            sum += item;
        }
        return parseFloat((sum / arr.length).toFixed(2));
    }
}

function setupValueChanger(){
    doc.find("#num_per .switch-input").addEventListener("click", function(event){
        let rows = doc.findAll("#target-list .table .body .row");

        for(let row of rows){
            for(let item of row.findAll("div")){
                if(item.getAttribute("percentage")){
                    if(event.target.checked)
                        item.innerText = item.getAttribute("percentage") + "%";
                    else
                        item.innerText = item.getAttribute("value");
                }
            }
        }
    });
}

function resetApiKey(){
    let new_api_key = doc.find("#api_field").value;

    local_storage.set({"api_key": new_api_key}, function(){
        message("API key changed.", true);
        doc.find("#api_field").value = "";
    });
}

function addAllyToList(event){
    let row = doc.new({type: "div", class: "row"});
    let text_input = doc.new({type: "input", class: "text", value: event.target.previousElementSibling.value});
    let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
    let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"})

    remove_icon.addEventListener("click", function(event){
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function(event){
        event.target.parentElement.remove();
    });
    
    remove_icon_wrap.appendChild(remove_icon);
    row.appendChild(text_input);
    row.appendChild(remove_icon_wrap);
    
    let table_body = preferences.find(`#ff-table .body`);
    table_body.insertBefore(row, table_body.find(".row.input"));

    // Clear input
    event.target.previousElementSibling.value = "";
}

function addLinktoList(event){
    let row = doc.new({type: "div", class: "row"});
    let name_input = doc.new({type: "input", class: "text name", value: event.target.previousElementSibling.previousElementSibling.value});
    let href_input = doc.new({type: "input", class: "text href", value: event.target.previousElementSibling.value});
    let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
    let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"});

    remove_icon.addEventListener("click", function(event){
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function(event){
        event.target.parentElement.remove();
    });

    remove_icon_wrap.appendChild(remove_icon);
    row.appendChild(name_input);
    row.appendChild(href_input);
    row.appendChild(remove_icon_wrap);

    let table_body = preferences.find("#custom_links .body");
    table_body.insertBefore(row, table_body.find(".row.input"));

    // Clear input
    event.target.previousElementSibling.value = "";
    event.target.previousElementSibling.previousElementSibling.value = "";
}

function message(text, good){
    let message_element = doc.find("#message");
    message_element.innerText = text;
    if(good){
        message_element.style.backgroundColor = "#30e202";
    } else {
        message_element.style.backgroundColor = "#ff19199e";
    }
    
    message_element.style.maxHeight = message_element.scrollHeight + "px";

    setTimeout(function(){
        message_element.innerText = "";
        message_element.style.maxHeight = null;
    }, 1500);
}

function addHighlightToList(event){
    let row = doc.new({type: "div", class: "row"});
    let name_input = doc.new({type: "input", class: "text name", value: event.target.previousElementSibling.previousElementSibling.value});
    let color_input = doc.new({type: "input", class: "text color", value: event.target.previousElementSibling.value, attributes: {type: "color"}});
    let remove_icon_wrap = doc.new({type: "div", class:"remove-icon-wrap"});
    let remove_icon = doc.new({type: "i", class: "remove-icon fas fa-trash-alt"});

    remove_icon.addEventListener("click", function(event){
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function(event){
        event.target.parentElement.remove();
    });

    remove_icon_wrap.appendChild(remove_icon);
    row.appendChild(name_input);
    row.appendChild(color_input);
    row.appendChild(remove_icon_wrap);

    let table_body = preferences.find("#chat_highlight .body");
    table_body.insertBefore(row, table_body.find(".row.input"));

    // Clear input
    event.target.previousElementSibling.value = "#7ca900";
    event.target.previousElementSibling.previousElementSibling.value = "";
}