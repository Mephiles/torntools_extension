DBloaded().then(function(){
	contentLoaded().then(function(){
        console.log("TT - Quick items");
        if (shouldDisable()) return;

        // Quick items
        let quick_container = content.new_container("Quick items", {id: "ttQuick", dragzone: true, next_element: doc.find(".equipped-items-wrap")}).find(".content");
        let inner_content = doc.new({type: "div", class: "inner-content"});
        let response_wrap = doc.new({type: "div", class: "response-wrap"});
        quick_container.appendChild(inner_content);
        quick_container.appendChild(response_wrap);

        document.addEventListener("click", function(event){
            if(event.target.classList.contains("close-act") && hasParent(event.target, {id: "ttQuick"})){
                doc.find("#ttQuick .response-wrap").style.display = "none";
            }
        });

        addButton();

        if(quick.items.length > 0){
            for(let id of quick.items){
                let amount = findItemsInList(userdata.inventory, {ID: id})[0].quantity;

                let div = doc.new({type: "div", class: "item", attributes: {"item-id": id}});
                let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(/images/items/${id}/medium.png)`}});
                let text = doc.new({type: "div", class: "text", text: itemlist.items[id].name});
                let quantity = doc.new({type: "div", class: "sub-text tt-quickitems-quantity", attributes: {quantity: amount}, text: amount+"x"});
                let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});

                div.appendChild(pic);
                div.appendChild(text);
                div.appendChild(quantity);
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

                            let newQuantity = parseInt(quantity.getAttribute("quantity")) - 1;
                            quantity.innerText = newQuantity + "x";
                            quantity.setAttribute("quantity", newQuantity);

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
});

DBloaded().then(function(){
    itemsLoaded().then(function(){
        console.log("TT - Item values");

        // Item values
        if(settings.pages.items.values){
            displayItemPrices(itemlist.items);
        }

        // Quick items
        if (!shouldDisable()) {
            for (let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")) {
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
                                if(drug_details == undefined){
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

        // Item Market links
        if(settings.pages.items.itemmarket_links){
            addItemMarketLinks();
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

                    if (!shouldDisable()) {
                        // Quick items
                        for (let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")) {
                            item.setAttribute("draggable", "true");
                            item.addEventListener("dragstart", onDragStart);
                            item.addEventListener("dragend", onDragEnd);
                        }
                    }

                    // Item Market links
                    if(settings.pages.items.itemmarket_links){
                        addItemMarketLinks();
                    }
                });
            });
        }
    });
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

function addButton(){
    let wrap = doc.new({type: "div", class: "tt-option", id: "add-crime-button"});
    let icon = doc.new({type: "i", class: "fas fa-plus"});
    wrap.appendChild(icon);
    wrap.innerHTML += " Add";

    doc.find("#ttQuick .tt-title .tt-options").appendChild(wrap);

    wrap.onclick = function(event){
        event.stopPropagation();

        if(doc.find(".tt-black-overlay").classList.contains("active")){
            doc.find(".tt-black-overlay").classList.remove("active");
            doc.find("ul.items-cont[aria-expanded='true']").classList.remove("tt-highlight-sector");
            doc.find(".tt-title .tt-options .tt-option#add-crime-button").classList.remove("tt-highlight-sector");

            for(let item of doc.findAll("ul.items-cont[aria-expanded='true']>li")){
                item.onclick = undefined;
            }
        } else {
            doc.find(".tt-black-overlay").classList.add("active");
            doc.find("ul.items-cont[aria-expanded='true']").classList.add("tt-highlight-sector");
            doc.find(".tt-title .tt-options .tt-option#add-crime-button").classList.add("tt-highlight-sector");

            for(let item of doc.findAll("ul.items-cont[aria-expanded='true']>li")){
                item.onclick = function(event){
                    event.stopPropagation();
                    event.preventDefault();

                    let target = findParent(event.target, {has_attribute: "data-item"});
                    let id = target.getAttribute("data-item");

                    let div = doc.new({type: "div", class: "item", attributes: {"item-id": id}});
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

                    // Save
                    let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
                    local_storage.change({"quick": {"items": items}});
                }
            }            
        }

    }
}

function addItemMarketLinks(){
    let items = doc.findAll(".items-cont[aria-expanded=true]>li");

    if(doc.find(".items-cont[aria-expanded=true] .tt-market-link")) return;

    for(let item of items){
        let li = doc.new({type: "li", class: "left tt-market-link", attributes: {"data-id": item.getAttribute("data-item")}});
        let a = doc.new({type: "a", href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${item.find(".image-wrap img").getAttribute("alt")}`});
        let i = doc.new({type: "i", class: "cql-item-market", attributes: {title: "Open Item Market"}});
        a.appendChild(i);
        li.appendChild(a);

        if(item.classList.contains("item-group")) item.classList.add("tt-modified");
        
        item.find(".name-wrap").classList.add("tt-modified");
        item.find(".cont-wrap").classList.add("tt-modified");

        let actionParent = doc.new({type: "div"});

        let actionRight = item.find(".actions.right");
        actionRight.classList.add("tt-modified")

        actionParent.appendChild(actionRight);

        item.find(".cont-wrap").appendChild(actionParent)

        if(item.find("ul.actions-wrap .dump")){
            item.find("ul.actions-wrap").insertBefore(li, item.find("ul.actions-wrap .dump"));
        } else {
            item.find("ul.actions-wrap").insertBefore(li, item.find("ul.actions-wrap .clear"));
        }
    }
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
        let quantity = doc.new({type: "div", class: "sub-text", text: findItemsInList(userdata.inventory, {ID: id})[0].quantity+"x"});
        let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});
    
        div.appendChild(pic);
        div.appendChild(text);
        div.appendChild(quantity);
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