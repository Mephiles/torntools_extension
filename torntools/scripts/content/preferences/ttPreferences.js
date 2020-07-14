window.addEventListener("load", function(){
    console.log("TT - Preferences");

    let settings_container = content.new_container("TornTools - Settings", {header_only: true, all_rounded: true, _class: "m-top10"});

    let settings_link = doc.new({type: "div", class: "in-title tt-torn-button", text: "Preferences"});
    settings_container.find(".tt-options").appendChild(settings_link);

    settings_link.onclick = function(){
        // chrome.tabs.create({url: chrome.runtime.getURL("views/settings/settings.html")});
        // window.location.href = ;
        window.open(chrome.runtime.getURL("views/settings/settings.html"));
    }
});