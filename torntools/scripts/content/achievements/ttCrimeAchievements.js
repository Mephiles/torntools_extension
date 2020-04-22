window.addEventListener('load', async(event) => {
    console.log("TT - Crime | Achievements");

    if(await flying())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        let show_completed = settings.achievements.show_completed;
        let crimes = userdata.criminalrecord;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Theft": {
                "stats": crimes.theft,
                "keyword": "theft",
                "excl": ["auto"]
            },
            "Drug Dealing": {
                "stats": crimes.drug_deals,
                "keyword": "drug dealing"
            },
            "Computer": {
                "stats": crimes.computer_crimes,
                "keyword": "computer"
            },
            "Murder": {
                "stats": crimes.murder,
                "keyword": "murder"
            },
            "Auto theft": {
                "stats": crimes.auto_theft,
                "keyword": "theft",
                "incl": ["auto"]
            },
            "Fraud": {
                "stats": crimes.fraud_crimes,
                "keyword": "fraud"
            },
            "Other": {
                "stats": crimes.other,
                "keyword": "other crimes"
            },
            "Total": {
                "stats": crimes.total,
                "keyword": "criminal offences"
            },
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});