window.addEventListener('load', async (event) => {
    console.log("TT - Church | Achievements");

    if(await flying() || await abroad())
        return;

    local_storage.get(["settings", "torndata"], function([settings, torndata]) {
        let show_completed = settings.achievements.show_completed;

        if(!settings.achievements.show)
            return;

        // object of all the achievements on this page
        let achievements = {
            "Donations": {
                "stats": getDonations(),
                "keyword": "church"
            }
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});