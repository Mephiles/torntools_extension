contentLoaded().then(function(){
    console.log("TT - Quick items");

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
    for(let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")){
        item.setAttribute("draggable", "true");
        item.addEventListener("dragstart", onDragStart);
        item.addEventListener("dragend", onDragEnd);
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

                // Quick items
                for(let item of doc.findAll(".items-cont[aria-expanded=true]>li .title-wrap")){
                    item.setAttribute("draggable", "true");
                    item.addEventListener("dragstart", onDragStart);
                    item.addEventListener("dragend", onDragEnd);
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

        let parent = item.find(".bonuses-wrap") || item.find(".name-wrap");
        let new_element;

        if (parent.find(".tt-item-price"))
            continue;

        if (item.find(".bonuses-wrap")) {
            new_element = doc.new("li");
            new_element.setClass("bonus left tt-item-price");

            if ([...item.findAll(".bonuses-wrap *")].length == 0) {
                qty = parseInt(parent.parentElement.parentElement.parentElement.find(".qty").innerText.replace("x", ""));
                total_price = qty * parseInt(price);
            }
        } else {
            new_element = doc.new("span");
            new_element.setClass("tt-item-price");

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
        event.dataTransfer.setData("text/plain", id);
    
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