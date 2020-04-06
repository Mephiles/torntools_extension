window.addEventListener('load', (event) => {
    console.log("TT - Job | Achievements");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "torndata"], function(data) {
        const settings = data.settings;
        const show_achievements = settings.achievements.show;
        const show_completed = settings.achievements.show_completed;
        const userdata = data.userdata;
        const honors = data.torndata.honors;
        const medals = data.torndata.medals;
        const date = data.userdata.date;
        
        console.log("USERDATA", data.userdata);
        //console.log("TORNDATA", data.torndata);

        if(!show_achievements)
            return
        
        // object of all the achievements on this page
        var achievements = {
            "Intelligence": {
                "stats": userdata.intelligence,
                "keyword": "intelligence",
                "ach": []
            },
            "Manual": {
                "stats": userdata.manual_labor,
                "keyword": "manual",
                "ach": []
            },
            "Endurance": {
                "stats": userdata.endurance,
                "keyword": "endurance",
                "ach": [],
                "incl": ["attain"]
            }
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