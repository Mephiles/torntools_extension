window.addEventListener('load', async (event) => {
    if(await flying() || await abroad())
        return;

    local_storage.get(["updated", "settings", "custom_links", "chat_highlight", "userdata"], function([updated, settings, custom_links, chat_highlight, userdata]){
        // Update notification
        if(updated && settings.update_notification){
            let version_text = `TornTools updated: ${chrome.runtime.getManifest().version}`;
            
            navbar.new_cell(version_text, {
                parent_heading: "Areas",
                first: true,
                style: `
                    background-color: #B8E28F;
                `,
                href: chrome.runtime.getURL("/views/settings/settings.html")
            });
        }

        // Info boxes
        if(settings.remove_info_boxes && ["crimes", "jail"].includes(page())){
            console.log("Removing info box.")
            if(doc.find(".msg-info-wrap")){
                if(doc.find(".msg-info-wrap+hr")){
                    doc.find(".msg-info-wrap+hr").style.display = "none";
                }
                doc.find(".msg-info-wrap").style.display = "none";
            } else if(doc.find(".info-msg-cont")){
                if(doc.find(".info-msg-cont+hr")){
                    doc.find(".info-msg-cont+hr").style.display = "none";
                }
                doc.find(".info-msg-cont").style.display = "none";
            }
        }

        // Custom links
        if(custom_links.length > 0){
            let links_section = navbar.new_section("Custom Links", {next_element_heading: "Areas", theme: settings.theme});

            for(let link of custom_links){
                new_cell = navbar.new_cell(link.text, {parent_element: links_section, href: link.href});
            }
        }

        // Upgrade button
        if(settings.hide_upgrade){
            doc.find("#pointsLevel").style.display = "none";

            if(doc.find(".info-msg-cont") && doc.find(".info-msg-cont").innerText.indexOf("to upgrade") > -1){
                doc.find(".info-msg-cont").style.display = "none";
                doc.find(".info-msg-cont+hr").style.display = "none";
            }
        }

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

        // showColorCodes();
    })
});

function page(){
    let db = {
        "jailview.php": "jail",
        "hospitalview.php": "hospital",
        "crimes.php": "crimes"
    }

    let page = window.location.pathname.replace("/", "");
    if(db[page]){
        return db[page];
    }
    return "";
}

function showColorCodes(){
    let dictionary = {
        "home": "#8ad2f7",
        "items": "#91a96be0",
        "city": "#cc3ecc9e",
        "job": "#a255279e",
        "gym": "#7ed426",
        "properties": "#71717173",
        "education": "#8ad2f7",
        "crimes": "#e4755b",
        "missions": "#e4755b",
        "newspaper": "#71717173",
        "jail": "#a255279e",
        "hospital": "#71717173",
        "casino": "#e4755b",
        "forums": "#8ad2f7",
        "hall_of_fame": "#c5c242",
        "my_faction": "#91a96be0",
        "recruit_citizens": "#71717173",
        "competitions": "#c5c242"
    }

    let navbar_content = doc.find("h2=Areas").nextElementSibling;

    for(let key in dictionary){
        let cell = navbar_content.find(`#nav-${key}`);

        let span = doc.new("span");
            span.setClass("nav-color-code");
            span.style.backgroundColor = dictionary[key];

        cell.appendChild(span);
    }
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