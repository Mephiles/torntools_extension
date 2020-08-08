import changelog from "../../changelog.js";

var version;
var initiated_pages = {}

// preferences.find("#reset_settings").addEventListener("click", function () {
//     ttStorage.reset();
//     message("Settings reset.", true);
// });

requireDatabase(false)
    .then(() => {
        console.log("Start Settings");
        version = chrome.runtime.getManifest().version;

        console.log("Database", DB);

        ttStorage.set({ "updated": false });

        // Navigation bar
        for (let site of [...doc.findAll(".navbar .site")]) {
            site.onclick = (event) => {
                doc.find(`.navbar .site.active`).classList.remove("active");
                doc.find(`.container.active`).classList.remove("active");

                doc.find(`.navbar .site#${event.target.id}`).classList.add("active");
                doc.find(`.container#${event.target.id.replace("-link", "").replace("_", "-")}`).classList.add("active");
            }
        }

        let init_page = getSearchParameters().get("page") || "changelog";
        loadPage(init_page);

        for (let link of doc.findAll(".navbar>.site")) {
            let name = link.id.split("-")[0];
            link.onclick = function () {
                loadPage(name);
            };
        }

        // Buttons
        doc.find("#change_api_key").addEventListener("click", function () {
            resetApiKey();
        });
        doc.find("#add_ally").addEventListener("click", function (event) {
            addAllyToList(event);
        });
        doc.find("#add_link").addEventListener("click", function (event) {
            addLinktoList(event);
        });
        doc.find("#add_highlight").addEventListener("click", function (event) {
            addHighlightToList(event);
        });
        doc.find("#add_filter_faction").addEventListener("click", function (event) {
            addFactionToFilter(event);
        });
        doc.find("#clear_target_list").addEventListener("click", function () {
            ttStorage.set({
                "target_list": {
                    "last_target": -1,
                    "show": true,
                    "targets": {}
                }
            });
            message("Target list reset.", true);
        });
        doc.find("#allow_notifications").onclick = function () {
            Notification.requestPermission().then(function (permission) {
                if (permission == "granted") {
                    doc.find("#allow_notifications").parentElement.classList.add("hidden");
                }
            });
        }
        doc.find("#fetch_torndata").onclick = function () {
            chrome.runtime.sendMessage({ action: "fetch", type: "torndata" }, function (response) {
                message(response.message, response.success);
            });
        }
        doc.find("#save_settings").addEventListener("click", function () {
            savePreferences(preferences, settings, target_list.show);
        });
    })
    .catch(() => {
        loadConfirmationPopup({
            title: 'API key',
            message: `### You have not initialized the App by providing your API key
Please enter your API key via opening the Extension popup.  
Clicking either 'Cancel' or 'Confirm' will reload the page.
            `,
        })
            .then(() => {
                location.reload();
            })
            .catch(() => {
                location.reload();
            })
    })

function loadPage(name) {
    console.log("Loading page:", name);

    // URL
    window.history.replaceState("", "Title", "?page=" + name);

    // Header
    if (doc.find(".navbar .site.active")) doc.find(".navbar .site.active").classList.remove("active");
    doc.find(`.navbar #${name}-link.site`).classList.add("active");

    // Page itself
    if (doc.find(".subpage.active")) doc.find(".subpage.active").classList.remove("active");
    doc.find(`.subpage#${name}`).classList.add("active");

    // Run page script
    let dict = {
        "changelog": setupChangelog,
        "preferences": setupPreferences,
        "target_list": targetList,
        "api_info": apiInfo,
        "server": server,
        "about": about
    }
    if (!(name in initiated_pages) || !initiated_pages[name]) {
        dict[name]();
        initiated_pages[name] = true;
    }
}

function setupChangelog() {
    let content = doc.find(".container#changelog .content");

    for (let ver in changelog) {
        let sub_ver = ver.split(" - ")[1] ? " - " + ver.split(" - ")[1] : "";
        ver = ver.split(" - ")[0];

        let div = doc.new({ type: "div", class: "parent" });

        // Heading
        let heading = doc.new({ type: "div", class: "heading", text: ver });
        let span = doc.new({ type: "span", text: sub_ver });
        let icon = doc.new({ type: "i", class: "fas fa-chevron-down" });
        heading.appendChild(span);
        heading.appendChild(icon);

        if (Object.keys(changelog).indexOf(ver + sub_ver) == 0) {
            heading.style.color = "red";
        }

        div.appendChild(heading);

        // Closeable
        let closeable = doc.new("div");
        closeable.setClass("closeable");

        heading.addEventListener("click", function () {
            if (closeable.style.maxHeight) {
                closeable.style.maxHeight = null
            } else {
                closeable.style.maxHeight = closeable.scrollHeight + "px";
            }

            rotateElement(icon, 180);
        });

        // Content
        if (Array.isArray(changelog[ver + sub_ver])) {
            for (let item of changelog[ver + sub_ver]) {
                let item_div = doc.new("div");
                item_div.setClass("child");
                item_div.innerText = "- " + item;

                closeable.appendChild(item_div);
            }
        } else {
            (function loopKeyInChangelog(grandparent, parent_name, parent_element) {
                for (let _key in grandparent[parent_name]) {
                    let _div = doc.new("div");
                    if (typeof grandparent[parent_name][_key] == "object") {
                        _div.setClass("parent");
                        let _heading = doc.new("div");
                        _heading.setClass("heading");
                        _heading.innerText = _key;

                        _div.appendChild(_heading);

                        if (Array.isArray(grandparent[parent_name][_key])) {
                            for (let _item of grandparent[parent_name][_key]) {
                                let contributor;

                                if (_item.includes("- DKK")) {
                                    contributor = "dkk";
                                    _item = _item.slice(0, _item.indexOf(" - DKK"));
                                } else if (_item.includes("- Mephiles")) {
                                    contributor = "mephiles";
                                    _item = _item.slice(0, _item.indexOf(" - Mephiles"));
                                }

                                let _item_div = doc.new({ type: "div", class: `child ${contributor}` });
                                let _item_span = doc.new({ type: "span", text: _item });
                                _item_div.appendChild(_item_span);
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
            })(changelog, ver + sub_ver, closeable);
        }

        // Bottom border on last element
        if (ver + sub_ver.split(" ")[0] == "v3") {
            let hr = doc.new("hr");
            closeable.appendChild(hr);
        }

        // Finish
        div.appendChild(closeable)
        content.appendChild(div);

        if (Object.keys(changelog).indexOf(ver + sub_ver) == 0) {
            heading.click();
        }
    }

    // Ending words
    let p = doc.new("p");
    p.innerText = "The rest is history..";
    p.style.textAlign = "center";

    content.appendChild(p);
}

function setupPreferences() {
    let preferences = doc.find("#preferences");

    // General
    preferences.find(`#update_notification input`).checked = settings.update_notification;
    preferences.find("#force_tt input").checked = settings.force_tt;
    preferences.find(`#format-date-${settings.format.date} input`).checked = true;
    preferences.find(`#format-time-${settings.format.time} input`).checked = true;
    preferences.find(`#theme-${settings.theme} input`).checked = true;
    preferences.find("#notifications_tts input").checked = settings.notifications_tts;
    preferences.find("#notifications_sound input").checked = settings.notifications_sound;
    preferences.find("#notifications_link input").checked = settings.notifications_link;
    preferences.find("#clean_flight input").checked = settings.clean_flight;
    preferences.find("#font_size input").value = settings.font_size.replace(/px/, "");

    // Tabs
    for (let tab in settings.tabs) {
        if (tab == "default") {
            preferences.find(`#default-${settings.tabs[tab]} input`).checked = true;
        } else {
            preferences.find(`#tab-${tab} input`).checked = settings.tabs[tab];
        }
    }

    // Achievements
    for (let key in settings.achievements) {
        preferences.find(`#achievements-${key} input`).checked = settings.achievements[key];
    }

    // Other scripts
    for (let page in settings.pages) {
        let has_global_disabled = false;

        if (settings.pages[page].global === false) has_global_disabled = true;

        for (let option in settings.pages[page]) {
            const optionDiv = preferences.find(`#${page}-${option}`);
            if (!optionDiv) continue;

            // Global option for pages. Disabled all options if global is disabled
            if (option === "global" && optionDiv.classList.contains("heading")) {
                optionDiv.find("input").addEventListener("click", function (event) {
                    let disabledGlobal = !event.target.checked;

                    for (let option in settings.pages[page]) {
                        if (option === "global") continue;

                        let inp = preferences.find(`#${page}-${option} input`);

                        if (disabledGlobal) inp.setAttribute("disabled", true);
                        else inp.removeAttribute("disabled");
                    }
                });
            } else if (option !== "global" && has_global_disabled) {
                optionDiv.find("input, select").setAttribute("disabled", true);
            }

            if (optionDiv.find("input")) optionDiv.find("input").checked = settings.pages[page][option];
            else if (optionDiv.find("select")) {
                const selectedOption = optionDiv.find(`select > option[value='${settings.pages[page][option]}']`)
                if (!selectedOption) optionDiv.find("select > option[value='none']")

                optionDiv.find("select").value = settings.pages[page][option];
            }
        }
    }
    // preferences.find(`#remove_info_boxes input`).checked = settings.remove_info_boxes;

    // Target list
    preferences.find(`#target_list input`).checked = target_list.show;

    // Allies
    for (let ally of allies) {
        if (ally == "") {
            break;
        }

        let row = doc.new({ type: "div", class: "row" });
        let text_input = doc.new({ type: "input", class: "text", value: ally });
        let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
        let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

        remove_icon.addEventListener("click", function (event) {
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function (event) {
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(text_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find(`#ff-table .body`);
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Custom links
    for (let link of custom_links) {
        let row = doc.new({ type: "div", class: "row" });
        let new_tab_input = doc.new({ type: "input", class: "new_tab", attributes: { type: "checkbox" } });
        let name_input = doc.new({ type: "input", class: "text name", value: link.text });
        let href_input = doc.new({ type: "input", class: "text href", value: link.href });
        let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
        let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

        remove_icon.addEventListener("click", function (event) {
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function (event) {
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(new_tab_input);
        row.appendChild(name_input);
        row.appendChild(href_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find("#custom_links .body");
        table_body.insertBefore(row, table_body.find(".row.input"));

        if (link.new_tab == true || link.new_tab == undefined) {
            new_tab_input.checked = true;
        }
    }

    // Chat highlights
    for (let name in chat_highlight) {
        let row = doc.new({ type: "div", class: "row" });
        let name_input = doc.new({ type: "input", class: "text name", value: name });
        let color_input = doc.new({
            type: "input",
            class: "text color",
            value: chat_highlight[name],
            attributes: { type: "color" }
        });
        let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
        let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

        remove_icon.addEventListener("click", function (event) {
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function (event) {
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(name_input);
        row.appendChild(color_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find("#chat_highlight .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }
    const globalSection = preferences.find(".section[name='global']");
    for (let placeholder in HIGHLIGHT_PLACEHOLDERS) {
        globalSection.insertBefore(doc.new({
            type: "div",
            class: "tabbed note",
            text: `${placeholder} - ${HIGHLIGHT_PLACEHOLDERS[placeholder].description}`
        }), globalSection.find("#chat_highlight+.note").nextElementSibling);
    }

    // Loot alerts
    for (let npc_id in loot_times) {
        let row = doc.new({ type: "div", class: "row" });
        let name_input = doc.new({
            type: "input",
            class: "text name",
            value: loot_times[npc_id].name,
            attributes: { disabled: true }
        });
        let level_input = doc.new({
            type: "input",
            class: "text level",
            value: (loot_alerts[npc_id] ? loot_alerts[npc_id].level : ""),
            attributes: { placeholder: "level.." }
        });
        let time_input = doc.new({
            type: "input",
            class: "text time",
            id: `npc-${npc_id}`,
            value: (loot_alerts[npc_id] ? loot_alerts[npc_id].time : ""),
            attributes: { placeholder: "minutes.." }
        });

        row.appendChild(name_input);
        row.appendChild(level_input);
        row.appendChild(time_input);

        let table_body = preferences.find("#loot-table .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }

    // Notifications
    const notificationsDisabled = !settings.notifications.global;

    for (let notification in settings.notifications) {
        let option;

        if (Array.isArray(settings.notifications[notification])) {
            let text = settings.notifications[notification].join(",");
            option = preferences.find(`#notifications-${notification} input[type='text']`);
            option.value = text;
        } else {
            option = preferences.find(`#notifications-${notification} input`);
            option.checked = settings.notifications[notification];
        }

        if (notificationsDisabled && notification !== "global") option.setAttribute("disabled", true);
    }

    preferences.find("#notifications-global input").addEventListener("click", (event) => {
        const disableNotifications = !event.target.checked;

        for (let notification in settings.notifications) {
            if (notification === "global") continue;

            let option = preferences.find(`#notifications-${notification} input`);

            if (disableNotifications) option.setAttribute("disabled", true);
            else option.removeAttribute("disabled");
        }
    })

    // Icons
    let icons_parent = doc.find("#preferences #icons");
    for (let i = 1; i < 81; i++) {
        let outer_div = doc.new({ type: "div", class: `icon` })
        let inner_div = doc.new({ type: "div", class: `icon${i}` });

        outer_div.appendChild(inner_div);
        icons_parent.appendChild(outer_div);

        outer_div.addEventListener("click", function () {
            outer_div.classList.toggle("disabled");
        });
    }
    for (let icon of hide_icons) {
        preferences.find(`.${icon}`).parentElement.classList.add("disabled");
    }

    // Areas
    for (let area of preferences.findAll("#areas span")) {
        area.onclick = function () {
            area.classList.toggle("disabled");
        }
    }
    for (let area of hide_areas) {
        preferences.find(`#areas span[name='${area}']`).classList.add("disabled");
    }

    // Inactivity Faction
    let orange_time_faction = "";
    let red_time_faction = "";
    for (let time in settings.inactivity_alerts_faction) {
        if (settings.inactivity_alerts_faction[time] == "#fde5c8") {
            orange_time_faction = (parseFloat(time) / 24 / 60 / 60 / 1000).toFixed(0);
        } else if (settings.inactivity_alerts_faction[time] == "#ffc8c8") {
            red_time_faction = (parseFloat(time) / 24 / 60 / 60 / 1000).toFixed(0);
        }
    }
    preferences.find("#faction-inactivity_alerts_first input").value = orange_time_faction;
    preferences.find("#faction-inactivity_alerts_second input").value = red_time_faction;

    // Inactivity Company
    let orange_time_company = "";
    let red_time_company = "";
    for (let time in settings.inactivity_alerts_company) {
        if (settings.inactivity_alerts_company[time] == "#fde5c8") {
            orange_time_company = (parseFloat(time) / 24 / 60 / 60 / 1000).toFixed(0);
        } else if (settings.inactivity_alerts_company[time] == "#ffc8c8") {
            red_time_company = (parseFloat(time) / 24 / 60 / 60 / 1000).toFixed(0);
        }
    }
    preferences.find("#company-inactivity_alerts_first input").value = orange_time_company;
    preferences.find("#company-inactivity_alerts_second input").value = red_time_company;

    // Filters (Faction)
    for (let faction of filters.preset_data.factions.data) {
        let row = doc.new({ type: "div", class: "row" });
        let radio_input = doc.new({ type: "input", attributes: { type: "radio", name: "filter-faction", value: faction } });
        let name_input = doc.new({ type: "input", class: "text name", value: faction });
        let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
        let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

        remove_icon.addEventListener("click", function (event) {
            event.target.parentElement.parentElement.remove();
        });

        remove_icon_wrap.addEventListener("click", function (event) {
            event.target.parentElement.remove();
        });

        remove_icon_wrap.appendChild(remove_icon);
        row.appendChild(radio_input);
        row.appendChild(name_input);
        row.appendChild(remove_icon_wrap);

        let table_body = preferences.find("#filter-factions .body");
        table_body.insertBefore(row, table_body.find(".row.input"));
    }
    if (filters.preset_data.factions.default) preferences.find(`#filter-factions input[value='${filters.preset_data.factions.default}']`).checked = true;

    // changing subsite
    for (let link of preferences.findAll(".navigation>div:not(.heading)")) {
        link.onclick = function () {
            let name = link.getAttribute("name");
            preferences.find(`.inner-content .section.active`).classList.remove("active");
            preferences.find(`.navigation .active`).classList.remove("active");
            preferences.find(`.inner-content .section[name='${name}']`).classList.add("active");
            link.classList.add("active");
        }
    }
}

function targetList() {
    setupValueChanger();

    target_list = target_list.targets;

    let table = doc.find("#target_list .table");
    let header = table.find(".header");
    let body = table.find(".body");

    let headings = [
        { name: "id", text: "ID", type: "neutral" },
        { name: "win", type: "good" },
        { name: "mug", type: "good" },
        { name: "leave", type: "good" },
        { name: "hosp", type: "good" },
        { name: "arrest", type: "good" },
        { name: "special", type: "good" },
        { name: "assist", type: "good" },
        { name: "defend", type: "good" },
        { name: "lose", text: "Losses", type: "bad" },
        { name: "defend_lose", text: "Defends lost", type: "bad" },
        { name: "stalemate", type: "bad" },
        { name: "stealth", type: "neutral" },
        { name: "respect", text: "Respect", type: "neutral" },
    ]

    // Header row
    let type;
    for (let heading of headings) {
        let div = doc.new("div");
        div.setAttribute("name", heading.name);

        if ((!type || type != heading.type) && heading.name != "id") {
            div.setClass(`new-section ${heading.type}`);
        } else {
            div.setClass(heading.type);
        }

        if (heading.text) {
            div.innerText = heading.text;
        } else {
            div.innerText = capitalize(heading.name) + "s";
        }

        // Sorting icon
        if (heading.name == "id") {
            let icon = doc.new("i");
            icon.setClass("fas fa-caret-up");
            div.appendChild(icon);
        }

        type = heading.type;
        header.appendChild(div);

        div.addEventListener("click", function () {
            sort(table, headings.indexOf(heading) + 1, "value");
        });
    }

    // Body
    for (let id in target_list) {
        if (id == "date")
            continue;

        type = undefined;
        let row = doc.new("div");
        row.setClass("row");

        for (let heading of headings) {
            let item = doc.new("div");

            if ((!type || type != heading.type) && heading.name != "id") {
                item.setClass(`new-section ${heading.type}`);
            } else {
                item.setClass(heading.type);
            }

            if (heading.name == "id") {
                item.innerText = id;
                item.setAttribute("value", id);
            } else if (heading.name == "respect") {
                let respect_type = getRespectType(target_list[id]);

                let leaves = target_list[id][respect_type]["leave"].length > 0 ? true : false;

                if (leaves) {
                    item.innerText = getAverage(target_list[id][respect_type]["leave"]);
                    item.setAttribute("value", item.innerText);
                } else {
                    let averages = [];

                    for (let list in target_list[id][respect_type]) {
                        let avrg = getAverage(target_list[id][respect_type][list]);

                        if (avrg != 0) {
                            averages.push(avrg);
                        }
                    }

                    item.innerText = getAverage(averages);
                    item.setAttribute("value", item.innerText);
                }

                if (item.innerText == "0") {
                    item.setAttribute("value", "-");
                    item.innerText = "-";
                    item.setAttribute("priority", "4");
                } else if (respect_type == "respect") {
                    item.innerText = item.innerText + "*";
                    item.setAttribute("priority", "3");
                } else if (respect_type == "respect_base") {
                    if (leaves) {
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
            if (["mug", "leave", "hosp", "arrest", "special", "assist", "stealth"].includes(heading.name)) {
                let value = target_list[id][heading.name];
                let percentage = (value / target_list[id]["win"] * 100).toFixed();
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

    function getRespectType(enemy) {
        let type = "respect";

        for (let list in enemy.respect_base) {
            if (enemy.respect_base[list].length > 0) {
                type = "respect_base";
                break;
            }
        }

        return type;
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
}

function apiInfo() {
    // Fill in API key
    doc.find("#api_field").value = api_key;
    setupApiStatistics();

    // Set new version text
    if (new_version.available) {
        doc.find("#about #new-version span").innerText = new_version.version;
    } else {
        doc.find("#about #new-version").style.display = "none";
    }

    // Allow notifications text
    if (Notification.permission != "granted") {
        doc.find("#allow_notifications").parentElement.classList.remove("hidden");
    }
}

function server() {
    loadingPlaceholder(doc.find("#server #tt_server_user_info"), true);

    fetch(`https://torntools.gregork.com/api/${userdata.player_id}/mydata`)
        .then(async response => {
            let result = await response.json();
            console.log("result", result);

            loadingPlaceholder(doc.find("#server #tt_server_user_info"), false);

            let pre;
            if (result.data) {
                let [day, month, year, hours, minutes, seconds] = dateParts(new Date(result.data.date));
                doc.find("#server #tt_server_user_info+.date span").innerText = formatDate([day, month, year], settings.format.date);
                delete result.data.date;

                pre = JSON.stringify(result.data, null, 2);
            } else pre = JSON.stringify(result, null, 2);

            doc.find("#server #tt_server_user_info").innerText = pre;

            doc.find("#server_export").onclick = () => {
                loadConfirmationPopup({
                    title: 'Export',
                    message: `### Following information about you will be exported:
- Player ID
- Player Username
- Client version
- Client database size
- Database
    - vault
    - stock alerts
    - loot alerts
    - allies
    - custom links
    - chat highlight
    - hidden icons
    - quick items & crimes
    - notes
    - filter settings
    - sorting settings
    - watchlist
    - preferences
                    `,
                })
                    .then(() => {
                        exportData();
                    })
                    .catch(() => { })
            }

            doc.find("#server_import").onclick = () => {
                importData();
            }

            doc.find("#server_clear").onclick = () => {
                loadConfirmationPopup({
                    title: 'Clear Data',
                    message: `### Are you sure you want to Delete following data from the remote server?
- Player ID
- Player Username
- Client version
- Client database size
- Database
    - vault
    - stock alerts
    - loot alerts
    - allies
    - custom links
    - chat highlight
    - hidden icons
    - quick items & crimes
    - notes
    - filter settings
    - sorting settings
    - watchlist
    - preferences
            `,
                })
                    .then(() => {
                        clearRemoteData();
                    })
                    .catch(() => { })
            }
        });
}

function about() {
    // About info
    doc.find("#about #version span").innerText = `v${version}`;
    if (chrome.storage.local.getBytesInUse) {
        chrome.storage.local.getBytesInUse(function (data) {
            doc.find("#about #data-used span").innerText = formatBytes(data);
        });
    } else {
        setTimeout(() => doc.find("#about #data-used span").innerText = formatBytes(JSON.stringify(DB).length), 0);
    }

    // Set new version text
    if (new_version.available) {
        doc.find("#about #new-version span").innerText = new_version.version;
    } else {
        doc.find("#about #new-version").style.display = "none";
    }
}

// Functions

function savePreferences(preferences, settings, target_list_enabled) {
    // General
    settings.update_notification = preferences.find("#update_notification input").checked;
    settings.force_tt = preferences.find("#force_tt input").checked;
    settings.format.date = preferences.find("input[name=format-date]:checked").parentElement.id.split("-")[2];
    settings.format.time = preferences.find("input[name=format-time]:checked").parentElement.id.split("-")[2];
    settings.theme = preferences.find("input[name=theme]:checked").parentElement.id.split("-")[1];
    settings.notifications_tts = preferences.find("#notifications_tts input").checked;
    settings.notifications_sound = preferences.find("#notifications_sound input").checked;
    settings.notifications_link = preferences.find("#notifications_link input").checked;
    settings.clean_flight = preferences.find("#clean_flight input").checked;
    settings.font_size = preferences.find("#font_size input").value.replace(/px/, "") + "px";

    // Tabs
    for (let tab in settings.tabs) {
        if (tab == "default") {
            settings.tabs[tab] = preferences.find(`input[name=default-tab]:checked`).parentElement.innerText.toLowerCase();
        } else {
            settings.tabs[tab] = preferences.find(`#tab-${tab} input`).checked;
        }
    }

    // Achievements
    for (let key in settings.achievements) {
        settings.achievements[key] = preferences.find(`#achievements-${key} input`).checked;
    }

    // Other scripts
    for (let page in settings.pages) {
        for (let option in settings.pages[page]) {
            const optionDiv = preferences.find(`#${page}-${option}`);
            if (!optionDiv) continue;

            if (optionDiv.find("input")) settings.pages[page][option] = optionDiv.find("input").checked;
            else if (optionDiv.find("select")) settings.pages[page][option] = optionDiv.find("select").selectedOptions[0].getAttribute("value");
        }
    }
    // settings.remove_info_boxes = preferences.find(`#remove_info_boxes input`).checked;

    // Target list
    target_list_enabled = preferences.find(`#target_list input`).checked;

    // Allies
    let allies = [];
    for (let ally of preferences.findAll("#ff-table .row:not(.input) .text")) {
        allies.push(ally.value.trim());
    }

    // Custom links
    let custom_links = [];
    for (let link of preferences.findAll("#custom_links .row:not(.input")) {
        console.log(link.find(".new_tab").checked)
        custom_links.push({
            text: link.find(".name").value,
            href: link.find(".href").value,
            new_tab: link.find(".new_tab").checked
        });
    }

    // Loot alerts
    let alerts = {}
    for (let npc of preferences.findAll(`#loot-table .row`)) {
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
    for (let row of preferences.findAll("#chat_highlight .row:not(.input)")) {
        let name = row.find(".name").value;
        let color = row.find(".color").value;

        highlights[name] = color;
    }

    // Notifications
    for (let notification in settings.notifications) {
        if (preferences.find(`#notifications-${notification} input[type='text']`)) {
            let values = preferences.find(`#notifications-${notification} input[type='text']`).value.split(",").filter(x => x !== "");

            settings.notifications[notification] = values;
        } else {
            settings.notifications[notification] = preferences.find(`#notifications-${notification} input[type='checkbox']`).checked;
        }
    }

    // Icons
    let icons = [];
    for (let icon of preferences.findAll(".icon.disabled>div")) {
        icons.push(icon.getAttribute("class"));
    }

    // Areas
    const areas = [];
    for (let area of preferences.findAll("#areas span.disabled")) {
        areas.push(area.getAttribute("name"));
    }

    // Inactivity Faction
    settings.inactivity_alerts_faction = {}
    let orange_time_faction = String(parseFloat(preferences.find("#faction-inactivity_alerts_first input").value) * 24 * 60 * 60 * 1000);
    let red_time_faction = String(parseFloat(preferences.find("#faction-inactivity_alerts_second input").value) * 24 * 60 * 60 * 1000);
    if (!isNaN(orange_time_faction)) {
        settings.inactivity_alerts_faction[orange_time_faction] = "#fde5c8";
    }
    if (!isNaN(red_time_faction)) {
        settings.inactivity_alerts_faction[red_time_faction] = "#ffc8c8";
    }

    // Inactivity Company
    settings.inactivity_alerts_company = {}
    let orange_time_company = String(parseFloat(preferences.find("#company-inactivity_alerts_first input").value) * 24 * 60 * 60 * 1000);
    let red_time_company = String(parseFloat(preferences.find("#company-inactivity_alerts_second input").value) * 24 * 60 * 60 * 1000);
    if (!isNaN(orange_time_company)) {
        settings.inactivity_alerts_company[orange_time_company] = "#fde5c8";
    }
    if (!isNaN(red_time_company)) {
        settings.inactivity_alerts_company[red_time_company] = "#ffc8c8";
    }

    // Items
    settings.pages.items.highlight

    // Filters (Faction)
    let filter_factions = {
        default: "",
        data: []
    }
    for (let row of preferences.findAll("#filter-factions .row:not(.input)")) {
        let name = row.find(".name").value;

        if (row.find("input[type=radio]").checked == true) {
            filter_factions.default = name;
        }

        filter_factions.data.push(name);
    }
    console.log("filter factions", filter_factions);

    console.log("New settings", settings);

    ttStorage.set({ "settings": settings });
    ttStorage.set({ "allies": allies });
    ttStorage.set({ "custom_links": custom_links });
    ttStorage.set({ "loot_alerts": alerts });
    ttStorage.set({ "chat_highlight": highlights });
    ttStorage.set({ "hide_icons": icons });
    ttStorage.set({ "hide_areas": areas });
    ttStorage.change({
        "filters": {
            "preset_data": {
                "factions": filter_factions
            }
        }
    });

    ttStorage.change({ "target_list": { "show": target_list_enabled } }, function () {
        ttStorage.get("target_list", function (target_list) {
            console.log("new target list", target_list);
        });
    });

    message("Settings saved.", true);
}

function message(text, good, options = {}) {
    let message_element = doc.find("#message");
    message_element.innerText = text;
    if (good) {
        message_element.style.backgroundColor = "#30e202";
    } else {
        message_element.style.backgroundColor = "#ff19199e";
    }

    message_element.style.maxHeight = message_element.scrollHeight + "px";

    if (options.reload) {
        setTimeout(function () {
            location.reload();
        }, 1200);
    } else {
        setTimeout(function () {
            message_element.innerText = "";
            message_element.style.maxHeight = null;
        }, 1500);
    }
}

function setupValueChanger() {
    doc.find("#num_per .switch-input").addEventListener("click", function (event) {
        let rows = doc.findAll("#target_list .table .body .row");

        for (let row of rows) {
            for (let item of row.findAll("div")) {
                if (item.getAttribute("percentage")) {
                    if (event.target.checked)
                        item.innerText = item.getAttribute("percentage") + "%";
                    else
                        item.innerText = item.getAttribute("value");
                }
            }
        }
    });
}

function resetApiKey() {
    let new_api_key = doc.find("#api_field").value;

    ttStorage.set({ "api_key": new_api_key }, function () {
        chrome.runtime.sendMessage({ action: "fetch", type: "torndata" }, function (response) {
            message("API key changed.", true);
        });
    });
}

function addAllyToList(event) {
    let row = doc.new({ type: "div", class: "row" });
    let text_input = doc.new({ type: "input", class: "text", value: event.target.previousElementSibling.value });
    let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
    let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" })

    remove_icon.addEventListener("click", function (event) {
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function (event) {
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

function addLinktoList(event) {
    let row = doc.new({ type: "div", class: "row" });
    let new_tab_input = doc.new({ type: "input", class: "new_tab", attributes: { type: "checkbox" } });
    let name_input = doc.new({
        type: "input",
        class: "text name",
        value: event.target.previousElementSibling.previousElementSibling.value
    });
    let href_input = doc.new({ type: "input", class: "text href", value: event.target.previousElementSibling.value });
    let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
    let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

    remove_icon.addEventListener("click", function (event) {
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function (event) {
        event.target.parentElement.remove();
    });

    remove_icon_wrap.appendChild(remove_icon);
    row.appendChild(new_tab_input);
    row.appendChild(name_input);
    row.appendChild(href_input);
    row.appendChild(remove_icon_wrap);

    let table_body = preferences.find("#custom_links .body");
    table_body.insertBefore(row, table_body.find(".row.input"));

    if (event.target.previousElementSibling.previousElementSibling.previousElementSibling.checked) {
        new_tab_input.checked = true;
    }

    // Clear input
    event.target.previousElementSibling.value = "";
    event.target.previousElementSibling.previousElementSibling.value = "";
    event.target.previousElementSibling.previousElementSibling.previousElementSibling.checked = true;
}

function addFactionToFilter(event) {
    let row = doc.new({ type: "div", class: "row" });
    let radio_input = doc.new({
        type: "input",
        attributes: { type: "radio", name: "filter-faction", value: event.target.previousElementSibling.value }
    });
    let name_input = doc.new({ type: "input", class: "text name", value: event.target.previousElementSibling.value });
    let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
    let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

    if (event.target.previousElementSibling.previousElementSibling.checked == true) {
        radio_input.checked = true;
    }

    remove_icon.addEventListener("click", function (event) {
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function (event) {
        event.target.parentElement.remove();
    });

    remove_icon_wrap.appendChild(remove_icon);
    row.appendChild(radio_input);
    row.appendChild(name_input);
    row.appendChild(remove_icon_wrap);

    let table_body = preferences.find("#filter-factions .body");
    table_body.insertBefore(row, table_body.find(".row.input"));

    // Clear input
    event.target.previousElementSibling.value = "";
    event.target.previousElementSibling.previousElementSibling.checked = false;
}

function addHighlightToList(event) {
    let row = doc.new({ type: "div", class: "row" });
    let name_input = doc.new({
        type: "input",
        class: "text name",
        value: event.target.previousElementSibling.previousElementSibling.value
    });
    let color_input = doc.new({
        type: "input",
        class: "text color",
        value: event.target.previousElementSibling.value,
        attributes: { type: "color" }
    });
    let remove_icon_wrap = doc.new({ type: "div", class: "remove-icon-wrap" });
    let remove_icon = doc.new({ type: "i", class: "remove-icon fas fa-trash-alt" });

    remove_icon.addEventListener("click", function (event) {
        event.target.parentElement.parentElement.remove();
    });

    remove_icon_wrap.addEventListener("click", function (event) {
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

function setupApiStatistics() {
    console.log("api history", api_history);
    if (!api_history) return;

    let time_limit = 5 * 60 * 1000;  // (ms) 5 minutes
    let chartColors = {
        "red": "rgb(255, 99, 132)",
        "orange": "rgb(255, 159, 64)",
        "yellow": "rgb(255, 205, 86)",
        "green": "rgb(75, 192, 192)",
        "blue": "rgb(54, 162, 235)",
        "purple": "rgb(153, 102, 255)",
        "grey": "rgb(201, 203, 207)"
    }

    let data = {}
    let datasets = [
        {
            label: "userdata",
            backgroundColor: Chart.helpers.color(chartColors.red).alpha(0.5).rgbString(),
            borderWidth: 1,
            data: []
        },
        {
            label: "profile_stats",
            backgroundColor: Chart.helpers.color(chartColors.blue).alpha(0.5).rgbString(),
            borderWidth: 1,
            data: []
        },
        {
            label: "stakeouts",
            backgroundColor: Chart.helpers.color(chartColors.purple).alpha(0.5).rgbString(),
            borderWidth: 1,
            data: []
        },
        {
            label: "other",
            backgroundColor: Chart.helpers.color(chartColors.grey).alpha(0.5).rgbString(),
            borderWidth: 1,
            data: []
        }
    ]

    let torn_api_history = [...api_history.torn].reverse();

    // Populate data
    for (let fetch of torn_api_history) {
        let fetch_date = new Date(fetch.date);
        if (new Date() - fetch_date > time_limit) break;

        let [day, month, year, hours, minutes, seconds] = dateParts(fetch_date);
        let fetch_time = formatTime([hours, minutes], "eu");

        if (fetch_time in data) {
            data[fetch_time][fetch.name]++;
        } else {
            data[fetch_time] = {
                "userdata": 0,
                "profile_stats": 0,
                "stakeouts": 0,
                "other": 0
            }
            data[fetch_time][fetch.name]++;
        }
    }

    let data_keys = [...Object.keys(data)].reverse();
    // Populate datasets
    for (let time of data_keys) {
        for (let set of datasets) {
            set.data.push(data[time][set.label]);
        }
    }

    // console.log(data)
    // console.log(data_keys)
    // console.log(datasets)

    // Replace labels
    datasets.map(x => x.label = capitalize(x.label.replace(/_/g, " ")));

    let ctx = doc.find("#torn-api-graph").getContext("2d");
    let torn_api_chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data_keys,
            datasets: datasets
        },
        options: {
            title: {
                display: true,
                text: "Torn API"
            },
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function (value, index, values) {
                            if (Math.floor(value) == value) {
                                return value;
                            }
                        }
                    },
                }]
            },
        }
    });

    // Statistics
    time_limit = 10 * 60 * 60 * 1000;
    let stats = {}

    for (let fetch of torn_api_history) {
        let fetch_date = new Date(fetch.date);
        if (new Date() - fetch_date > time_limit) break;

        let [day, month, year, hours, minutes, seconds] = dateParts(fetch_date);

        if (hours == new Date().getHours()) continue;

        let fetch_time_hours = formatTime([hours, ""], "eu");
        let fetch_time_minutes = formatTime(["", minutes], "eu");

        if (fetch_time_hours in stats) {
            if (fetch_time_minutes in stats[fetch_time_hours]) {
                stats[fetch_time_hours][fetch_time_minutes]++;
            } else {
                stats[fetch_time_hours][fetch_time_minutes] = 1;
            }
        } else {
            stats[fetch_time_hours] = {
                [fetch_time_minutes]: 1
            }
        }
    }

    // console.log("stats", stats);
    let total_minutes = 0;
    let total_hours = 0;
    let total_minute_requests = 0;
    let total_hour_requests = 0;

    for (let hour in stats) {
        total_hours++;

        for (let minute in stats[hour]) {
            total_minutes++;
            total_minute_requests += stats[hour][minute]
            total_hour_requests += stats[hour][minute]
        }
    }

    doc.find("#average_calls_per_minute").innerText = (total_minute_requests / total_minutes).toFixed(1);
    doc.find("#average_calls_per_hour").innerText = (total_hour_requests / total_hours).toFixed(1);
}

function exportData() {
    ttStorage.get(null, async (database) => {

        if (!database) {
            return message('No database found.', false);
        }
        if (!database.userdata) {
            return message('No player ID found.', false);
        }

        let post_data = {
            id: database.userdata.player_id.toString(),
            name: database.userdata.name,
            client: {
                version: chrome.runtime.getManifest().version,
                disk_space: await (function () {
                    return new Promise(function (resolve, reject) {
                        if (chrome.storage.local.getBytesInUse) {
                            chrome.storage.local.getBytesInUse(function (data) {
                                return resolve(data.toString());
                            });
                        } else {
                            return resolve(formatBytes(JSON.stringify(DB).length));
                        }
                    });
                })()
            },
            date: new Date().toString(),
            storage: {}
        }

        let keys_to_export = [
            "vault",
            "stock_alerts",
            "loot_alerts",
            "allies",
            "custom_links",
            "chat_highlight",
            "hide_icons",
            "quick",
            "notes",
            "filters",
            "sorting",
            "watchlist",
            "settings"
        ]

        for (let key of keys_to_export) {
            if (!(key in database)) {
                return message(`Database is missing key: ${key}`, false);
            }

            post_data.storage[key] = database[key];
        }

        fetch(`https://torntools.gregork.com/api/${userdata.player_id}/storage/update`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(post_data)
        })
            .then(async response => {
                let result = await response.json();
                console.log("export", result);

                message(result.message, result.success, { reload: true });
            }).catch(err => {
                console.log(err);

                if (err.name === "SyntaxError") {
                    message('Malformed response', false);
                }
            });
    });
}

function importData() {
    fetch(`https://torntools.gregork.com/api/${userdata.player_id}/storage`)
        .then(async response => {
            let result = await response.json();
            console.log("import", result);

            if (!result.success) return message(result.message, false);

            loadConfirmationPopup({
                title: 'Import',
                message: `### Are you sure that you want to merge following items?
  - asd
            
            `
            })
                .then(async () => {
                    let import_result;
                    for (let key in result.data) {
                        import_result = await new Promise(function (resolve, reject) {
                            try {
                                ttStorage.set({ [key]: result.data[key] }, function () {
                                    console.log(`${key} imported.`);
                                    return resolve({ success: true, message: 'All settings imported' });
                                });
                            } catch (err) {
                                return resolve({ success: false, message: err });
                            }
                        });
                    }

                    message(import_result.message, import_result.success, { reload: true });
                })
                .catch(() => { })
        })
        .catch(err => {
            console.log(err);

            if (err.name === "SyntaxError") {
                message('Malformed response', false);
            }
        })
}

function clearRemoteData() {
    fetch(`https://torntools.gregork.com/api/${userdata.player_id}/storage/clear`, {
        method: "POST",
        headers: { "content-type": "application/json" }
    })
        .then(async response => {
            let result = await response.json();
            console.log("clear", result);

            message(result.message, result.success, { reload: true });
        })
        .catch(err => {
            console.log(err);

            if (err.name === "SyntaxError") {
                message('Malformed response', false);
            }
        })
}