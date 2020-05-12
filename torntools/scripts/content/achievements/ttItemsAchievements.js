window.addEventListener('load', async (event) => {
    console.log("TT - Items | Achievements");

    if(await flying() || await abroad())
        return;

    local_storage.get(["settings", "userdata", "torndata"], function([settings, userdata, torndata]) {
        let show_completed = settings.achievements.completed;
        let personalstats = userdata.personalstats;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Cannabis": {
                "stats": personalstats.cantaken,
                "keyword": "cannabis",
                "incl": ["use"]
            },
            "Ecstasy": {
                "stats": personalstats.exttaken,
                "keyword": "ecstasy"
            },
            "Ketamine": {
                "stats": personalstats.kettaken,
                "keyword": "ketamine"
            },
            "LSD": {
                "stats": personalstats.lsdtaken,
                "keyword": "lsd"
            },
            "Opium": {
                "stats": personalstats.opitaken,
                "keyword": "opium",
            },
            "Shrooms": {
                "stats": personalstats.shrtaken,
                "keyword": "shrooms",
            },
            "Speed": {
                "stats": personalstats.spetaken,
                "keyword": "speed",
                "excl": ["gain"]
            },
            "PCP": {
                "stats": personalstats.pcptaken,
                "keyword": "pcp"
            },
            "Xanax": {
                "stats": personalstats.xantaken,
                "keyword": "xanax"
            },
            "Vicodin": {
                "stats": personalstats.victaken,
                "keyword": "vicodin"
            },
            "Viruses": {
                "stats": personalstats.virusescoded,
                "keyword": "viruses"
            },
            "Fill blood": {
                "stats": personalstats.bloodwithdrawn,
                "keyword": "blood",
                "incl": ["fill"]
            },
            "Items dumped": {
                "stats": personalstats.itemsdumped,
                "keyword": "items",
                "incl": ["trash"]
            },
            "Alcohol": {
                "stats": personalstats.alcoholused,
                "keyword": "alcohol"
            },
            "Candy": {
                "stats": personalstats.candyused,
                "keyword": "candy"
            },
            "Medical items used": {
                "stats": personalstats.medicalitemsused,
                "keyword": "medical items",
                "incl": ["use"]
            },
            "Energy drinks used": {
                "stats": personalstats.energydrinkused,
                "keyword": "energy drink"
            },
            "Bazaar customers": {
                "stats": personalstats.bazaarcustomers,
                "keyword": "customers"
            },
            "Points sold": {
                "stats": personalstats.pointssold,
                "keyword": "points",
                "incl": ["market"]
            },
            "Stock payouts": {
                "stats": personalstats.stockpayouts,
                "keyword": "payouts"
            }
        }

        displayAchievements(achievements, show_completed, torndata);
    });
});