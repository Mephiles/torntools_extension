console.log("Loading Global Functions");

chrome = chrome || browser;
const doc = document;
var DB;
var mobile = false;
var db_loaded = false;
var drug_dict = {
    "cannabis": {
        "pros": [
            "Increased crime success rate",
            "+2-3 Nerve",
        ],
        "cons": [
            "-20% Strength",
            "-25% Defense",
            "-35% Speed"
        ],
        "cooldown": "60-90 minutes",
        "overdose": {
            "bars": ["-100% Energy & Nerve"],
            "hosp_time": "5 hours",
            "extra": "'Spaced Out' honor bar"
        }
    },
    "ecstasy": {
        "pros": [
            "Doubles Happy"
        ],
        "cooldown": "3-4 hours",
        "overdose": {
            "bars": ["-100% Energy & Happy"]
        }
    },
    "ketamine": {
        "pros": [
            "+50% Defense"
        ],
        "cons": [
            "-20% Strength & Speed"
        ],
        "cooldown": "45-60 minutes",
        "overdose": {
            "bars": ["-100% Energy, Nerve & Happy"],
            "stats": "-20% Strength & Speed",
            "hosp_time": "16-17 hours",
            "extra": "24-27 hours of cooldown"
        }
    },
    "lsd": {
        "pros": [
            "+30% Strength",
            "+50% Defense",
            "+50 Energy",
            "+200-500 Happy",
            "+5 Nerve"
        ],
        "cons": [
            "-30% Speed & Dexterity"
        ],
        "cooldown": "6-8 hours",
        "overdose": {
            "bars": [
                "-100% Energy, Nerve",
                "-50% Happy"
            ],
            "stats": "-30% Speed & Dexterity"
        }
    },
    "opium": {
        "pros": [
            "Removes all hospital time (except Radiation Sickness) and replenishes life by 66.6%",
            "+50-100 Happy"
        ],
        "cooldown": "3-4 hours"
    },
    "pcp": {
        "pros": [
            "+20% Strength & Dexterity",
            "+250 Happy"
        ],
        "cooldown": "4-7 hours",
        "overdose": {
            "bars": [
                "-100% Energy, Nerve & Happy"
            ],
            "hosp_time": "27 hours",
            "stats": "-10x(player level) Speed (permanent)"
        }
    },
    "shrooms": {
        "pros": [
            "+500 Happy"
        ],
        "cons": [
            "-20% All Battle Stats",
            "-25 Energy (caps at 0)"
        ],
        "cooldown": "3-4 hours",
        "overdose": {
            "bars": [
                "-100% Energy, Nerve & Happy"
            ],
            "hosp_time": "1h 40min"
        }
    },
    "speed": {
        "pros": [
            "+20% Speed",
            "+50 Happy"
        ],
        "cons": [
            "-20% Dexterity"
        ],
        "cooldown": "4-6 hours",
        "overdose": {
            "bars": [
                "-100% Energy, Nerve & Happy"
            ],
            "stats": "-6x(player level) Strength & Defense (permanent)",
            "hosp_time": "7h 30min"
        }
    },
    "vicodin": {
        "pros": [
            "+25% All Battle Stats",
            "+75 Happy"
        ],
        "cons": [
            "-35% All Battle Stats"
        ],
        "cooldown": "4-6 hours",
        "overdose": {
            "bars": [
                "-150 Happy"
            ]
        }
    },
    "xanax": {
        "pros": [
            "+250 Energy",
            "+75 Happy"
        ],
        "cooldown": "6-8 hours",
        "overdose": {
            "bars": [
                "-100% Energy, Nerve & Happy"
            ],
            "hosp_time": "3 days 12 hours",
            "extra": "24 hours of cooldown and increased addiction"
        }
    },
    "love_juice": {
        "pros": [
            "Cost of Attacking & Reviving reduced to 15 Energy",
            "+50% Speed",
            "+25% Dexterity"
        ],
        "cons": [
            "Only works on Valentine's Day"
        ],
        "cooldown": "5 hours"
    },
}

const local_storage = {
    get: function (key, callback) {
        let promise = new Promise(function (resolve, reject) {
            if (Array.isArray(key)) {
                let arr = [];
                chrome.storage.local.get(key, function (data) {
                    for (let item of key) {
                        arr.push(data[item]);
                    }
                    return resolve(arr);
                });
            } else if (key == null) {
                chrome.storage.local.get(null, function (data) {
                    return resolve(data);
                });
            } else {
                chrome.storage.local.get([key], function (data) {
                    return resolve(data[key]);
                });
            }
        });

        promise.then(function (data) {
            callback(data);
        });
    },
    set: function (object, callback) {
        chrome.storage.local.set(object, function () {
            callback ? callback() : null;
        });
    },
    change: function (keys_to_change, callback) {
        for(let top_level_key of Object.keys(keys_to_change)){
            chrome.storage.local.get(top_level_key, function (data) {
                let database = data[top_level_key];
                database = recursive(database, keys_to_change[top_level_key]);
    
                function recursive(parent, keys_to_change){
                    for(let key in keys_to_change){
                        if(key in parent && typeof keys_to_change[key] == "object" && !Array.isArray(keys_to_change[key])){
                            parent[key] = recursive(parent[key], keys_to_change[key]);
                        } else {
                            parent[key] = keys_to_change[key];
                        }
                    }
                    return parent;
                }
    
                chrome.storage.local.set({[top_level_key]: database}, function () {
                    callback ? callback() : null;
                });
            });
        }
    },
    clear: function (callback) {
        chrome.storage.local.clear(function () {
            callback ? callback() : null;
        });
    },
    reset: function (callback) {
        chrome.storage.local.get(["api_key"], function (data) {
            let api_key = data.api_key;
            chrome.storage.local.clear(function () {
                chrome.storage.local.set(STORAGE, function () {
                    chrome.storage.local.set({
                        "api_key": api_key
                    }, function () {
                        chrome.storage.local.get(null, function (data) {
                            console.log("Storage cleared");
                            console.log("New storage", data);
                            callback ? callback() : null;
                        });
                    });
                });
            });
        });
    }
}

const STORAGE = {
    // app settings
    "api_key": undefined,
    "updated": "force_true",
    "api": {
        "count": 0,
        "limit": 60,
        "online": true,
        "error": ""
    },
    "extensions": {},
    "new_version": {},

    // userdata
    "itemlist": {},
    "torndata": {},
    "userdata": {},
    "oc": {},  // organized crimes

    // script data
    "personalized": {},
    "mass_messages": {
        "active": false,
        "list": [],
        "index": 0,
        "subject": undefined,
        "message": undefined
    },
    "loot_times": {},
    "travel_market": [],
    "networth": {
        "previous": {
            "value": undefined,
            "date": undefined
        },
        "current": {
            "value": undefined,
            "date": undefined
        }
    },
    "target_list": {
        "last_target": "-1",
        "show": true,
        "targets": {}
    },
    "vault": {
        "user": {
            "initial_money": 0,
            "current_money": 0
        },
        "partner": {
            "initial_money": 0,
            "current_money": 0
        },
        "total_money": 0,
        "initialized": false,
        "last_transaction": undefined
    },
    "stock_alerts": {},
    "loot_alerts": {},
    "allies": [],
    "custom_links": [],
    "chat_highlight": {},
    "hide_icons": [],
    "quick": {
        "items": [],
        "crimes": []
    },
    "notes": {
        "text": undefined,
        "height": undefined
    },
    "stakeouts": {},
    "filters": {
        "travel": {
            "table_type": "basic",
            "open": false,
            "item_type": "all",
            "country": "all"
        },
        "profile_stats": {
            "open": true,
            "auto_fetch": true,
            "chosen_stats": []
        }
    },
    "cache": {
        "profile_stats": {}
    },
    "watchlist": [],

    // user settings
    "settings": {
        "update_notification": true,
        "notifications_tts": false,
        "clean_flight": false,
        // "remove_info_boxes": false,
        "theme": "default",
        "force_tt": false,
        "inactivity_alerts_faction": {
            // "432000000": "#ffc8c8",  // 5 days
            // "259200000": "#fde5c8"  // 3 days
        },
        "inactivity_alerts_company": {
            // "432000000": "#ffc8c8",  // 5 days
            // "259200000": "#fde5c8"  // 3 days
        },
        "bounties_filter": {},
        "notifications": {
            "events": true,
            "messages": true,
            "status": true,
            "traveling": true,
            "cooldowns": true,
            "education": true,
            "energy": [100],
            "nerve": [100],
            "happy": [100],
            "life": [100],
            "hospital": [],
            "landing": []
        },
        "format": {
            "date": "eu",
            "time": "eu"
        },
        "tabs": {
            "market": true,
            "stocks": true,
            "calculator": true,
            "info": true,
            "default": "info"
        },
        "achievements": {
            "show": true,
            "completed": true
        },
        "pages": {
            "trade": {
                "item_values": true,
                "total_value": true,
            },
            "home": {
                "battle_stats": true,
                "networth": true
            },
            "missions": {
                "rewards": true
            },
            "city": {
                "items": true,
                "items_value": true,
                "closed_highlight": true
            },
            "profile": {
                "friendly_warning": true,
                "show_id": true,
                "loot_times": true,
                "status_indicator": true
            },
            "racing": {
                "upgrades": true
            },
            "gym": {
                "disable_buttons": false,
                "estimated_energy": true
            },
            "shop": {
                "profits": true
            },
            "casino": {
                "all": true,
                "hilo": true,
                "blackjack": true
            },
            "items": {
                "values": true,
                "drug_details": true
            },
            "travel": {
                "profits": true,
                "destination_table": true
            },
            "api": {
                "key": true,
                "pretty": true,
                "marking": false
            },
            "faction": {
                "oc_time": true,
                "armory": true,
                "oc_advanced": true,
                "announcements_page_full": false,
                "info_page_full": false,
                "armory_worth": false,
                "member_info": false
            },
            "properties": {
                "vault_sharing": true
            },
            "stockexchange": {
                "acronyms": true
            },
            "bazaar": {
                "worth": false
            },
            "company": {
                "member_info": false
            },
            "global": {
                "vault_balance": true,
                "notes": true,
                "hide_upgrade": false,
                "align_left": false,
            }
        }
    }
}

Document.prototype.find = function (type) {
    if (type.indexOf("=") > -1) {
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for (let element of document.querySelectorAll(key)) {
            if (element.innerText == value) {
                return element;
            }
        }

        try {
            this.querySelector(type)
        } catch(err){
            return undefined;
        }
    }
    return this.querySelector(type);
}
Element.prototype.find = function (type) {
    if (type.indexOf("=") > -1) {
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for (let element of document.querySelectorAll(key)) {
            if (element.innerText == value) {
                return element;
            }
        }

        try {
            this.querySelector(type)
        } catch(err){
            return undefined;
        }
    }
    return this.querySelector(type);
}

Document.prototype.findAll = function (type) {
    return this.querySelectorAll(type);
}
Element.prototype.findAll = function (type) {
    return this.querySelectorAll(type);
}

Document.prototype.new = function (new_element) {
    if(typeof new_element == "string"){
        return this.createElement(new_element);
    } else if(typeof new_element == "object"){
        let el = this.createElement(new_element.type);

        // if(new_element.children){
        //     (function fillChildren(parent_el, children){
        //         console.log("PARENT", parent_el);
        //         console.log("CHILDREN", children);
        //         for(let child of children){
        //             let child_el = document.createElement(child.type);

        //             if(child.children){
        //                 fillChildren(child_el, child.children);
        //             }
                    
        //             if(child.id){
        //                 child_el.id = child.id;
        //             }
        //             if(child.class){
        //                 child_el.setAttribute("class", child.class);
        //             }
        //             if(child.text){
        //                 child_el.innerText = child.text;
        //             }
        //             if(child.value){
        //                 child_el.value = child.value;
        //             }
            
        //             for(let attr in child.attributes){
        //                 child_el.setAttribute(attr, child.attributes[attr]);
        //             }
        //             parent_el.appendChild(child_el);
        //         }
        //     })(el, new_element.children);
        // }

        if(new_element.id){
            el.id = new_element.id;
        }
        if(new_element.class){
            el.setAttribute("class", new_element.class);
        }
        if(new_element.text){
            el.innerText = new_element.text;
        }
        if(new_element.value){
            el.value = new_element.value;
        }
        if(new_element.href){
            el.href = new_element.href;
        }

        for(let attr in new_element.attributes){
            el.setAttribute(attr, new_element.attributes[attr]);
        }

        return el;
    }
}

Document.prototype.setClass = function (class_name) {
    return this.setAttribute("class", class_name);
}
Element.prototype.setClass = function (class_name) {
    return this.setAttribute("class", class_name);
}

const navbar = {
    new_section: function (name, attr = {}) {
        // process
        let parent = doc.find("#sidebarroot");
        let new_div = createNewBlock(name);
        let next_div = attr.next_element || findSection(parent, attr.next_element_heading);

        if (!next_div){
            if(attr.last){
                parent.appendChild(new_div);
            }
        } else {
            next_div.parentElement.insertBefore(new_div, next_div);
        }

        return new_div;

        function createNewBlock(name) {
            let sidebar_block = doc.new({type: "div", class: "sidebar-block___1Cqc2 tt-nav-section"});
            let content = doc.new({type: "div", class: "content___kMC8x"});
            let div1 = doc.new({type: "div", class: "areas___2pu_3"});
            let toggle_block = doc.new({type: "div", class: "toggle-block___13zU2"});
            let header = doc.new({type: "div", text: name, class: "tt-title"});
            if(DB.settings.theme == "default"){
                header.classList.add("title-green")
            } else if(DB.settings.theme == "alternative"){
                header.classList.add("title-black");
            }
            let toggle_content = doc.new({type: "div", class: "toggle-content___3XKOC"});

            toggle_block.appendChild(header);
            toggle_block.appendChild(toggle_content);
            div1.appendChild(toggle_block);
            content.appendChild(div1);
            sidebar_block.appendChild(content);

            return sidebar_block;
        }

        function findSection(parent, heading) {
            for (let head of parent.findAll("h2")) {
                if (head.innerText == heading) {
                    return head.parentElement.parentElement.parentElement;
                }
            }
            return undefined;
        }
    },
    new_cell: function (text, attributes = {}) {
        let defaults = {
            parent_heading: undefined,
            parent_element: undefined,
            first: undefined,
            style: undefined,
            href: undefined
        }
        attr = { ...defaults, ...attributes };

        // process
        let sidebar = doc.find("#sidebarroot");

        if (!attr.parent_element && attr.parent_heading) {
            attr.parent_element = (function () {
                for (let el of sidebar.findAll("h2")) {
                    if (el.firstChild.nodeValue == attr.parent_heading) {
                        return el.parentElement;
                    }
                }
                return undefined;
            })();
        }

        let toggle_content = attr.parent_element.find(".toggle-content___3XKOC");
        let new_cell_block = createNewCellBlock(text, attr.href, attr.style, attr.target);

        if (attr.first)
            toggle_content.insertBefore(new_cell_block, toggle_content.firstElementChild);
        else
            toggle_content.appendChild(new_cell_block);

        return new_cell_block;

        function createNewCellBlock(text, href, style) {
            let div = doc.new("div");
            div.setClass("area-desktop___2YU-q");
            let inner_div = doc.new("div");
            inner_div.setClass("area-row___34mEZ");
            let a = doc.new("a");
            a.setClass("desktopLink___2dcWC");
            href == "#" ? inner_div.style.cursor = "default" : a.setAttribute("href", href);
            a.setAttribute("target", "_blank");
            a.setAttribute("style", style);
            a.style.minHeight = "24px";
            a.style.lineHeight = "24px";
            let span = doc.new("span");
            span.innerText = text;

            a.appendChild(span);
            inner_div.appendChild(a);
            div.appendChild(inner_div);

            return div;
        }
    }
}

const info_box = {
    new_row: function (key, value, attr = {}) {
        // process

        let li = doc.new({type: "li", id: attr.id ? attr.id:"", class: attr.last? "last":""});
        if (attr.heading) {
            li.innerText = key;
            if(DB.settings.theme == "default"){
                li.classList.add("tt-box-section-heading");
                li.classList.add("tt-title");
                li.classList.add("title-green");
            } else if(DB.settings.theme == "alternative"){
                li.classList.add("tt-box-section-heading");
                li.classList.add("tt-title");
                li.classList.add("title-black");
            }
        } else {
            let span_left = doc.new({type: "span", class: "divider"});
            let span_left_inner = doc.new({type: "span", text: key, attributes: {style: "background-color: transparent;"}});
            let span_right = doc.new({type: "span", class: "desc"});
            let span_right_inner = doc.new({type: "span", text: value, attributes: {style: "padding-left: 3px;"}});

            span_left.appendChild(span_left_inner);
            span_right.appendChild(span_right_inner);
            li.appendChild(span_left);
            li.appendChild(span_right);
        }

        return li;
    }
}

const content = {
    new_container: function (name, attr = {}) {
        // process           
        if (attr.next_element_heading){
            attr.next_element = content.findContainer(attr.next_element_heading);
        }

        let parent_element = attr.next_element ? attr.next_element.parentElement : doc.find(".content-wrapper");
        let new_div = createNewContainer(name, attr.id, attr.collapsed, attr.dragzone, attr.header_only);

        if (attr.first)
            parent_element.insertBefore(new_div, parent_element.find(".content-title").nextElementSibling);
        else if (attr.next_element)
            parent_element.insertBefore(new_div, attr.next_element);
        else
            parent_element.appendChild(new_div);

        return new_div;

        function createNewContainer(name, id, collapsed, dragzone, header_only) {
            let div = doc.new({type: "div", id: id? id: undefined, attributes: {style: "position: relative;"}});

            let heading = doc.new({type: "div", text: name, class: "tt-title top-round m-top10", attributes: {style: "cursor: pointer;"}});
            if(DB.settings.theme == "default"){
                heading.classList.add("title-green")
            } else if(DB.settings.theme == "alternative"){
                heading.classList.add("title-black");
            }

            if(header_only){
                heading.classList.add("tt-header-only");
                div.appendChild(heading);
                return div;
            }

            let content = doc.new({type: "div", class: "cont-gray bottom-round tt-content content"});
            if(collapsed == true || collapsed == undefined){
                content.style.maxHeight = "0px";
            }
            if(dragzone){
                content.classList.add("tt-dragzone");
                content.addEventListener("dragover", onDragOver);
                content.addEventListener("drop", function(event){
                    onDrop(event);
                });
                content.addEventListener("dragenter", onDragEnter);
                content.addEventListener("dragleave", onDragLeave);
            }

            let icon;
            if(collapsed == false){
                icon = doc.new({type: "i", class: "fas fa-chevron-up container_collapse"});
            } else {
                icon = doc.new({type: "i", class: "fas fa-chevron-down container_collapse"});
            }
            
            div.appendChild(heading);
            div.appendChild(content);
            div.appendChild(icon);

            // Collapse
            heading.addEventListener("click", function(){
                if(content.style.maxHeight != "0px"){
                    content.style.maxHeight = "0px";
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                rotateElement(icon, 180);
            });

            icon.addEventListener("click", function(){
                if(content.style.maxHeight != "0px"){
                    content.style.maxHeight = "0px";
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                rotateElement(icon, 180);
            });

            return div;
        }
    },
    findContainer: function (name) {
        let headings = doc.findAll(".content-wrapper .title-black");

        for (let heading of headings) {
            if (heading.innerText == name)
                return heading.parentElement.parentElement;
        }

        return undefined;
    }
}

function flying() {
    return new Promise(function (resolve, reject) {
        let checker = setInterval(function () {
            let page_heading = doc.find("#skip-to-content");
            if(page_heading) {
                if (page_heading.innerText == "Traveling") {
                    resolve(true);
                    return clearInterval(checker);
                } else if (page_heading.innerText == "Error") {
                    for (let msg of doc.findAll(".msg")) {
                        if (msg.innerText == "You cannot access this page while traveling!") {
                            resolve(true);
                            return clearInterval(checker);
                        } else if(msg.innerText.indexOf("You are in") > -1){
                            console.log("here1");
                            resolve(true);
                            return clearInterval(checker);
                        }
                    }
                } else {
                    for (let msg of doc.findAll(".msg")) {
                        if(msg.innerText.indexOf("You are in") > -1){
                            resolve(false);
                            return clearInterval(checker);
                        }
                    }
                }
            }

            if(userdata && userdata.travel && userdata.travel.time_left > 0){
                resolve(true);
                return clearInterval(checker);
            } else {
                resolve(false);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function abroad() {
    return new Promise(function (resolve, reject) {
        let counter = 0;
        let checker = setInterval(function () {
            if (doc.find("#travel-home")) {
                resolve(true);
                return clearInterval(checker);
            } else if(doc.find(".header") && doc.find(".header").classList[doc.find(".header").classList.length-1] != "responsive-sidebar-header"){
                resolve(true);
                return clearInterval(checker);
            } else if (doc.find("#skip-to-content") && doc.find("#skip-to-content").innerText == "Preferences") {
                resolve(false);
                return clearInterval(checker);
            } else if (doc.find("#sidebarroot h2") && doc.find("#sidebarroot h2").innerText == "Information") {
                resolve(false);
                return clearInterval(checker);
            } else {
                for (let msg of doc.findAll(".msg")) {
                    if (msg.innerText == "You can't access this page while abroad.") {
                        resolve(true);
                        return clearInterval(checker);
                    } else if(msg.innerText.indexOf("You are in") > -1){
                        resolve(true);
                        return clearInterval(checker);
                    }
                }
            }

            if (counter >= 50) {
                resolve(false);
                return clearInterval(checker);
            } else {
                counter++;
            }
        }, 100);
    });
}

function captcha(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find("#skip-to-content")){
                if(doc.find("#skip-to-content").innerText == "Please Validate"){
                    resolve(true);
                    return clearInterval(checker);
                } else {
                    resolve(false);
                    return clearInterval(checker);
                }
            }
        }, 100);
    });
}

function secondsToHours(x) {
    return Math.floor(x / 60 / 60); // seconds, minutes
}

function secondsToDays(x) {
    return Math.floor(x / 60 / 60 / 24); // seconds, minutes, hours
}

function time_ago(time) {

    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    var time_formats = [
        [60, 'sec', 1], // 60
        [120, '1min ago', '1min from now'], // 60*2
        [3600, 'min', 60], // 60*60, 60
        [7200, '1h ago', '1h from now'], // 60*60*2
        [86400, 'h', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'd', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'w', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'mon', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'y', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'cen', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds == 0) {
        return 'Just now'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0,
        format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + '' + format[1] + ' ' + token;
        }
    return time;
}

function numberWithCommas(x, shorten = true) {
    if (!shorten)
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (Math.abs(x) >= 1e9) {
        if (Math.abs(x) % 1e9 == 0)
            return (x / 1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "bil";
        else
            return (x / 1e9).toFixed(3) + "bil";
    } else if (Math.abs(x) >= 1e6) {
        if (Math.abs(x) % 1e6 == 0)
            return (x / 1e6) + "mil";
        else
            return (x / 1e6).toFixed(3) + "mil";
    } else if (Math.abs(x) >= 1e3) {
        if (Math.abs(x) % 1e3 == 0)
            return (x / 1e3) + "k";
    }

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function dateParts(date) {
    let data = [
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ]

    return data.map(x => (x.toString().length == 1 ? "0" + x.toString() : x.toString()));
}

function capitalize(text, every_word = false) {
    if (!every_word)
        return text[0].toUpperCase() + text.slice(1);

    let words = text.trim().split(" ");
    let new_text = "";

    for (let word of words) {
        new_text = new_text + capitalize(word) + " ";
    }

    return new_text.trim();
}

function get_api(http, api_key) {
    return new Promise(async function(resolve, reject){
        try {
            const response = await fetch(http + "&key=" + api_key);
            const result = await response.json();
    
            if (result.error) {
                if(result.error.code == 9){  // API offline
                    console.log("API SYSTEM OFFLINE");
                    setBadge("error");
                    
                    local_storage.change({"api": { "online": false, "error": result.error.error }}, function(){
                        return resolve({ok: false, error: result.error.error});
                    });
                } else {
                    console.log("API ERROR:", result.error.error);
    
                    local_storage.change({"api": { "online": true, "error": result.error.error }}, function(){
                        return resolve({ok: false, error: result.error.error});
                    });
                }
            } else {
                try {
                    if(isNaN(await getBadgeText())){
                        setBadge("");
                    }
                } catch(err){console.log("Unable to get Badge.")}
                local_storage.change({"api": { "online": true, "error": "" }}, function(){
                    return resolve(result);
                });
            }
        } catch(err){
            console.log("Error Fetching API", err);
        }
    });
}

function isOverflownX(element) {
    return element.scrollWidth > element.clientWidth;
}
function isOverflownY(element) {
    return element.scrollHeight > element.clientHeight;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function rotateElement(element, degrees) {
    let start_degrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;

    if (start_degrees != 0 && start_degrees % 360 == 0) {
        start_degrees = 0;
        element.style.transform = `rotate(${start_degrees}deg)`;
    } else if (start_degrees > 360) {
        start_degrees = start_degrees % 360;
        element.style.transform = `rotate(${start_degrees}deg)`;
    }

    let total_degrees = start_degrees + degrees;
    let step = 1000 / degrees;

    let rotater = setInterval(function () {
        let current_rotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
        let new_rotation = current_rotation + step;

        if (current_rotation < total_degrees && new_rotation > total_degrees) {
            new_rotation = total_degrees;
            clearInterval(rotater);
        }

        element.style.transform = `rotate(${new_rotation}deg)`;
    }, 1);
}

function sort(table, col, type) {
    let order = "desc";

    let col_header = table.find(`:scope>.row div:nth-child(${col})`);
    if (col_header.find("i.fa-caret-up"))
        col_header.find("i.fa-caret-up").setClass("fas fa-caret-down");
    else if (col_header.find("i.fa-caret-down")) {
        col_header.find("i.fa-caret-down").setClass("fas fa-caret-up");
        order = "asc";
    } else {
        // old header
        let current_i = table.find(".row i");
        if(current_i) current_i.remove();

        // new header
        let i = doc.new("i");
        i.setClass("fas fa-caret-down");
        col_header.appendChild(i);
    }

    let rows = [];

    if (!table.find(`.body .row div:nth-child(${col})`).getAttribute("priority")) {
        rows = [...table.findAll(".body>.row")];
        rows = sortRows(rows, order, type);
    } else {
        let priorities = [];
        for (let item of table.findAll(`.body>.row div:nth-child(${col})`)) {
            let priority = item.getAttribute("priority");

            if (!priorities[parseInt(priority) - 1])
                priorities[parseInt(priority) - 1] = []
            priorities[parseInt(priority) - 1].push(item.parentElement);
        }

        for (let priority_level of priorities) {
            if (priority_level == undefined)
                continue;
            rows = [...rows, ...sortRows(priority_level, order, type)];
        }
    }

    let body = doc.new("div");

    for (let row of rows)
        body.appendChild(row);

    table.find(".body").innerHTML = body.innerHTML;

    function sortRows(rows, order, type) {
        if (order == "asc") {
            rows.sort(function (a, b) {
                // console.time("SORTING");
                let a_text, b_text;
                if (type == "value") {
                    a_text = a.find(`div:nth-of-type(${col})`).getAttribute("value");
                    b_text = b.find(`div:nth-of-type(${col})`).getAttribute("value");
                } else if (type == "text") {
                    a_text = [...a.children][col - 1].innerText;
                    b_text = [...b.children][col - 1].innerText;
                }
                // console.timeEnd("SORTING");

                if (isNaN(parseFloat(a_text))) {
                    if (a_text.indexOf("$") > -1) {
                        a = parseFloat(a_text.replace("$", "").replace(/,/g, ""));
                        b = parseFloat(b_text.replace("$", "").replace(/,/g, ""));
                    } else {
                        a = a_text.toLowerCase();
                        b = b_text.toLowerCase();

                        if (a < b)
                            return -1;
                        else if (a > b)
                            return 1;
                        else
                            return 0;
                    }
                } else {
                    a = parseFloat(a_text);
                    b = parseFloat(b_text);
                }

                return a - b;
            });
        } else if (order == "desc") {
            rows.sort(function (a, b) {
                // console.time("SORTING");
                let a_text, b_text;
                if (type == "value") {
                    a_text = a.find(`div:nth-of-type(${col})`).getAttribute("value");
                    b_text = b.find(`div:nth-of-type(${col})`).getAttribute("value");
                } else if (type == "text") {
                    a_text = [...a.children][col - 1].innerText;
                    b_text = [...b.children][col - 1].innerText;
                }
                // console.timeEnd("SORTING");

                if (isNaN(parseFloat(a_text))) {
                    if (a_text.indexOf("$") > -1) {
                        a = parseFloat(a_text.replace("$", "").replace(/,/g, ""));
                        b = parseFloat(b_text.replace("$", "").replace(/,/g, ""));
                    } else {
                        a = a_text.toLowerCase();
                        b = b_text.toLowerCase();

                        if (a < b)
                            return 1;
                        else if (a > b)
                            return -1;
                        else
                            return 0;
                    }
                } else {
                    a = parseFloat(a_text);
                    b = parseFloat(b_text);
                }

                return b - a;
            });
        }

        return rows;
    }
}

function usingChrome(){
    if(navigator.userAgent.indexOf("Chrome") > -1){
        return true;
    }
    return false;
}

function lastInList(item, list){
	if(list[list.length-1] == item){
		return true;
	}
	return false;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function time_until(milliseconds){
    if(milliseconds < 0){
        return -1;
    }

    let days = Math.floor(milliseconds / (1000*60*60*24));
    let hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    let time_left;

    if(days){
        time_left = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if(hours) {
        time_left = `${hours}h ${minutes}m ${seconds}s`;
    } else if(minutes){
        time_left = `${minutes}m ${seconds}s`;
    } else if(seconds){
        time_left = `${seconds}s`;
    } else if(milliseconds == 0){
        time_left = "0s";
    }

    return time_left;
}

function formatDate([day, month, year], formatting){
    day = day.toString().length == 1 ? `0${day}` : day;
    month = month.toString().length == 1 ? `0${month}` : month;

    if(formatting == "us"){
        if(year){
            return `${month}/${day}/${year}`;
        } else {
            return `${month}/${day}`;
        }
    } else if(formatting == "eu"){
        if(year){
            return `${day}.${month}.${year}`;
        } else {
            return `${day}.${month}`;
        }
    }
}

function formatTime([hours, minutes, seconds], formatting){
    let pm = hours >= 12 ? true:false;
    hours = hours.toString().length == 1 ? `0${hours}` : hours;
    minutes = minutes.toString().length == 1 ? `0${minutes}` : minutes;
    seconds = seconds && seconds.toString().length == 1 ? `0${seconds}` : seconds;

    if(formatting == "us"){
        hours = hours > 12 ? hours-12 : hours;
        if(hours == 0) hours = 12;
        hours = hours.toString().length == 1 ? `0${hours}` : hours;

        if(seconds){
            return `${hours}:${minutes}:${seconds} ${pm ? "PM":"AM"}`;
        } else {
            return `${hours}:${minutes} ${pm ? "PM":"AM"}`;
        }
    } else if(formatting == "eu"){
        if(seconds){
            return `${hours}:${minutes}:${seconds}`;
        } else {
            return `${hours}:${minutes}`;
        }
    }
}

function arabicToRoman(arabic){
	let dict = {
		"1": "I",
		"2": "II",
		"3": "III",
		"4": "IV",
		"5": "V",
		"6": "VI",
		"7": "VII",
		"8": "VIII",
		"9": "IX",
		"10": "X",
		"11": "XI",
		"12": "XII",
		"13": "XIII",
		"14": "XIV",
		"15": "XV",
	}
	return dict[arabic];
}

function romanToArabic(roman){
	let dict = {
		"I": 1,
		"II": 2,
		"III": 3,
		"IV": 4,
		"V": 5,
		"VI": 6,
		"VII": 7,
		"VIII": 8,
		"IX": 9,
		"X": 10,
		"XI": 11,
		"XII": 12,
		"XIII": 13,
		"XIV": 14,
		"XV": 15,
    }
    
    if(!isNaN(parseInt(roman))){
        return roman;
    }
	return dict[roman];
}

function hasParent(element, attributes={}){
    if(!element.parentElement){
        return false;
    } else {
        if(attributes.class && element.parentElement.classList.contains(attributes.class)){
            return true;
        }
        if(attributes.id && element.parentElement.id == attributes.id){
            return true;
        }

        return hasParent(element.parentElement, attributes);
    }
}

function findParent(element, attributes={}){
    if(!element.parentElement){
        return undefined;
    } else {
        if(attributes.class && element.parentElement.classList.contains(attributes.class)){
            return element.parentElement;
        }
        if(attributes.id && element.parentElement.id == attributes.id){
            return element.parentElement;
        }

        return findParent(element.parentElement, attributes);
    }
}

function notifyUser(title, message, url){
    // chrome.notifications.create(url, {
    //     type: 'basic', 
    //     iconUrl: 'images/icon128.png', 
    //     title: title, 
    //     message: message
    // }, function(){
    //     console.log("Notified!");
    // });
    let notification = new Notification(title, {
        icon: 'images/icon128.png',
        body: message
    });
    
    notification.onclick = function(){
        window.open(url);
    }

    local_storage.get("settings", function(settings){
        if(settings.notifications_tts){
            console.log("READING TTS");
            chrome.tts.speak(title);
            chrome.tts.speak(message, {"enqueue": true});
        }
    });
}

function setBadge(text, attr={}){
    if(text == ""){
        chrome.browserAction.setBadgeText({text: ''});
    } else if(text == "error"){
        chrome.browserAction.setBadgeText({text: 'error'});
        chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
    } else if(text == "update_available"){
        chrome.browserAction.setBadgeText({text: 'new'});
        chrome.browserAction.setBadgeBackgroundColor({color: "#e0dd11"});
    } else if(text == "update_installed"){
        chrome.browserAction.setBadgeText({text: 'new'});
        chrome.browserAction.setBadgeBackgroundColor({color: "#0ad121"});
    } else if(text == "new_message"){
        chrome.browserAction.setBadgeText({text: attr.count.toString()});
        chrome.browserAction.setBadgeBackgroundColor({color: "#84af03"});
    } else if(text == "new_event"){
        chrome.browserAction.setBadgeText({text: attr.count.toString()});
        chrome.browserAction.setBadgeBackgroundColor({color: "#009eda"});
    } else {
        chrome.browserAction.setBadgeText({text: text});
        chrome.browserAction.setBadgeBackgroundColor({color: attr.color});
    }
}

function getBadgeText(){
    return new Promise(function(resolve, reject){
        chrome.browserAction.getBadgeText({}, function(text){
            return resolve(text);
        });
    });
}

function page(){
    let db = {
        "jailview.php": "jail",
        "hospitalview.php": "hospital",
        "crimes.php": "crimes",
        "index.php": "home",
        "city.php": "city",
        "travelagency.php": "travelagency",
        "war.php": "war",
        "item.php": "items",
        "crimes.php": "crimes",
        "gym.php": "gym",
        "bounties.php": "bounties",
        "profiles.php": "profile"
    }

    let page = window.location.pathname.replace("/", "");
    if(db[page]){
        return db[page];
    }
    return "";
}

function navbarLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find("#sidebar")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function DBloaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(db_loaded == true){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function contentLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".box-title") || doc.find("#equipped-weapons") || doc.find("div.title-black[role=heading]")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function messageBoxLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".info-msg-cont")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function playersLoaded(list_class){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(`${list_class}>*:not(.ajax-placeholder)`)){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function onDragOver(event){
    event.preventDefault();
}

function onDragEnter(event){
    if(doc.find("#ttQuick .temp.item")){
        doc.find("#ttQuick .temp.item").style.opacity = "1";
    }
}

function onDragLeave(event){
    if(doc.find("#ttQuick .temp.item")){
        doc.find("#ttQuick .temp.item").style.opacity = "0.2";
    }
}

function onDrop(event){
    let temp_div = doc.find("#ttQuick .temp.item");
    temp_div.classList.remove("temp");
    doc.find("#ttQuick .content").style.maxHeight = doc.find("#ttQuick .content").scrollHeight + "px"; 

    event.dataTransfer.clearData();
}

function addRFC(url) {
    var url = url || "";
    url += (url.split("?").length > 1 ? "&" : "?") + "rfcv=" + getRFC();
    return url;
}

function getRFC() {
    // var rfc = $.cookie("rfc_v");
    var rfc = getCookie("rfc_v");
    if (!rfc) {
        var cookies = document.cookie.split("; ");
        for (var i in cookies) {
            var cookie = cookies[i].split("=");
            if (cookie[0] == "rfc_v") {
                return cookie[1];
            }
        }
    }
    return rfc;
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function to_seconds(time){
    time = time.toLowerCase();
    let seconds = 0;
    
    if(time.indexOf("h") > -1){
        seconds += parseInt(time.split("h")[0].trim()) * 3600;
        time = time.split("h")[1];
    }
    if(time.indexOf("m") > -1){
        seconds += parseInt(time.split("m")[0].trim()) * 60;
        time = time.split("m")[1];
    }
    if(time.indexOf("s") > -1){
        seconds += parseInt(time.split("s")[0].trim()) * 1;
        time = time.split("s")[1];
    }

    console.log("seconds", seconds);
    return seconds;
}

function mobileChecker(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(window.location.host.indexOf("torn") == -1){
                resolve(false);
                return clearInterval(checker);
            }

            if(doc.find(".header-menu-icon")){
                if(getComputedStyle(doc.find(".header-menu-icon")).display == "none"){
                    resolve(false);
                    return clearInterval(checker);
                } else if(getComputedStyle(doc.find(".header-menu-icon")).display == "inline-block"){
                    resolve(true);
                    return clearInterval(checker);
                }
            }

            if(doc.find(`#sidebar`)){
                if(doc.find("#sidebar").classList.contains("mobile___1tkgj")){
                    resolve(true);
                } else {
                    resolve(false);
                }
                return clearInterval(checker);
            }
        });
    });
}

function getSearchParameters(){
    let srch = window.location.search.replace("?", "");
    let dict = {}

    for(let pair of srch.split("&")){
        dict[pair.split("=")[0]] = pair.split("=")[1];
    }

    return dict;
}

function getHashParameters(){
    let hash = window.location.hash.replace("#/", "");
    let dict = {}

    for(let pair of hash.split("&")){
        dict[pair.split("=")[0]] = pair.split("=")[1];
    }

    return dict;
}

function flashColor(element, type, speed, min=0, max=1){
    let [r,g,b,a] = element.style.backgroundColor.split("(")[1].split(")")[0].split(",").map(x=>parseFloat(x.trim()));

    let interval;
    switch(speed){
        case "slow":
            interval = 35;
            break;
        case "fast":
            interval = 20;
            break;
        default:
            break;
    }

    let increase = a == min ? true:false;
    let changer = setInterval(function(){
        if(a <= min){
            increase = true;
        } else if(a >= max){
            increase = false;
        }

        if(increase){
            a += 0.01;
        } else {
            a -= 0.01;
        }

        switch(type){
            case "background":
                element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
                break;
            default:
                break;
        }
    }, interval);
}

// Pre-load database
var userdata, torndata, settings, api_key, chat_highlight, itemlist, 
travel_market, oc, allies, loot_times, target_list, vault, personalized, 
mass_messages, custom_links, loot_alerts, extensions, new_version, hide_icons,
quick, notes, stakeouts, updated, networth, filters, cache, watchlist;

(function(){
    local_storage.get(null, async function(db){
        DB = db;

        userdata = DB.userdata;
        torndata = DB.torndata;
        settings = DB.settings;
        api_key = DB.api_key;
        chat_highlight = DB.chat_highlight;
        itemlist = DB.itemlist;
        travel_market = DB.travel_market;
        oc = DB.oc;
        allies = DB.allies;
        loot_times = DB.loot_times;
        target_list = DB.target_list;
        vault = DB.vault;
        personalized = DB.personalized;
        mass_messages = DB.mass_messages;
        custom_links = DB.custom_links;
        loot_alerts = DB.loot_alerts;
        extensions = DB.extensions;
        new_version = DB.new_version;
        hide_icons = DB.hide_icons;
        quick = DB.quick;
        notes = DB.notes;
        stakeouts = DB.stakeouts;
        updated = DB.updated;
        networth = DB.networth;
        filters = DB.filters;
        cache = DB.cache;
        watchlist = DB.watchlist;

        // Align left
        document.documentElement.style.setProperty("--torntools-align-left", settings.pages.globalalign_left ? "20px" : "auto");

        // Upgrade button
        document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hide_upgrade ? "none" : "block");
        if(["home"].includes(page())){
            document.documentElement.style.setProperty("--torntools-hide-upgrade-info", settings.pages.global.hide_upgrade ? "none" : "block");
        }

        // Info boxes
        // if(settings.remove_info_boxes && ["crimes"].includes(page())){
        //     document.documentElement.style.setProperty("--torntools-remove-info-boxes", "none");
        // }

        // Hide Doctorn
        if((settings.force_tt && ["home", "city", "travelagency", "war", "items", "crimes", "gym", "bounties", "profile"].includes(page()))){
            document.documentElement.style.setProperty("--torntools-hide-doctorn", "none");
        }

        // Hide icons
        if(hide_icons.length > 0){
            for(let icon of hide_icons){
                document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, 'none');
            }
        }

        // Clean Flight page
        document.documentElement.style.setProperty("--torntools-clean-flight-display", settings.clean_flight? "none":"block");

        // Mobile
        mobile = await mobileChecker();
        console.log("Using mobile:", mobile);
        console.log(await flying())
        if(mobile && !(await flying())){
            document.documentElement.style.setProperty("--torntools-mobile-torn-content-margin", custom_links.length > 0? "150px":"120px");
        }

        console.log("DB LOADED");
        db_loaded = true;
    });
})();