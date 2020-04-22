window.addEventListener('load', async (event) => {
    console.log("TT - Jail | Achievements");

    if(await flying())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        let show_completed = settings.achievements.show_completed;
        let personalstats = userdata.personalstats;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Busts": {
                "stats": personalstats.peoplebusted,
                "keyword": "bust"
            },
            "Bails": {
                "stats": personalstats.peoplebought,
                "keyword": "bails"
            }
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});