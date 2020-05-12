window.addEventListener('load', async (event) => {
    console.log("TT - Job | Achievements");

    if(await flying() || await abroad())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        const show_completed = settings.achievements.completed;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Intelligence": {
                "stats": userdata.intelligence,
                "keyword": "intelligence"
            },
            "Manual": {
                "stats": userdata.manual_labor,
                "keyword": "manual"
            },
            "Endurance": {
                "stats": userdata.endurance,
                "keyword": "endurance",
                "incl": ["attain"]
            }
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});