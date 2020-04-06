window.addEventListener('load', (event) => {
    console.log("TT - Home | Achievements");

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
        
        //console.log("USERDATA", data.userdata);
        //console.log("TORNDATA", data.torndata);

        if(!show_achievements)
            return

        // gather all perks
        const perks = 
            data.userdata.company_perks.length+
            data.userdata.education_perks.length+
            data.userdata.enhancer_perks.length+
            data.userdata.faction_perks.length+
            data.userdata.job_perks.length+
            data.userdata.merit_perks.length+
            data.userdata.property_perks.length+
            data.userdata.stock_perks.length
        
        
        // object of all the achievements on this page
        var achievements = {
            "Perks": {
                "stats": perks,
                "keyword": "personal perks",
                "ach": []
            },
            "Awards": {
                "stats": personalstats.awards,
                "keyword": "total awards",
                "ach": []
            },
            "Married (days)": {
                "stats": data.userdata.married.duration,
                "keyword": "stay married",
                "ach": []
            },
            "Points sold": {
                "stats": personalstats.pointssold,
                "keyword": "points on the market",
                "ach": []
            },
            "Activity": {
                "stats": hours(personalstats.useractivity),
                "keyword": "activity",
                "ach": []
            },
            "Bazaar buyers": {
                "stats": personalstats.bazaarcustomers,
                "keyword": "customers buy from your bazaar",
                "ach": []
            },
            "Donator (days)": {
                "stats": personalstats.daysbeendonator,
                "keyword": "donator",
                "ach": []
            },
            "Energy refills": {
                "stats": personalstats.refills,
                "keyword": "refill",
                "ach": [],
                "incl": ["energy"]
            },
            "Nerve refills": {
                "stats": personalstats.nerverefills,
                "keyword": "refill",
                "ach": [],
                "incl": ["nerve"]
            },
            "Token refills": {
                "stats": personalstats.tokenrefills,
                "keyword": "refill",
                "ach": [],
                "incl": ["nerve"]
            },
            "Networth": {
                "stats": personalstats.networth,
                "keyword": "networth",
                "ach": []
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