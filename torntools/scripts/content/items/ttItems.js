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

contentLoaded().then(function(){
    console.log("TT - Quick items");

    if((extensions.doctorn == true || extensions.doctorn == "force_true") && !settings.force_tt){
        return;
    }

    // Quick items
    let quick_container = content.new_container("Quick items", {id: "ttQuick", dragzone: true, collapsed: false, next_element: doc.find(".equipped-items-wrap")}).find(".content");
    let inner_content = doc.new({type: "div", class: "inner-content"});
    let response_wrap = doc.new({type: "div", class: "response-wrap"});
    quick_container.appendChild(inner_content);
    quick_container.appendChild(response_wrap);

    document.addEventListener("click", function(event){
        if(event.target.classList.contains("close-act") && hasParent(event.target, {id: "ttQuick"})){
            doc.find("#ttQuick .response-wrap").style.display = "none";
        }
    });

    if(quick.items.length > 0){
        for(let id of quick.items){
            let div = doc.new({type: "div", class: "item", attributes: {"item-id": id}});
            let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(/images/items/${id}/medium.png)`}});
            let text = doc.new({type: "div", class: "text", text: itemlist.items[id].name});
            let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});

            div.appendChild(pic);
            div.appendChild(text);
            div.appendChild(close_icon);
            inner_content.appendChild(div);

            close_icon.addEventListener("click", function(event){
                event.stopPropagation();
                div.remove();

                let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
                local_storage.change({"quick": {"items": items}});
            });

            div.addEventListener("click", function(){     
                console.log("Clicked Quick item");
                getAction({
                    type: "post",
                    action: "item.php",
                    data: {step: "actionForm", id: id, action: "use"},
                    success: function (str) {

                        if(quick_container.find(".action-wrap")){
                            quick_container.find(".action-wrap").remove();
                        }

                        response_wrap.style.display = "block";
                        response_wrap.innerHTML = str;
    
                        // adjust container
                        quick_container.style.maxHeight = quick_container.scrollHeight + "px"; 

                        useContainerLoaded().then(function(){
                            quick_container.find(`a[data-item='${id}']`).click();
                        });
                    }
                });
            });
        }
    }
});

itemsLoaded().then(function(){
    console.log("TT - Item values");

    // Item values
    if(settings.pages.items.values){
        displayItemPrices(itemlist.items);
    }

    // Quick items
    if(extensions.doctorn == false || extensions.doctorn == "force_false" || settings.force_tt){
        for(let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")){
            item.setAttribute("draggable", "true");
            item.addEventListener("dragstart", onDragStart);
            item.addEventListener("dragend", onDragEnd);
        }
    }

    // Drug detailed effects
    if(settings.pages.items.drug_details){
        let item_info_container_mutation = new MutationObserver(function(mutations){
            for(let mutation of mutations){
                if(mutation.type == "childList"){
                    if(mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("show-item-info")){
                        let el = mutation.addedNodes[0];
                        itemInfoLoaded(el).then(function(){
                            let item_name = el.find("span.bold").innerText;
                            if(item_name.indexOf("The") > -1) item_name = item_name.split("The ")[1];
        
                            let drug_details = drug_dict[item_name.toLowerCase().replace(/ /g, "_")];
    
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
    
                                // hospital time
                                if(drug_details.overdose.hosp_time){
                                    let hosp_div = doc.new({type: "div", class: "t-red bold item-effect tabbed", text: `Hospital: ${drug_details.overdose.hosp_time}`});
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
            }
        });
        item_info_container_mutation.observe(doc.find("body"), {childList: true, subtree: true});
    }

    // Change item type page
    let sorting_icons = doc.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)");
    for (let icon of sorting_icons) {
        icon.addEventListener("click", function () {
            itemsLoaded().then(function(){
                // Item values
                if(settings.pages.items.values){
                    displayItemPrices(itemlist.items);
                }

                if(extensions.doctorn == false || extensions.doctorn == "force_false" || settings.force_tt){
                    // Quick items
                    for(let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")){
                        item.setAttribute("draggable", "true");
                        item.addEventListener("dragstart", onDragStart);
                        item.addEventListener("dragend", onDragEnd);
                    }
                }
            });
        });
    }
});

function itemsLoaded() {
    return new Promise(function (resolve, reject) {
        let checker = setInterval(function () {
            let items = doc.find(".items-cont[aria-expanded=true]>li")
            if(items && [...items.children].length > 1){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function displayItemPrices(itemlist) {
    let items = doc.findAll(".items-cont[aria-expanded=true]>li");

    for (let item of items) {
        let id = item.getAttribute("data-item");
        let price = itemlist[id].market_value;
        let total_price;
        let qty;

        let parent = mobile ? item.find(".name-wrap") : (item.find(".bonuses-wrap") || item.find(".name-wrap"));
        let new_element;

        if (parent.find(".tt-item-price"))
            continue;

        if (item.find(".bonuses-wrap")) {
            new_element = doc.new("li");
            new_element.setClass("bonus left tt-item-price");
            
            if(mobile){
                new_element.setAttribute("style", `position: absolute; right: -10px; top: 10px; float: unset !important; font-size: 11px;`);
                parent.find(".name").setAttribute("style", "position: relative; top: -3px;");
                parent.find(".qty").setAttribute("style", "position: relative; top: -3px;");
            }

            if ([...item.findAll(".bonuses-wrap *")].length == 0) {
                qty = parseInt(parent.parentElement.parentElement.parentElement.find(".qty").innerText.replace("x", ""));
                total_price = qty * parseInt(price);
            }
        } else {
            new_element = doc.new("span");
            new_element.setClass("tt-item-price");

            if(mobile){
                new_element.setAttribute("style", `position: absolute; right: -10px; top: 10px; float: unset !important; font-size: 11px;`);
                parent.find(".name").setAttribute("style", "position: relative; top: -3px;");
                parent.find(".qty").setAttribute("style", "position: relative; top: -3px;");
            }

            qty = parseInt(parent.find(".qty").innerText.replace("x", ""));
            total_price = qty * parseInt(price);

            if (item.find("button.group-arrow")) {
                new_element.style.paddingRight = "30px";
            }
        }

        if (total_price) {
            // new_element.innerText = `$${numberWithCommas(price, shorten=false)} | ${qty}x = $${numberWithCommas(total_price, shorten=false)}`;
            let one_price = doc.new("span");
            one_price.innerText = `$${numberWithCommas(price, shorten = false)} |`;
            let quantity = doc.new("span");
            quantity.innerText = ` ${qty}x = `;
            quantity.setClass("tt-item-quantity");
            let all_price = doc.new("span");
            all_price.innerText = `$${numberWithCommas(total_price, shorten = false)}`;

            new_element.appendChild(one_price);
            new_element.appendChild(quantity);
            new_element.appendChild(all_price);
        } else if (price == 0) {
            new_element.innerText = `N/A`;
        } else {
            new_element.innerText = `$${numberWithCommas(price, shorten = false)}`;
        }

        parent.appendChild(new_element);
    }
}

function useContainerLoaded(){
    return new Promise(function (resolve, reject) {
        let checker = setInterval(function () {
            let wrap = doc.find("#ttQuick .action-wrap.use-act.use-action");
            if(wrap){
                resolve(true);
                return clearInterval(checker);
            }
        }, 10);
    });
}

function itemInfoLoaded(element){
    return new Promise(function (resolve, reject) {
        let checker = setInterval(function () {
            if(!element.find(".ajax-placeholder")){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

// Torn functions
function getAction(obj) {
    obj.success = obj.success || function () {};
    // obj.error = obj.error || onAjaxError;
    obj.before = obj.before || function () {};
    obj.complete = obj.complete || function () {};
    var url = obj.action || window.location.protocol + "//" + window.location.hostname + location.pathname;
    var options = {
        url: "https://www.torn.com/"+addRFC(url),
        type: obj.type || "get",
        data: obj.data || {},
        async: typeof obj.async !== "undefined" ? obj.async : true,
        beforeSend: function (xhr) {
            // obj.before(xhr);
        },
        success: function (msg) {
            // if (!checkPageStatus(msg)) return;
            console.log("success")
            obj.success(msg);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("error", thrownError);
            // if (typeof xhr.error === "function") {
            //     obj.error(xhr, ajaxOptions, thrownError);
            // } else {
            //     informationMessageTemplateIn(xhr.error, true, false, "red");
            //     $(".info-msg .msg").text("Request error. Please try again.");
            // }
        },
        complete: function (data) {
            // obj.complete(data);
        },
    };
    if (options.data.step != undefined) {
    }
    if (obj.file) {
        options.cache = false;
        options.contentType = false;
        options.processData = false;
    }
    return $.ajax(options);
}

// Dragging
function onDragStart(event) {
    setTimeout(function(){
        doc.find("#ttQuick .content").classList.add("drag-progress");
        if(doc.find("#ttQuick .temp.item")){
            return;
        }
    
        let id = event.target.parentElement.getAttribute("data-item");
    
        let div = doc.new({type: "div", class: "temp item", attributes: {"item-id": id}});
        let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(/images/items/${id}/medium.png)`}});
        let text = doc.new({type: "div", class: "text", text: itemlist.items[id].name});
        let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});
    
        div.appendChild(pic);
        div.appendChild(text);
        div.appendChild(close_icon);
        doc.find("#ttQuick .inner-content").appendChild(div);
    
        close_icon.addEventListener("click", function(event){
            event.stopPropagation();
            div.remove();
    
            let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
            local_storage.change({"quick": {"items": items}});
        });
    
        div.addEventListener("click", function(){
            getAction({
                type: "post",
                action: "item.php",
                data: {step: "actionForm", id: id, action: "use"},
                success: function (str) {
                    
                    if(doc.find("#ttQuick").find(".action-wrap")){
                        doc.find("#ttQuick").find(".action-wrap").remove();
                    }
    
                    doc.find("#ttQuick .response-wrap").style.display = "block";
                    doc.find("#ttQuick .response-wrap").innerHTML = str;
                    
                    // adjust container
                    doc.find("#ttQuick .content").style.maxHeight = doc.find("#ttQuick .content").scrollHeight + "px"; 
                    
                    useContainerLoaded().then(function(){
                        doc.find("#ttQuick").find(`a[data-item='${id}']`).click();
                    });
                }
            });
        });
    }, 10);
}

function onDragEnd(event){
    if(doc.find("#ttQuick .temp.item")){
        doc.find("#ttQuick .temp.item").remove();
    }
    
    doc.find("#ttQuick .content").classList.remove("drag-progress");

    let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
    local_storage.change({"quick": {"items": items}});
}