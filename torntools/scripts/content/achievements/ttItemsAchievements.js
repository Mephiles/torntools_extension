window.addEventListener('load', (event) => {
    console.log("TT - Items | Achievements");

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
            "Cannabis": {
                "stats": personalstats.cantaken,
                "keyword": "cannabis",
                "ach": [],
                "incl": ["use"]
            },
            "Ecstasy": {
                "stats": personalstats.exttaken,
                "keyword": "ecstasy",
                "ach": []
            },
            "Ketamine": {
                "stats": personalstats.kettaken,
                "keyword": "ketamine",
                "ach": []
            },
            "LSD": {
                "stats": personalstats.lsdtaken,
                "keyword": "lsd",
                "ach": []
            },
            "Opium": {
                "stats": personalstats.opitaken,
                "keyword": "opium",
                "ach": []
            },
            "Shrooms": {
                "stats": personalstats.shrtaken,
                "keyword": "shrooms",
                "ach": []
            },
            "Speed": {
                "stats": personalstats.spetaken,
                "keyword": "speed",
                "ach": [],
                "excl": ["gain"]
            },
            "PCP": {
                "stats": personalstats.pcptaken,
                "keyword": "pcp",
                "ach": []
            },
            "Xanax": {
                "stats": personalstats.xantaken,
                "keyword": "xanax",
                "ach": []
            },
            "Vicodin": {
                "stats": personalstats.victaken,
                "keyword": "vicodin",
                "ach": []
            },
            "Viruses": {
                "stats": personalstats.virusescoded,
                "keyword": "viruses",
                "ach": []
            },
            "Fill blood": {
                "stats": personalstats.bloodwithdrawn,
                "keyword": "blood",
                "ach": [],
                "incl": ["fill"]
            },
            "Items dumped": {
                "stats": personalstats.itemsdumped,
                "keyword": "items",
                "ach": [],
                "incl": ["trash"]
            },
            "Alcohol": {
                "stats": personalstats.alcoholused,
                "keyword": "alcohol",
                "ach": []
            },
            "Candy": {
                "stats": personalstats.candyused,
                "keyword": "candy",
                "ach": []
            },
            "Medical items used": {
                "stats": personalstats.medicalitemsused,
                "keyword": "medical items",
                "ach": [],
                "incl": ["use"]
            },
            "Energy drinks used": {
                "stats": personalstats.energydrinkused,
                "keyword": "energy drink",
                "ach": []
            },
            "Bazaar customers": {
                "stats": personalstats.bazaarcustomers,
                "keyword": "customers",
                "ach": []
            },
            "Points sold": {
                "stats": personalstats.pointssold,
                "keyword": "points",
                "ach": [],
                "incl": ["market"]
            },
            "Stock payouts": {
                "stats": personalstats.stockpayouts,
                "keyword": "payouts",
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