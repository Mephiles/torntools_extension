console.log("Loading Global Script");

navbarLoaded().then(function(){
    // Firefox opens new tab when dropping item
    doc.body.ondrop = function(event){
        event.preventDefault();
        event.stopPropagation();
    }

    // Update notification
    if(DB.updated && settings.update_notification){
        addUpdateNotification();
    }

    // Custom links
    if(DB.custom_links.length > 0){
        addCustomLinks();
    }

    // Notes
    addNotesBox();

    // Remove icons that are hidden
    for(let icon of doc.findAll(`#sidebarroot .status-icons___1SnOI>li`)){
        let name = icon.getAttribute("class").split("_")[0];
        if(hide_icons.indexOf(name) > -1){
            icon.remove();
        }
    }
});

chatsLoaded().then(function(){
    // Chat highlight
    if(doc.find(".chat-box-content_2C5UJ .overview_1MoPG .message_oP8oM")){
        highLightChat(chat_highlight, userdata.name);
    }

    doc.addEventListener("click", function(event){
        if(!hasParent(event.target, {class: "chat-box_Wjbn9"})){
            return;
        }

        highLightChat(chat_highlight, userdata.name);
    });

    let chat_observer = new MutationObserver(function(mutationsList, observer){
        for(let mutation of mutationsList){
            if(mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("message_oP8oM")){
                let message = mutation.addedNodes[0];

                let sender = message.find("a").innerText.replace(":", "").trim();
                let text = message.find("span").innerText;
                
                if(sender in chat_highlight){
                    message.find("a").style.color = chat_highlight[sender];
                }
                if(text.indexOf(userdata.name) > -1){
                    message.find("span").style.backgroundColor = "#c3e26e";
                }
            }
        }
    });
    chat_observer.observe(doc.find("#chatRoot"), {childList: true, subtree: true});
});

function chatsLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".overview_1MoPG")){
                setInterval(function(){
                    resolve(true);
                }, 300);
                return clearInterval(checker);
            }
        });
    });
}

function addCustomLinks(){
    // MOVE INTO NAVBAR BLOCK
    let sidebar_block = doc.new({type: "div", class: "sidebar-block___1Cqc2 tt-nav-section"});
    let content = doc.new({type: "div", class: "content___kMC8x"});
    let div1 = doc.new({type: "div", class: "areas___2pu_3"})
    let toggle_block = doc.new({type: "div", class: "toggle-block___13zU2"})
    let header;
    if(settings.theme == "default"){
        header = doc.new({type: "div", text: "Custom Links", class: "tt-title title-green"});
    } else if(settings.theme == "alternative"){
        header = doc.new({type: "div", text: "Custom Links", class: "tt-title title-black"});
    }
    let toggle_content = doc.new({type: "div", class: "toggle-content___3XKOC"});

    toggle_block.appendChild(header);
    toggle_block.appendChild(toggle_content);
    div1.appendChild(toggle_block);
    content.appendChild(div1);
    sidebar_block.appendChild(content);

    for(let link of DB.custom_links){
        let cell = doc.new({type: "div", class: "area-desktop___2YU-q"});
        let inner_div = doc.new({type: "div", class: "area-row___34mEZ"});
        let a = doc.new({type: "a", class: "desktopLink___2dcWC", href: link.href, attributes: {target: (link.new_tab ? "_blank" : ""), style: "min-height: 24px; line-height: 24px;"}});
        let span = doc.new({type: "span", text: link.text});
    
        a.appendChild(span);
        inner_div.appendChild(a);
        cell.appendChild(inner_div)
        sidebar_block.appendChild(cell);
    }

    doc.find("#sidebar").insertBefore(sidebar_block, doc.find("h2=Areas").parentElement.parentElement.parentElement.parentElement);
}

function addNotesBox(){
    // MOVE INTO NAVBAR BLOCK
    let sidebar_block = doc.new({type: "div", class: "sidebar-block___1Cqc2 tt-nav-section"});
    let content = doc.new({type: "div", class: "content___kMC8x"});
    let div1 = doc.new({type: "div", class: "areas___2pu_3"})
    let toggle_block = doc.new({type: "div", class: "toggle-block___13zU2"})
    let header;
    if(settings.theme == "default"){
        header = doc.new({type: "div", text: "Notes", class: "tt-title title-green"});
    } else if(settings.theme == "alternative"){
        header = doc.new({type: "div", text: "Notes", class: "tt-title title-black"});
    }
    let toggle_content = doc.new({type: "div", class: "toggle-content___3XKOC"});

    toggle_block.appendChild(header);
    toggle_block.appendChild(toggle_content);
    div1.appendChild(toggle_block);
    content.appendChild(div1);
    sidebar_block.appendChild(content);

    let cell = doc.new({type: "div", class: "area-desktop___2YU-q"});
    let inner_div = doc.new({type: "div", class: "area-row___34mEZ"});
    let textbox = doc.new({type: "textarea", class: "tt-nav-textarea", value: notes.text || ""});

    if(notes.height){
        textbox.style.height = notes.height;
    }

    inner_div.appendChild(textbox);
    cell.appendChild(inner_div)
    sidebar_block.appendChild(cell);

    doc.find("#sidebar").insertBefore(sidebar_block, doc.find("h2=Areas").parentElement.parentElement.parentElement.parentElement);

    textbox.addEventListener("change", function(){
        local_storage.set({"notes": {"text": textbox.value, "height": textbox.style.height}});
    });
    textbox.addEventListener("mouseup", function(){ 
        if(textbox.style.height != notes.height){
            console.log("resize");
            console.log(textbox.style.height)
            local_storage.set({"notes": {"text": textbox.value, "height": textbox.style.height}});
        }
    });
}

function addUpdateNotification(){
    let version_text = `TornTools updated: ${chrome.runtime.getManifest().version}`;
    let settings_page_url = chrome.runtime.getURL("/views/settings/settings.html");

    let cell = doc.new({type: "div", class: "area-desktop___2YU-q"});
    let inner_div = doc.new({type: "div", class: "area-row___34mEZ"});
    let a = doc.new({type: "a", class: "desktopLink___2dcWC", href: settings_page_url, attributes: {target: "_blank", style: "background-color: #B8E28F; min-height: 24px; line-height: 24px;"}});
    let span = doc.new({type: "span", text: version_text});

    a.appendChild(span);
    inner_div.appendChild(a);
    cell.appendChild(inner_div);
    
    doc.find("h2=Areas").nextElementSibling.insertBefore(cell, doc.find("h2=Areas").nextElementSibling.firstElementChild);
}

function highLightChat(chat_highlight, username){
    let chats = doc.findAll(".chat-box-content_2C5UJ .overview_1MoPG");
    for(let chat of chats){
        let messages = chat.findAll(".message_oP8oM");
        
        for(let message of messages){
            let sender = message.find("a").innerText.replace(":", "").trim();
            let text = message.find("span").innerText;
            
            if(sender in chat_highlight){
                message.find("a").style.color = chat_highlight[sender];
            }
            if(text.indexOf(username) > -1){
                message.find("span").style.backgroundColor = "#c3e26e";
            }
        }
    }
}

// function showColorCodes(){
//     let dictionary = {
//         "home": "#8ad2f7",
//         "items": "#91a96be0",
//         "city": "#cc3ecc9e",
//         "job": "#a255279e",
//         "gym": "#7ed426",
//         "properties": "#71717173",
//         "education": "#8ad2f7",
//         "crimes": "#e4755b",
//         "missions": "#e4755b",
//         "newspaper": "#71717173",
//         "jail": "#a255279e",
//         "hospital": "#71717173",
//         "casino": "#e4755b",
//         "forums": "#8ad2f7",
//         "hall_of_fame": "#c5c242",
//         "my_faction": "#91a96be0",
//         "recruit_citizens": "#71717173",
//         "competitions": "#c5c242"
//     }

//     let navbar_content = doc.find("h2=Areas").nextElementSibling;

//     for(let key in dictionary){
//         let cell = navbar_content.find(`#nav-${key}`);

//         let span = doc.new("span");
//             span.setClass("nav-color-code");
//             span.style.backgroundColor = dictionary[key];

//         cell.appendChild(span);
//     }
// }