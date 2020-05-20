window.addEventListener('load', async (event) => {
    console.log("TT - Hospital | Achievements");

    if(await flying() || await abroad())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        let show_completed = settings.achievements.completed;
        let personalstats = userdata.personalstats;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Revives": {
                "stats": personalstats.revives,
                "keyword": "revive",
                "excl": ["within"]
            }
        }

        displayAchievements(achievements, show_completed, torndata, settings.theme);
    });
});