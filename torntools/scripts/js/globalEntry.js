console.log("TT - Loading global entry.")

let mobile = false;
let page_status;

function mobileChecker() {
    return new Promise((resolve) => {
        if (!window.location.host.includes("torn") || getCurrentPage() === "api") {
            resolve(false);
            return
        }

        let checker = setInterval(function () {
            if (doc.find(".header-menu-icon")) {
                const display = getComputedStyle(doc.find(".header-menu-icon")).display;
                if (display === "none") {
                    resolve(false);
                    return clearInterval(checker);
                } else if(display === "inline-block") {
                    resolve(true);
                    return clearInterval(checker);
                }
            }

            if (doc.find("#top-page-links-list")) {
                let events_icon = doc.find("#top-page-links-list a[role='button'][aria-labelledby='events']");
                if (window.getComputedStyle(events_icon, ":before").getPropertyValue("content") === "") {
                    resolve(true);
                    return clearInterval(checker);
                } else {
                    resolve(false);
                    return clearInterval(checker);
                }
            }

            if (!doc.find(`.sidebar___BizFX`)) return;
            if (doc.find(`.sidebar___BizFX`).classList.contains("mobile")) {
                resolve(true);
                return clearInterval(checker);
            } else {
                resolve(false);
                return clearInterval(checker);
            }
        });
    });
}

requireDatabase(false).then(async () => {
    // Align left
    document.documentElement.style.setProperty("--torntools-align-left", settings.pages.global.align_left ? "20px" : "auto");

    // Upgrade button
    document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hide_upgrade ? "none" : "block");
    if (["home"].includes(getCurrentPage())) {
        document.documentElement.style.setProperty("--torntools-hide-upgrade-info", settings.pages.global.hide_upgrade ? "none" : "block");
    }

    // Hide Doctorn
    if ((settings.force_tt && ["home", "city", "travelagency", "war", "items", "crimes", "gym", "bounties", "profile", "faction", "jail"].includes(getCurrentPage()))) {
        document.documentElement.style.setProperty("--torntools-hide-doctorn", "none");
    }

    // Hide icons
    for (let icon of hide_icons) {
        document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, 'none');
    }

    // Hide chats
    document.documentElement.style.setProperty(`--torntools-hide-chat`, settings.pages.global.hide_chat ? "none" : "block");

    // Clean Flight page
    document.documentElement.style.setProperty("--torntools-clean-flight-display", settings.clean_flight ? "none" : "block");

    // Chat font size
    document.documentElement.style.setProperty("--torntools-chat-font-size", settings.font_size || "12px");

    // Mobile
    mobile = await mobileChecker();
    console.log("Using mobile:", mobile);

    // Page status
    page_status = await getPageStatus();
    console.log("Page Status:", page_status);

    database_status = DATABASE_STATUSES.ENTRY;
});