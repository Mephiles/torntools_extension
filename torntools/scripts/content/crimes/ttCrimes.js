contentLoaded().then(function(){
    console.log("TT - Quick crimes");

    // Quick crimes
    quickCrimesMain(quick);
});

crimesLoaded().then(function(){
    // Change crime page
    for(let el of doc.findAll("form[name=crimes]>ul>li")){
        el.addEventListener("click", function(){
            local_storage.get("quick", function(quick){
                crimesLoaded().then(function(){
                    quickCrimesMain(quick);
    
                    // Quick crimes
                    for(let crime of doc.findAll("form[name=crimes]>ul>li")){
                        crime = crime.find(".item");
    
                        crime.setAttribute("draggable", "true");
                        crime.addEventListener("dragstart", onDragStart);
                        crime.addEventListener("dragend", onDragEnd);
                    }
                });
            });
        });
    }
    // window.addEventListener("hashchange", function(){
    //     if(doc.find("form[name=crimes]>ul>li") && doc.find("form[name=crimes]>ul>li").draggable){
    //         return;
    //     }

    //     crimesLoaded().then(function(){
                 
    //     });
    // });
});

function crimesLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if([...doc.findAll("form[name=crimes]>ul>li")].length > 1){
                resolve(true);
                return clearInterval(checker);
            }
        }, 100);
    });
}

function quickCrimesMain(quick){
    let quick_container = content.new_container("Quick crimes", {id: "ttQuick", dragzone: true, dragzone_name: "crimes", collapsed: false, next_element: doc.find("#module-desc") || doc.find(".title-black[role=heading]") || doc.find(".users-list-title")}).find(".content");
    let inner_content = doc.new({type: "div", class: "inner-content"});
    quick_container.appendChild(inner_content);

    if(quick.items.length > 0){
        for(let crime of quick.crimes){
            let div = doc.new({type: "div", class: "item", attributes: {"nerve": crime.nerve, "name": crime.name, "action": crime.action}});
            let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(${crime.icon})`}});
            let text = doc.new({type: "div", class: "text", text: crime.text});
            let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});

            div.appendChild(pic);
            div.appendChild(text);
            div.appendChild(close_icon);
            inner_content.appendChild(div);

            close_icon.addEventListener("click", function(event){
                event.stopPropagation();
                div.remove();

                let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
                    "action": x.getAttribute("action"),
                    "nerve": x.getAttribute("nerve"), 
                    "name": x.getAttribute("name"), 
                    "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
                    "text": x.find(".text").innerText
                }));
                local_storage.change({"quick": {"crimes": crimes}});
            });

            div.addEventListener("click", function(){
                let action = div.getAttribute("action")
                let nerve_take = div.getAttribute("nerve")
                let crime_name = div.getAttribute("name")

                ajaxWrapper({
                    url: action,
                    type: "POST",
                    data: {nervetake: nerve_take, crime: crime_name},
                    onerror: function (ee) {
                        console.error(ee);
                    },
                });
            });
        }
    }
}

// Torn functions
function ajaxWrapper(request_options, infobox_options) {
    if (infobox_options) {
        var io = infobox_options;
        io.isTopDelimiterRequired = typeof io.isTopDelimiterRequired === "undefined" ? true : io.isTopDelimiterRequired;
        io.isBottomDelimiterRequired = typeof io.isBottomDelimiterRequired === "undefined" ? false : io.isBottomDelimiterRequired;
        informationMessageTemplateIn(io.elementIn, io.isTopDelimiterRequired, io.isBottomDelimiterRequired, io.color ? io.color : "");
        io.elementIn.find(".info-msg-cont .msg").html('<img class="ajax-placeholder" src="/images/v2/main/ajax-loader.gif" />');
    }
    var r = $.ajax({
        url: request_options.url + "&rfcv=5ee0ce651a1c1",
        // dataType: request_options.dataType ? request_options.dataType : "text",
        type: request_options.type,
        // timeout: request_options.timeout,
        // processData: request_options.processData != undefined ? request_options.processData : undefined,
        // contentType: request_options.contentType != undefined ? request_options.contentType : undefined,
        // cache: request_options.cache != undefined ? request_options.cache : undefined,
        // headers: request_options.headers != undefined ? request_options.headers : undefined,
        data: request_options.data,
        // async: request_options.async != undefined ? request_options.async : true,
        success: function (resp) {
            doc.find(".content-wrapper[role=main]").innerHTML = resp;
            setTimeout(function(){
                local_storage.get("quick", function(quick){
                    quickCrimesMain(quick);
                });
            }, 300);
            
            // console.log("success", resp);
            // if (!checkPageStatus(resp)) return;
            // if (request_options.oncomplete) request_options.oncomplete({ responseText: resp });
            // if (infobox_options) {
            //     var io = infobox_options,
            //         text = "";
            //     try {
            //         var responseData = JSON.parse(resp);
            //         io.color = responseData.color || "";
            //         text = responseData.msg;
            //     } catch (e) {
            //         text = resp;
            //     }
            //     informationMessageTemplateIn(io.elementIn, false, false, io.color ? io.color : "");
            //     var data = '<div class="ajax-action">' + text + "</div>";
            //     io.elementIn.find(".info-msg-cont .msg").html(data);
            // }
            // if (request_options.onsuccess) request_options.onsuccess(resp);
        },
        error: function (resp) {
            console.log("error", resp);
            // if (typeof request_options.onerror === "function") {
            //     request_options.onerror.call(this, resp);
            // }
            // if (infobox_options) {
            //     var data = '<div class="ajax-action">Request error. Please try again.</div>',
            //         $msg = io.elementIn.find(".info-msg-cont .msg");
            //     $msg.html(data);
            //     $msg.parents(".info-msg-cont").removeClass("green blue").addClass("red");
            // }
            // onAjaxError.apply(this, arguments);
        },
    });
    return r;
}

// Dragging
function onDragStart(event) {
    doc.find("#ttQuick .content").classList.add("drag-progress");
    if(doc.find("#ttQuick .temp.item")){
        return;
    }

    let action = doc.find("form[name=crimes]").getAttribute("action");
    action = action[0] == "/" ? action.substr(1) : action;
    let urlParamsDelimier = action.indexOf("?") > -1 ? "&" : "?";
    action += urlParamsDelimier + "timestamp=" + Date.now();

    let crime_nerve = doc.find("input[name=nervetake]").value;
    let crime_name = event.target.find(".radio.right input").getAttribute("value");
    let crime_icon = event.target.find(".title.left img").getAttribute("src");
    let crime_text = event.target.find(".bonus.left").innerText.trim();
    
    event.dataTransfer.setData("text/plain", JSON.stringify({
        "action": action,
        "name": crime_name,
        "nerve": crime_nerve,
        "icon": crime_icon,
        "text": crime_text
    }));

    let div = doc.new({type: "div", class: "temp item", attributes: {"nerve": crime_nerve, "name": crime_name, "action": action}});
    let pic = doc.new({type: "div", class: "pic", attributes: {style: `background-image: url(${crime_icon})`}});
    let text = doc.new({type: "div", class: "text", text: crime_text});
    let close_icon = doc.new({type: "i", class: "fas fa-times tt-close-icon"});

    div.appendChild(pic);
    div.appendChild(text);
    div.appendChild(close_icon);
    doc.find("#ttQuick .inner-content").appendChild(div);

    close_icon.addEventListener("click", function(event){
        event.stopPropagation();
        div.remove();

        let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
            "action": x.getAttribute("action"),
            "nerve": x.getAttribute("nerve"), 
            "name": x.getAttribute("name"), 
            "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
            "text": x.find(".text").innerText
        }));
        local_storage.change({"quick": {"crimes": crimes}});
    });
}

function onDragEnd(event){
    if(doc.find("#ttQuick .temp.item")){
        doc.find("#ttQuick .temp.item").remove();
    }
    
    doc.find("#ttQuick .content").classList.remove("drag-progress");

    let crimes = [...doc.findAll("#ttQuick .item")].map(x => ({
        "action": x.getAttribute("action"),
        "nerve": x.getAttribute("nerve"), 
        "name": x.getAttribute("name"), 
        "icon": window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0], 
        "text": x.find(".text").innerText
    }));
    local_storage.change({"quick": {"crimes": crimes}});
}