window.addEventListener('load', async (event) => {
    if(await flying() || await abroad())
        return;

    local_storage.get(["updated", "settings"], function([updated, settings]){
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

        // showColorCodes();
    })
});


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