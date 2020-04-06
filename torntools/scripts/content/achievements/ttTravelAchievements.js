window.addEventListener('load', (event) => {
    console.log("TT - Travel | Achievements");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "torndata"], function(data) {
        const settings = data.settings;
        const show_achievements = settings.achievements.show;
        const show_completed = settings.achievements.show_completed;
        const personalstats = data.userdata.personalstats;
        const honors = data.torndata.honors;
        const medals = data.torndata.medals;
        const date = data.userdata.date;
        
        console.log("USERDATA", data.userdata);
        //console.log("TORNDATA", data.torndata);

        if(!show_achievements)
            return
        
        // object of all the achievements on this page
        var achievements = {
            "Argentina": {
                "stats": personalstats.argtravel, 
                "keyword": "argentina",
                "ach": []
            },
            "Canada": {
                "stats": personalstats.cantravel,
                "keyword": "canada",
                "ach": []
            },
            "Cayman": {
                "stats": personalstats.caytravel,
                "keyword": "cayman",
                "ach": []
            },
            "China": {
                "stats": personalstats.chitravel,
                "keyword": "china",
                "ach": []
            },
            "Dubai": {
                "stats": personalstats.dubtravel,
                "keyword": "dubai",
                "ach": []
            },
            "Hawaii": {
                "stats": personalstats.hawtravel,
                "keyword": "hawaii",
                "ach": []
            },
            "Japan": {
                "stats": personalstats.japtravel,
                "keyword": "japan",
                "ach": []
            },
            "UK": {
                "stats": personalstats.lontravel,
                "keyword": "kingdom",
                "ach": []
            },
            "Mexico": {
                "stats": personalstats.mextravel,
                "keyword": "mexico",
                "ach": []
            },
            "South Africa": {
                stats: personalstats.soutravel,
                "keyword": "south africa",
                "ach": []
            },
            "Switzerland": {
                "stats": personalstats.switravel,
                "keyword": "switzerland",
                "ach": []
            },
            "Total": {
                "stats": personalstats.traveltimes,
                "keyword": "travel",
                "ach": [], 
                "excl": ["to"]
            },
            "Time (days)": {
                "stats": days(personalstats.traveltime),
                "keyword": "spend",
                "ach": [], 
                "incl": ["days", "air"]
            },
            "Items bought abroad": {
                "stats": personalstats.itemsboughtabroad,
                "keyword": "import",
                "ach": [],
                "incl": ["items"]
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