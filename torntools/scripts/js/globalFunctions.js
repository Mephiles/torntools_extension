console.log("TT - Loading global functions.")

/*
 * Declare some variables.
 */

chrome = typeof browser !== "undefined" ? browser : chrome;

const doc = document;

const HIGHLIGHT_PLACEHOLDERS = {
    "$player": {
        value: () => userdata.name,
        description: "Your player name."
    }
}

const DRUG_INFORMATION = {
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

const THEME_CLASSES = {
    default: {
        title: "title-green",
    },
    alternative: {
        title: "title-black",
    },
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
    "api_history": {
        "torn": [],
        "yata": [],
        "tornstats": []
    },

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
    "chat_highlight": {
        "$player": "#7ca900"
    },
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
        "preset_data": {
            "factions": {
                "default": "",
                "data": []
            }
        },
        "travel": {
            "table_type": "basic",
            "open": false,
            "item_type": "all",
            "country": "all"
        },
        "profile_stats": {
            "auto_fetch": true,
            "chosen_stats": []
        },
        "hospital": {
            "activity": [],
            "faction": "",
            "time": [],
            "level": []
        },
        "jail": {
            "activity": [],
            "faction": "",
            "time": [],
            "level": [],
            "score": []
        },
        "faction": {
            "activity": [],
            "level": [],
            "status": [],
            "last_action": []
        },
        "user_list": {
            "activity": [],
            "level": []
        },
        "overseas": {
            "activity": [],
            "status": [],
            "level": []
        },
        "bounties": {},
        "faction_armory": {},
        "container_open": {}
    },
    "sorting": {
        "profile": []
    },
    "cache": {
        "profile_stats": {},
        "other": {}
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
        "notifications": {
            "global": true,
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
                "estimated_energy": true,
                "disable_strength": false,
                "disable_speed": false,
                "disable_defense": false,
                "disable_dexterity": false
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
                "drug_details": true,
                "itemmarket_links": false,
                "highlight_bloodbags": "none"
            },
            "travel": {
                "profits": true,
                "destination_table": true
            },
            "api": {
                "key": true,
                "pretty": true,
                "marking": false,
                "autoDemo": true
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
                "vault_balance": false,
                "notes": true,
                "hide_upgrade": false,
                "align_left": false,
                "find_chat": true,
                "hide_chat": false,
                "collapse_areas": false
            },
            "jail": {
                "quick_icons": false
            }
        }
    }
}

let notificationLinkRelations = {}

/*
 * Add prototype functions.
 */

Document.prototype.find = function (type) {
    if (type.indexOf("=") > -1 && type.indexOf("[") === -1) {
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for (let element of document.querySelectorAll(key)) {
            if (element.innerText === value) {
                return element;
            }
        }

        try {
            this.querySelector(type)
        } catch (err) {
            return undefined;
        }
    }
    return this.querySelector(type);
}
Element.prototype.find = function (type) {
    if (type.indexOf("=") > -1 && type.indexOf("[") === -1) {
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for (let element of document.querySelectorAll(key)) {
            if (element.innerText === value) {
                return element;
            }
        }

        try {
            this.querySelector(type)
        } catch (err) {
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

Document.prototype.new = function (newElement) {
    if (typeof newElement == "string") {
        return this.createElement(newElement);
    } else if (typeof newElement == "object") {
        let el = this.createElement(newElement.type);

        if (newElement.id) {
            el.id = newElement.id;
        }
        if (newElement.class) {
            el.setAttribute("class", newElement.class);
        }
        if (newElement.text) {
            el.innerText = newElement.text;
        }
        if (newElement.value) {
            el.value = newElement.value;
        }
        if (newElement.href) {
            el.href = newElement.href;
        }

        for (let attr in newElement.attributes) {
            el.setAttribute(attr, newElement.attributes[attr]);
        }

        return el;
    }
}

Document.prototype.setClass = function (className) {
    return this.setAttribute("class", className);
}
Element.prototype.setClass = function (className) {
    return this.setAttribute("class", className);
}

/*
 * Load some functions.
 */

const ttStorage = {
    get: function (key, callback) {
        let promise = new Promise((resolve) => {
            if (Array.isArray(key)) {
                let arr = [];
                chrome.storage.local.get(key, function (data) {
                    for (let item of key) {
                        arr.push(data[item]);
                    }
                    return resolve(arr);
                });
            } else if (key === null) {
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
        for (let top_level_key of Object.keys(keys_to_change)) {
            chrome.storage.local.get(top_level_key, function (data) {
                let database = data[top_level_key];
                database = recursive(database, keys_to_change[top_level_key]);

                function recursive(parent, keys_to_change) {
                    for (let key in keys_to_change) {
                        if (key in parent && typeof keys_to_change[key] === "object" && !Array.isArray(keys_to_change[key])) {
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

const infoBox = {
    newRow: function (key, value, attr = {}) {
        // process

        let li = doc.new({type: "li", id: attr.id ? attr.id : "", class: attr.last ? "last" : ""});
        if (attr.heading) {
            li.innerText = key;

            li.classList.add("tt-box-section-heading");
            li.classList.add("tt-title");
            li.classList.add(THEME_CLASSES[DB.settings.theme].title);
        } else {
            let span_left = doc.new({type: "span", class: "divider"});
            let span_left_inner = doc.new({
                type: "span",
                text: key,
                attributes: {style: "background-color: transparent;"}
            });
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

const navbar = {
    newSection: function (name, attribute = {}) {
        let parent = doc.find("#sidebarroot");
        let newDiv = createNewBlock(name, attribute);
        let nextElement = attribute.next_element || findSection(parent, attribute.next_element_heading);

        if (!nextElement) {
            if (attribute.last) {
                parent.appendChild(newDiv);
            }
        } else {
            nextElement.parentElement.insertBefore(newDiv, nextElement);
        }

        return newDiv;

        function createNewBlock(name, attr = {}) {
            let collapsed = false;
            if (filters.container_open.navbar && filters.container_open.navbar[name]) {
                collapsed = filters.container_open.navbar[name];
            }

            let sidebarBlock = doc.new({type: "div", class: "sidebar-block___1Cqc2 tt-nav-section"});
            sidebarBlock.innerHTML = `
                <div class="content___kMC8x">
                    <div class="areas___2pu_3">
                        <div class="toggle-block___13zU2">
                            <div class="tt-title tt-nav ${THEME_CLASSES[settings.theme].title} ${collapsed === true || collapsed === undefined ? 'collapsed' : ''}">
                                <div class="title-text">${name}</div>
                                <div class="tt-options"></div>
                                <i class="tt-title-icon fas fa-caret-down"></i></div>
                            <div class="toggle-content___3XKOC tt-content"></div>
                        </div>
                    </div>
                </div>
            `;

            if (!attr.header_only) {
                sidebarBlock.find(".tt-title").onclick = function () {
                    sidebarBlock.find(".tt-title").classList.toggle("collapsed");
                    let collapsed = sidebarBlock.find(".tt-title").classList.contains("collapsed");

                    ttStorage.change({"filters": {"container_open": {"navbar": {[name]: collapsed}}}});
                }
            }

            return sidebarBlock;
        }

        function findSection(parent, heading) {
            for (let head of parent.findAll("h2")) {
                if (head.innerText === heading) {
                    return head.parentElement.parentElement.parentElement;
                }
            }
            return undefined;
        }
    },
    newCell: function (text, attribute = {}) {
        let sidebar = doc.find("#sidebarroot");

        if (!attribute.parent_element && attribute.parent_heading) {
            attribute.parent_element = (function () {
                for (let el of sidebar.findAll("h2")) {
                    if (el.firstChild.nodeValue === attribute.parent_heading) {
                        return el.parentElement;
                    }
                }
                return undefined;
            })();
        }

        let toggleContent = attribute.parent_element.find(".toggle-content___3XKOC");
        let newCellBlock = createNewCellBlock(text, attribute);

        if (attribute.first)
            toggleContent.insertBefore(newCellBlock, toggleContent.firstElementChild);
        else
            toggleContent.appendChild(newCellBlock);

        return newCellBlock;

        function createNewCellBlock(text, attr) {
            let div = doc.new({type: "div", class: "area-desktop___2YU-q"});

            div.innerHTML = `
                <div class="area-row___34mEZ tt-cell">
                    <a class="desktopLink___2dcWC ${attr.class || ""}" href="${attr.href || "#"}" target="${attr.link_target || ""}">
                        <span>${text}</span>
                    </a>
                </div>
            `;

            return div;
        }
    }
}

const content = {
    newContainer: function (name, attr = {}) {
        // process
        if (attr.next_element_heading) {
            attr.next_element = content.findContainer(attr.next_element_heading);
        }

        let parent_element = attr.next_element ? attr.next_element.parentElement : doc.find(".content-wrapper");
        let new_div = createNewContainer(name, attr);

        if (attr.first)
            parent_element.insertBefore(new_div, parent_element.find(".content-title").nextElementSibling);
        else if (attr.next_element)
            parent_element.insertBefore(new_div, attr.next_element);
        else
            parent_element.appendChild(new_div);

        return new_div;

        function createNewContainer(name, attr) {
            console.log(getCurrentPage())
            let collapsed = filters.container_open[getCurrentPage()];

            let div = doc.new({type: "div"});
            if (attr.id) div.id = attr.id;
            if (attr["_class"]) div.setClass(attr["_class"]);

            let containerClasses = `top-round m-top10 tt-title ${THEME_CLASSES[settings.theme].title}`;
            if (attr.all_rounded) containerClasses += " all-rounded";
            if (attr.header_only) containerClasses += " no-content";
            if (collapsed === true || collapsed === undefined) {
                containerClasses += " collapsed";

                if (attr.all_rounded !== false && !attr.header_only) containerClasses += " all-rounded";
            }


            div.innerHTML = `
                <div class="${containerClasses}">
                    <div class="title-text">${name}</div>
                    <div class="tt-options"></div>
                    <i class="tt-title-icon fas fa-caret-down"></i>
                </div>
                <div class="cont-gray bottom-round content tt-content ${attr.dragzone ? 'tt-dragzone' : ''}"></div>
            `;

            if (attr.dragzone) {
                let content = div.find(".content");
                content.addEventListener("dragover", onDragOver);
                content.addEventListener("drop", function (event) {
                    onDrop(event);
                });
                content.addEventListener("dragenter", onDragEnter);
                content.addEventListener("dragleave", onDragLeave);
            }

            if (!attr.header_only) {
                div.find(".tt-title").onclick = function () {
                    const title = div.find(".tt-title");

                    title.classList.toggle("collapsed");
                    let collapsed = title.classList.contains("collapsed");

                    if (attr.all_rounded !== false) {
                        if (collapsed) title.classList.add("all-rounded");
                        else title.classList.remove("all-rounded");
                    }

                    ttStorage.change({"filters": {"container_open": {[getCurrentPage()]: collapsed}}})
                }
            }

            return div;
        }
    },
    findContainer: function (name) {
        let headings = doc.findAll(".content-wrapper .title-black");

        for (let heading of headings) {
            if (heading.innerText === name)
                return heading.parentElement.parentElement;
        }

        return undefined;
    }
}

/*
 * Load some normal functions.
 */

function isFlying() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            let page_heading = doc.find("#skip-to-content");
            if (page_heading) {
                if (page_heading.innerText === "Traveling") {
                    resolve(true);
                    return clearInterval(checker);
                } else if (page_heading.innerText === "Error") {
                    for (let msg of doc.findAll(".msg")) {
                        if (msg.innerText === "You cannot access this page while traveling!") {
                            resolve(true);
                            return clearInterval(checker);
                        } else if (msg.innerText.indexOf("You are in") > -1) {
                            console.log("here1");
                            resolve(true);
                            return clearInterval(checker);
                        }
                    }
                } else {
                    for (let msg of doc.findAll(".msg")) {
                        if (msg.innerText.indexOf("You are in") > -1) {
                            resolve(false);
                            return clearInterval(checker);
                        }
                    }
                }
            }

            if (userdata && userdata.travel && userdata.travel.time_left > 0) {
                resolve(true);
                return clearInterval(checker);
            } else {
                resolve(false);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function isAbroad() {
    return new Promise((resolve) => {
        let counter = 0;
        let checker = setInterval(function () {
            if (doc.find("#travel-home")) {
                resolve(true);
                return clearInterval(checker);
            } else if (doc.find(".header") && doc.find(".header").classList[doc.find(".header").classList.length - 1] !== "responsive-sidebar-header") {
                resolve(true);
                return clearInterval(checker);
            } else if (doc.find("#skip-to-content") && doc.find("#skip-to-content").innerText === "Preferences") {
                resolve(false);
                return clearInterval(checker);
            } else if (doc.find("#sidebarroot h2") && doc.find("#sidebarroot h2").innerText === "Information") {
                resolve(false);
                return clearInterval(checker);
            } else {
                for (let msg of doc.findAll(".msg")) {
                    if (msg.innerText === "You can't access this page while abroad.") {
                        resolve(true);
                        return clearInterval(checker);
                    } else if (msg.innerText.indexOf("You are in") > -1) {
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

function shouldDisable() {
    return extensions.doctorn === true && !settings.force_tt;
}

function getCookie(cname) {
    const name = cname + "=";

    for (let cookie of decodeURIComponent(document.cookie).split(";")) {
        cookie = cookie.trimLeft();

        if (cookie.includes(name)) {
            return cookie.substring(name.length);
        }
    }
    return "";
}

function getRFC() {
    const rfc = getCookie("rfc_v");
    if (!rfc) {
        const cookies = document.cookie.split("; ");
        for (let i in cookies) {
            let cookie = cookies[i].split("=");
            if (cookie[0] === "rfc_v") {
                return cookie[1];
            }
        }
    }
    return rfc;
}

function addRFC(url) {
    url = url || "";
    url += (url.split("?").length > 1 ? "&" : "?") + "rfcv=" + getRFC();
    return url;
}

function romanToArabic(roman) {
    if (!isNaN(parseInt(roman))) return roman;

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

    return dict[roman];
}

function arabicToRoman(arabic) {
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

function usingChrome() {
    return navigator.userAgent.includes("Chrome");
}

function usingFirefox() {
    return navigator.userAgent.includes("Firefox");
}

function getSearchParameters() {
    return new URL(window.location).searchParams;
}

function getHashParameters() {
    let hash = window.location.hash;

    if (hash.startsWith("#/")) hash = hash.substring(2);
    else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

    if (!hash.startsWith("!")) hash = "?" + hash;

    return new URLSearchParams(hash);
}

function isOverflownX(element) {
    return element.scrollWidth > element.clientWidth;
}

function isOverflownY(element) {
    return element.scrollHeight > element.clientHeight;
}

function capitalize(text, everyWord = false) {
    if (!everyWord)
        return text[0].toUpperCase() + text.slice(1);

    return text.trim().split(" ").map((word) => capitalize(word)).join(" ").trim();
}

function lastInList(item, list) {
    return list[list.length - 1] === item;
}

function toSeconds(time) {
    time = time.toLowerCase();
    let seconds = 0;

    if (time.includes("h")) {
        seconds += parseInt(time.split("h")[0].trim()) * 3600;
        time = time.split("h")[1];
    }
    if (time.includes("m")) {
        seconds += parseInt(time.split("m")[0].trim()) * 60;
        time = time.split("m")[1];
    }
    if (time.includes("s")) {
        seconds += parseInt(time.split("s")[0].trim());
    }

    return seconds;
}

function numberWithCommas(x, shorten = true) {
    if (shorten) {
        if (Math.abs(x) >= 1e9) {
            if (Math.abs(x) % 1e9 === 0)
                return (x / 1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "bil";
            else
                return (x / 1e9).toFixed(3) + "bil";
        } else if (Math.abs(x) >= 1e6) {
            if (Math.abs(x) % 1e6 === 0)
                return (x / 1e6) + "mil";
            else
                return (x / 1e6).toFixed(3) + "mil";
        } else if (Math.abs(x) >= 1e3) {
            if (Math.abs(x) % 1e3 === 0)
                return (x / 1e3) + "k";
        }
    }

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function timeAgo(time) {
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

    const time_formats = [
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
    let seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds === 0) return 'Just now';

    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }

    let i = 0,
        format;

    while (format = time_formats[i++]) {
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + '' + format[1] + ' ' + token;
        }
    }
    return time;
}

function setBadge(text, attributes = {}) {
    const types = {
        default: {text: ''},
        error: {text: "error", color: "#FF0000"},
        "update_available": {text: "new", color: "#e0dd11"},
        "update_installed": {text: "new", color: "#0ad121"},
        "new_message": {text: attributes.count.toString(), color: "#84af03"},
        "new_event": {text: attributes.count.toString(), color: "#009eda"},
    };

    const badge = types[text];

    if (!badge) {
        chrome.browserAction.setBadgeText({text: text});
        chrome.browserAction.setBadgeBackgroundColor({color: attributes.color});
    } else {
        if (badge.text) chrome.browserAction.setBadgeText({text: badge.text});
        if (badge.color) chrome.browserAction.setBadgeBackgroundColor({color: badge.color});
    }
}

function getBadgeText() {
    return new Promise((resolve) => chrome.browserAction.getBadgeText({}, (text) => resolve(text)));
}

function secondsToHours(x) {
    return Math.floor(x / 60 / 60); // seconds, minutes
}

function secondsToDays(x) {
    return Math.floor(x / 60 / 60 / 24); // seconds, minutes, hours
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

    return data.map(toMultipleDigits);
}

function rotateElement(element, degrees) {
    let startDegrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;

    if (startDegrees !== 0 && startDegrees % 360 === 0) {
        startDegrees = 0;
        element.style.transform = `rotate(${start_degrees}deg)`;
    } else if (start_degrees > 360) {
        startDegrees = start_degrees % 360;
        element.style.transform = `rotate(${start_degrees}deg)`;
    }

    const totalDegrees = startDegrees + degrees;
    const step = 1000 / degrees;

    let rotater = setInterval(function () {
        const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
        let newRotation = currentRotation + step;

        if (currentRotation < totalDegrees && newRotation > totalDegrees) {
            newRotation = totalDegrees;
            clearInterval(rotater);
        }

        element.style.transform = `rotate(${newRotation}deg)`;
    }, 1);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function timeUntil(milliseconds, attributes = {}) {
    milliseconds = parseFloat(milliseconds);
    if (milliseconds < 0) return -1;

    let days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    let hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    switch (attributes.max_unit) {
        case "h":
            hours = hours + days * 24;
            days = undefined;
            break;
        // case "m":
        //     minutes = minutes + days*24 + hours*60;
        //     days = undefined;
        //     hours = undefined;
        //     break;
        // case "s":
        //     seconds = seconds + days*24 + hours*60 + minutes*60;
        //     days = undefined;
        //     hours = undefined;
        //     minutes = undefined;
        //     break;
        default:
            break;
    }

    let time_left;

    if (days) {
        time_left = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours) {
        time_left = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes) {
        time_left = `${minutes}m ${seconds}s`;
    } else if (seconds) {
        time_left = `${seconds}s`;
    } else if (milliseconds === 0) {
        time_left = "0s";
    }

    if (attributes.hide_nulls) {
        time_left += " ";

        while (time_left !== time_left.replace(/\s[0][A-Za-z]\s/, " ")) {
            time_left = time_left.replace(/\s[0][A-Za-z]\s/, " ");
        }
    }

    return time_left.trim();
}

function formatDate([day, month, year], formatting) {
    day = toMultipleDigits(day);
    month = toMultipleDigits(month);

    switch (formatting) {
        case "us":
            return year ? `${month}/${day}/${year}` : `${month}/${day}`;
        case "eu":
            return year ? `${day}.${month}.${year}` : `${day}.${month}`;
        default:
            return formatting([day, month, year], "eu");
    }
}

function formatTime([hours, minutes, seconds], formatting) {
    let pm = hours >= 12;
    hours = toMultipleDigits(hours);
    minutes = toMultipleDigits(minutes);
    seconds = toMultipleDigits(seconds);

    switch (formatting) {
        case "us":
            hours = hours % 12;
            if (hours === 0) hours = 12;
            hours = toMultipleDigits(hours);

            return seconds ? `${hours}:${minutes}:${seconds} ${pm ? "PM" : "AM"}` : `${hours}:${minutes} ${pm ? "PM" : "AM"}`;
        case "eu":
            return seconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
        default:
            return formatting([day, month, year], "eu");
    }
}

function toMultipleDigits(number, digits = 2) {
    return number.toString().length < digits ? toMultipleDigits(`0${number}`, digits) : number;
}

function findItemsInList(list, attributes = {}) {
    let arr = [];
    if (!list || Object.keys(attributes).length === 0) return arr;

    for (let item of list) {
        let fitsAll = true;

        for (let attribute in attributes) {
            if (item[attribute] !== attributes[attribute]) fitsAll = false;
        }

        if (fitsAll) arr.push(item);
    }

    return arr;
}

function hasParent(element, attributes = {}) {
    if (!element.parentElement) return false;

    if (attributes.class && element.parentElement.classList.contains(attributes.class))
        return true;
    if (attributes.id && element.parentElement.id === attributes.id)
        return true;

    return hasParent(element.parentElement, attributes);
}

function findParent(element, attributes = {}) {
    if (!element.parentElement) return undefined;

    if (attributes.class && element.parentElement.classList.contains(attributes.class))
        return element.parentElement;
    if (attributes.id && element.parentElement.id === attributes.id)
        return element.parentElement;
    if (attributes.has_attribute && element.parentElement.getAttribute(attributes.has_attribute) !== null)
        return element.parentElement;

    return findParent(element.parentElement, attributes);
}

function sort(table, col, type) {
    let order = "desc";

    let columnHeader = table.find(`:scope>.row div:nth-child(${col})`);
    if (columnHeader.find("i.fa-caret-up")) columnHeader.find("i.fa-caret-up").setClass("fas fa-caret-down");
    else if (columnHeader.find("i.fa-caret-down")) {
        columnHeader.find("i.fa-caret-down").setClass("fas fa-caret-up");
        order = "asc";
    } else {
        // old header
        const currentI = table.find(".row i");
        if (currentI) currentI.remove();

        // new header
        columnHeader.appendChild(doc.new({
            type: "i",
            class: "fas fa-caret-down",
        }));
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

        for (let priority of priorities) {
            if (priority === undefined)
                continue;

            rows = [...rows, ...sortRows(priority, order, type)];
        }
    }

    let body = doc.new("div");

    for (let row of rows)
        body.appendChild(row);

    table.find(".body").innerHTML = body.innerHTML;

    function sortRows(rows, order, type) {
        if (order === "asc") {
            rows.sort(function (a, b) {
                const helper = sortHelper(a, b);

                return helper.a - helper.b;
            });
        } else if (order === "desc") {
            rows.sort(function (a, b) {
                const helper = sortHelper(a, b);

                return helper.b - helper.a;
            });
        }

        return rows;

        function sortHelper(elementA, elementB) {
            let valueA, valueB;
            if (type === "value") {
                valueA = elementA.find(`div:nth-of-type(${col})`).getAttribute("value");
                valueB = elementB.find(`div:nth-of-type(${col})`).getAttribute("value");
            } else if (type === "text") {
                valueA = [...elementA.children][col - 1].innerText;
                valueB = [...elementB.children][col - 1].innerText;
            }

            let a, b;
            if (isNaN(parseFloat(valueA))) {
                if (valueA.indexOf("$") > -1) {
                    a = parseFloat(valueA.replace("$", "").replace(/,/g, ""));
                    b = parseFloat(valueB.replace("$", "").replace(/,/g, ""));
                } else {
                    a = valueA.toLowerCase();
                    b = valueB.toLowerCase();

                    if (a < b)
                        return 1;
                    else if (a > b)
                        return -1;
                    else
                        return 0;
                }
            } else {
                a = parseFloat(valueA);
                b = parseFloat(valueB);
            }

            return {a, b};
        }
    }
}

function getCurrentPage() {
    const pages = {
        "index": "home",
        "jailview": "jail",
        "hospitalview": "hospital",
        "item": "items",
        "profiles": "profile",
        "factions": "faction",
    }

    let page = window.location.pathname.substring(1);

    if (page.endsWith(".php")) page = page.substring(0, page.length - 4);
    else if (page.endsWith(".html")) page = page.substring(0, page.length - 5);

    return pages[page] || page;
}

function requireNavbar() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (doc.find("#sidebar")) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function requireContent() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (doc.find(".box-title") || doc.find("#equipped-weapons") || doc.find("div.title-black[role=heading]")) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function requireMessageBox() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (doc.find(".info-msg-cont")) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

// TODO - Should probably use a MutationObserver.
function requirePlayerList(listClass) {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (!((doc.find(`${listClass}>*`) && doc.find(`${listClass}>*`).classList.contains("ajax-placeholder")) || doc.find(`${listClass}>* .ajax-placeholder`)) && (doc.find(`${listClass}`) && doc.find(`${listClass}`).firstElementChild)) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function getPageStatus() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            let page_heading = doc.find("#skip-to-content") || doc.find(".title___2sbYr");
            let message = doc.find("div[role='main']>.info-msg-cont");

            // Page heading
            if (page_heading) {
                switch (page_heading.innerText) {
                    case "Please Validate":
                        resolve("captcha");
                        return clearInterval(checker);
                    case "Error":
                        resolve("blocked");
                        return clearInterval(checker);
                }
            }

            // Page info message
            if (message) {
                if (message.innerText.includes("a page which is blocked when")) {
                    resolve("blocked");
                    return clearInterval(checker);
                }
            }

            if (page_heading || message) {
                resolve("okay");
                return clearInterval(checker);
            }
        });
    });
}

function flashColor(element, type, speed, min = 0, max = 1) {
    let [r, g, b, a] = element.style.backgroundColor.split("(")[1].split(")")[0].split(",").map(x => parseFloat(x.trim()));

    let interval;
    switch (speed) {
        case "slow":
            interval = 35;
            break;
        case "fast":
            interval = 20;
            break;
        default:
            break;
    }

    let increase = a === min;
    let changer = setInterval(function () {
        if (a <= min) {
            increase = true;
        } else if (a >= max) {
            increase = false;
        }

        if (increase) {
            a += 0.01;
        } else {
            a -= 0.01;
        }

        switch (type) {
            case "background":
                element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
                break;
            default:
                break;
        }
    }, interval);
    // TODO - Maybe stop the interval once?
}

function loadingPlaceholder(element, display) {
    if (display) {
        if (element.find(".tt-loading-placeholder")) {
            element.find(".tt-loading-placeholder").classList.add("active");
        } else {
            element.appendChild(doc.new({
                type: "img",
                class: "ajax-placeholder m-top10 m-bottom10 tt-loading-placeholder active",
                attributes: {src: "https://www.torn.com/images/v2/main/ajax-loader.gif"}
            }));
        }
    } else {
        element.find(".tt-loading-placeholder").classList.remove("active");
    }
}

function saveSortingOrder(parent, page) {
    let names = []
    for (let section of parent.findAll(":scope>.tt-section")) {
        names.push(section.getAttribute("name"));
    }

    ttStorage.change({"sorting": {[page]: names}});
}

function sortSections(parent, page) {
    let names = sorting[page];

    for (let name of names) {
        let section = parent.find(`.tt-section[name='${name}']`);
        parent.appendChild(section);
    }
}

function notifyUser(title, message, url) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "images/icon128.png",
        title: title,
        message: message
    }, function (id) {
        console.log(id)
        notificationLinkRelations[id] = url;
        console.log("   Notified!");
    });

    ttStorage.get("settings", function (settings) {
        if (settings.notifications_tts) {
            console.log("READING TTS");

            window.speechSynthesis.speak(new SpeechSynthesisUtterance(title));
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
        }
    });
}

function fetchApi(http, apiKey) {
    return new Promise(async (resolve) => {
        ttStorage.get("api_history", function (api_history) {
            let selections = http.split("selections=")[1].split(",").filter(x => x !== "");
            let section = http.split("torn.com/")[1].split("/")[0];
            let user_id = http.split("?")[0].split("/")[http.split("?")[0].split("/").length - 1];
            let name = "other";

            if (selections.includes("personalstats")) {
                name = user_id === "" ? "userdata" : "profile_stats";
            } else if (selections.length && section === "user") {
                name = "stakeouts";
            }

            api_history.torn.push({
                date: new Date().toString(),
                selections: selections,
                section: section,
                user_id: user_id,
                name: name
            });
            ttStorage.set({"api_history": api_history});
        });

        try {
            const response = await fetch(http + "&key=" + apiKey);
            const result = await response.json();

            if (result.error) {
                if (result.error.code === 9) {  // API offline
                    console.log("API SYSTEM OFFLINE");
                    setBadge("error");

                    ttStorage.change({"api": {"online": false, "error": result.error.error}}, function () {
                        return resolve({ok: false, error: result.error.error});
                    });
                } else {
                    console.log("API ERROR:", result.error.error);

                    ttStorage.change({"api": {"online": true, "error": result.error.error}}, function () {
                        return resolve({ok: false, error: result.error.error});
                    });
                }
            } else {
                try {
                    if (isNaN(await getBadgeText())) {
                        setBadge("");
                    }
                } catch (err) {
                    console.log("Unable to get Badge.")
                }
                ttStorage.change({"api": {"online": true, "error": ""}}, function () {
                    return resolve({ok: true, result: result});
                });
            }
        } catch (err) {
            console.log("Error Fetching API", err);
        }
    });
}

function onDragOver(event) {
    event.preventDefault();
}

function onDragEnter(event) {
    if (doc.find("#ttQuick .temp.item")) {
        doc.find("#ttQuick .temp.item").style.opacity = "1";
    }
}

function onDragLeave(event) {
    if (doc.find("#ttQuick .temp.item")) {
        doc.find("#ttQuick .temp.item").style.opacity = "0.2";
    }
}

function onDrop(event) {
    let tempElement = doc.find("#ttQuick .temp.item");
    tempElement.classList.remove("temp");
    doc.find("#ttQuick .content").style.maxHeight = doc.find("#ttQuick .content").scrollHeight + "px";

    event.dataTransfer.clearData();
}