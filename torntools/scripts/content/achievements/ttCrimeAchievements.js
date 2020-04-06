window.addEventListener('load', (event) => {
    console.log("TT - Crime | Achievements");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "torndata"], function(data) {
        const settings = data.settings;
        const show_achievements = settings.achievements.show;
        const show_completed = settings.achievements.show_completed;
        const crimes = data.userdata.criminalrecord;
        const honors = data.torndata.honors;
        const medals = data.torndata.medals;
        const date = data.userdata.date;
        
        console.log("USERDATA", data.userdata);
        //console.log("TORNDATA", data.torndata);

        if(!show_achievements)
            return
        
        // object of all the achievements on this page
        var achievements = {
            "Theft": {
                "stats": crimes.theft,
                "keyword": "theft",
                "ach": [],
                "excl": ["auto"]
            },
            "Drug Dealing": {
                "stats": crimes.drug_deals,
                "keyword": "drug dealing",
                "ach": []
            },
            "Computer": {
                "stats": crimes.computer_crimes,
                "keyword": "computer",
                "ach": []
            },
            "Murder": {
                "stats": crimes.murder,
                "keyword": "murder",
                "ach": []
            },
            "Auto theft": {
                "stats": crimes.auto_theft,
                "keyword": "theft",
                "ach": [],
                "incl": ["auto"]
            },
            "Fraud": {
                "stats": crimes.fraud_crimes,
                "keyword": "fraud",
                "ach": []
            },
            "Other": {
                "stats": crimes.other,
                "keyword": "other crimes",
                "ach": []
            },
            "Total": {
                "stats": crimes.total,
                "keyword": "criminal offences",
                "ach": []
            },
        }

        displayAchievements(achievements, show_completed, honors, medals, date);

        let time_increase = setInterval(function(){
            let seconds = parseInt(document.querySelector("#tt-awards-time").getAttribute("seconds"));
            let new_time = time_ago(new Date() - (seconds+1)*1000);

            document.querySelector("#tt-awards-time").innerText = new_time;
            document.querySelector("#tt-awards-time").setAttribute("seconds", seconds+1);
        }, 1000);
    });
});