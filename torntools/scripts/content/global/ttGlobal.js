DBloaded().then(function(){
    console.log("Loading Global Script");

    // Add TT Black overlay
    let overlay = doc.new({type: "div", class: "tt-black-overlay"});
    doc.find("body").appendChild(overlay);

    showToggleChat();

    navbarLoaded().then(async function(){
        let _flying = await flying();

        // Firefox opens new tab when dropping item
        doc.body.ondrop = function(event){
            event.preventDefault();
            event.stopPropagation();
        }
    
        // Update notification
        if(updated && settings.update_notification){
            addUpdateNotification();
        }
    
        // Custom links
        if(custom_links.length > 0){
            addCustomLinks();
        }
    
        // Notes
        if(settings.pages.global.notes){
            addNotesBox();
        }
    
        // Remove icons that are hidden
        for(let icon of doc.findAll(`#sidebarroot .status-icons___1SnOI>li`)){
            let name = icon.getAttribute("class").split("_")[0];
            if(hide_icons.indexOf(name) > -1){
                icon.remove();
            }
        }

        // Vault balance
        if(settings.pages.global.vault_balance && !mobile){
            displayVaultBalance();
        }

        // Content margin
        if(mobile && !_flying && custom_links.length > 0){
            console.log("here")
            doc.find("div[role='main']").classList.add("tt-modified");
        }
    });
    
    chatsLoaded().then(function(){
        if (shouldDisable()) return

        // Chat highlight
        let highlights = {...chat_highlight};
        for (let key in highlights) {
            if (!(key in HIGHLIGHT_PLACEHOLDERS)) continue;

            highlights[HIGHLIGHT_PLACEHOLDERS[key].value()] = highlights[key];
        }

        if(doc.find(".chat-box-content_2C5UJ .overview_1MoPG .message_oP8oM")){
            highLightChat(highlights);

            if(settings.pages.global.find_chat) addChatFilters();
        }
    
        doc.addEventListener("click", function(event){
            if(!hasParent(event.target, {class: "chat-box_Wjbn9"})){
                return;
            }
    
            highLightChat(highlights);
            if(settings.pages.global.find_chat) addChatFilters();
        });
    
        let chat_observer = new MutationObserver(function(mutationsList, observer){
            for(let mutation of mutationsList){
                if(mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("message_oP8oM")){
                    let message = mutation.addedNodes[0];

                    applyChatHighlights(message, highlights);
                }
            }
        });
        chat_observer.observe(doc.find("#chatRoot"), {childList: true, subtree: true});
    });
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
    if(mobile){
        let areas_custom = doc.new({type: "div", class: "areas___2pu_3 areasWrapper areas-mobile___3zY0z torntools-mobile"});
        let div = doc.new({type: "div"});
        let swipe_container = doc.new({type: "div", class: "swiper-container swiper-container-horizontal"});
        let swipe_wrapper = doc.new({type: "div", class: "swiper-wrapper swiper___nAyWO", attributes: {style: "transform: translate3d(0px, 0px, 0px); transition-duration: 0ms;"}});
        let swipe_button_left = doc.new({type: "div", class: "swiper-button___3lZ1n button-prev___2x-Io swiper-button-disabled"});
        let swipe_button_right = doc.new({type: "div", class: "swiper-button___3lZ1n button-next___1hJxo"});

        for(let link of custom_links){
            let slide = doc.new({type: "div", class: "swiper-slide slide___1oBWA"});
            let area = doc.new({type: "div", class: "area-mobile___1XJcq"});
            let area_row = doc.new({type: "div", class: "area-row___34mEZ torntools-mobile"});
            let a = doc.new({type: "a", href: link.href, class: "mobileLink___33zU1 sidebarMobileLink torntools-mobile", text: link.text, attributes: {target: (link.new_tab? "_blank":"")}});

            area_row.appendChild(a);
            area.appendChild(area_row);
            slide.appendChild(area);
            swipe_wrapper.appendChild(slide);
        }
        
        swipe_container.appendChild(swipe_wrapper);
        swipe_container.appendChild(swipe_button_left);
        swipe_container.appendChild(swipe_button_right);
        div.appendChild(swipe_container);
        areas_custom.appendChild(div);

        doc.find("#sidebar .content___kMC8x").insertBefore(areas_custom, doc.find("#sidebar .content___kMC8x .user-information-mobile___EaRKJ"));
    } else {
        let custom_links_section = navbar.new_section("Custom Links", {next_element_heading: "Areas"});
    
        for(let link of custom_links){
            new_cell = navbar.new_cell(link.text, {parent_element: custom_links_section, href: link.href, link_target: (link.new_tab ? "_blank" : "")});
        }
    
        doc.find("#sidebar").insertBefore(custom_links_section, findParent(doc.find("h2=Areas"), {class: "sidebar-block___1Cqc2"}));
    }
}

function addNotesBox(){
    if(!mobile){
        let notes_section = navbar.new_section("Notes", {next_element_heading: "Areas"});
        let cell = doc.new({type: "div", class: "area-desktop___2YU-q"});
        let inner_div = doc.new({type: "div", class: "area-row___34mEZ"});
        let textbox = doc.new({type: "textarea", class: "tt-nav-textarea", value: notes.text || ""});
    
        if(notes.height){
            textbox.style.height = notes.height;
        }
    
        inner_div.appendChild(textbox);
        cell.appendChild(inner_div)
        notes_section.find(".tt-content").appendChild(cell);
    
        doc.find("#sidebar").insertBefore(notes_section, findParent(doc.find("h2=Areas"), {class: "sidebar-block___1Cqc2"}));
    
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

function highLightChat(chat_highlight){
    let chats = doc.findAll(".chat-box-content_2C5UJ .overview_1MoPG");
    for(let chat of chats){
        let messages = chat.findAll(".message_oP8oM");
        
        for(let message of messages){
            applyChatHighlights(message, chat_highlight)
        }
    }
}

function applyChatHighlights(message, highlights) {
    let sender = message.find("a").innerText.replace(":", "").trim();
    let text = message.find("span").innerText;
    const words = text.split(" ").map((w) => w.toLowerCase());

    if(sender in highlights){
        message.find("a").style.color = highlights[sender];
    }

    for (let highlight in highlights) {
        if (!words.includes(highlight.toLowerCase())) continue;

        let color = highlights[highlight]
        if (color.length === 7) color += "6e";

        message.find("span").parentElement.style.backgroundColor = color;
        break;
    }
}

function addChatFilters(){
    let chats = doc.findAll(".chat-box-content_2C5UJ");
    for(let chat of chats){
        if(!chat.nextElementSibling) continue;
        if(chat.nextElementSibling.find(".tt-chat-filter")) continue;

        chat.nextElementSibling.classList.add("tt-modified");

        let filter_wrap = doc.new({type: "div", class: "tt-chat-filter"});
        let filter_text = doc.new({type: "div", text: "find:"});
        let filter_input = doc.new({type: "input", id: "---search---"});

        filter_wrap.appendChild(filter_text);
        filter_wrap.appendChild(filter_input);

        chat.nextElementSibling.insertBefore(filter_wrap, chat.nextElementSibling.firstElementChild);

        // Filtering process
        filter_input.onkeyup = function(){
            let keyword = filter_input.value.toLowerCase();

            for(let message of chat.findAll(".overview_1MoPG .message_oP8oM span")){
                message.parentElement.style.display = "block";
                
                if(keyword != "" && message.innerText.toLowerCase().indexOf(keyword) == -1){
                    message.parentElement.style.display = "none";
                }
            }

            if(keyword == ""){
                let viewport = chat.find(".viewport_1F0WI");
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }
}

function displayVaultBalance(){
    if (!networth || !networth.current || !networth.current.value) return;

    let elementHTML = `
    <span class="name___297H-">Vault:</span>
    <span class="value___1K0oi money-positive___3pqLW" style="position:relative;left:-3px;">$${numberWithCommas(networth.current.value.vault, false)}</span>
    `

    let el = doc.new({type: "p", class: "point-block___xpMEi", attributes: {tabindex: "1"}});
    el.innerHTML = elementHTML;

    let info_cont = doc.find("h2=Information");
    info_cont.parentElement.find(".points___KTUNl").insertBefore(el, info_cont.parentElement.find(".points___KTUNl .point-block___xpMEi:nth-of-type(2)"));
}

function showToggleChat() {
    hideChat();

    const icon = doc.new({id: "tt-hide_chat", type: "i", class: "fas fa-binoculars"});

    icon.addEventListener("click", () => {
        settings.pages.global.hide_chat = !settings.pages.global.hide_chat;

        hideChat();

        local_storage.set({"settings": settings});
    });

    doc.find("#body").prepend(icon);

    function hideChat() {
        const hide = settings.pages.global.hide_chat;

        doc.documentElement.style.setProperty(`--torntools-hide-chat`, hide ? "none" : "block");

        if (!hide) {
            document.querySelectorAll(".chat-box_Wjbn9 > .chat-box-content_2C5UJ > .viewport_1F0WI")
                .forEach((viewport) => viewport.scrollTo(0, viewport.scrollTopMax));
        }
    }
}