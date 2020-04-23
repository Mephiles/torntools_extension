window.addEventListener('load', async (event) => {
    if(await flying() || await abroad())
        return;

    local_storage.get("updated", function(updated){
        if(updated){
            let version_text = `TornTools updated: ${chrome.runtime.getManifest().version}`;
            
            navbar.new_cell(version_text, {
                parent_heading: "Areas",
                first: true,
                style: `
                    background-color: #B8E28F;
                `,
                href: chrome.runtime.getURL("/views/settings.html")
            });
        }
    })
});