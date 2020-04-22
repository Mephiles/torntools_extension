window.addEventListener('load', async (event) => {
    console.log("TT - Faction | Achievements");

    if(await flying())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        let show_completed = settings.achievements.show_completed;
        let personalstats = userdata.personalstats;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Org. crimes": {
                "stats": personalstats.organisedcrimes,
                "keyword": "organized crimes"
            },
            "Respect": {
                "stats": personalstats.respectforfaction,
                "keyword": "respect",
                "incl": ["earn "]
            }
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});