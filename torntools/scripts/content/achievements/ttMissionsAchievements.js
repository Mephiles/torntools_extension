window.addEventListener('load', (event) => {
    console.log("TT - Missions | Achievements");

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
            "Attacks won": {
                "stats": personalstats.attackswon,
                "keyword": "attacks",
                "ach": [],
                "incl": ["win"]
            },
            "Defends won": {
                "stats": personalstats.defendswon,
                "keyword": "defend",
                "ach": [],
                "excl": ["achieve", "someone", "and"]
            },
            "Assists": {
                "stats": personalstats.attacksassisted,
                "keyword": "assist",
                "incl": ["attacks"],
                "ach": [1]
            },
            "Stealthed": {
                "stats": personalstats.attacksstealthed,
                "keyword": "stealthed attacks",
                "ach": []
            },
            "Stalemates": {
                "stats": personalstats.defendsstalemated,
                "keyword": "stalemate",
                "ach": []
            },
            "Escapes": {
                "stats": personalstats.yourunaway,
                "keyword": "escape",
                "ach": [],
                "incl": ["successfully", "foes"]
            },
            "Unarmored wins": {
                "stats": personalstats.unarmoredwon,
                "keyword": "unarmored",
                "ach": []
            },
            "Current killstreak": {
                "stats": personalstats.killstreak,
                "keyword": "",
                "ach": [],
                "extra": "###"
            },
            "Best streak": {
                "stats": personalstats.bestkillstreak,
                "keyword": "streak",
                "ach": [],
                "excl": ["high-low"]
            },
            "Total hits": {
                "stats": personalstats.attackhits,
                "keyword": "hits",
                "ach": [],
                "excl": ["critical", "finishing"]
            },
            "Critical hits": {
                "stats": personalstats.attackcriticalhits,
                "keyword": "critical",
                "ach": []
            },
            "Best damage": {
                "stats": personalstats.bestdamage,
                "keyword": "damage",
                "ach": [],
                "incl": ["deal at least"]
            },
            "One hit kills": {
                "stats": personalstats.onehitkills,
                "keyword": "one hit",
                "ach": [],
                "incl": ["kills"]
            },
            "Rounds fired": {
                "stats": personalstats.roundsfired,
                "keyword": "rounds",
                "ach": [],
                "incl": ["fire"]
            },
            "Clubbing hits": {
                "stats": personalstats.axehits,
                "keyword": "clubbing",
                "ach": []
            },
            "Pistol hits": {
                "stats": personalstats.pishits,
                "keyword": "pistols",
                "ach": []
            },
            "Rifle hits": {
                "stats": personalstats.rifhits,
                "keyword": "rifles",
                "ach": []
            },
            "Shotgun hits": {
                "stats": personalstats.shohits,
                "keyword": "shotguns",
                "ach": []
            },
            "Piercing hits": {
                "stats": personalstats.piehits,
                "keyword": "piercing",
                "ach": []
            },
            "Slashing hits": {
                "stats": personalstats.slahits,
                "keyword": "slashing",
                "ach": []
            },
            "Heavy hits": {
                "stats": personalstats.heahits,
                "keyword": "heavy artillery",
                "ach": []
            },
            "SMG hits": {
                "stats": personalstats.smghits,
                "keyword": "smgs",
                "ach": []
            },
            "Machine gun hits": {
                "stats": personalstats.machits,
                "keyword": "machine guns",
                "ach": [],
                "incl": ["guns"]
            },
            "Fists or kick hits": {
                "stats": personalstats.h2hhits,
                "keyword": "fists or kick",
                "ach": []
            },
            "Mechanical hits": {
                "stats": personalstats.chahits,
                "keyword": "mechanical weapons",
                "ach": []
            },
            "Temporary hits": {
                "stats": personalstats.grehits,
                "keyword": "temporary weapons",
                "ach": []
            },
            "Largest mug": {
                "stats": personalstats.largestmug,
                "keyword": "mugging",
                "ach": [],
                "incl": ["make", "single"]
            },
            "Mission credits": {
                "stats": personalstats.missioncreditsearned,
                "keyword": "credits",
                "ach": [],
                "incl": ["mission"]
            },
            "Contracts": {
                "stats": personalstats.contractscompleted,
                "keyword": "contracts",
                "ach": []
            },
            "Bounties collected": {
                "stats": personalstats.bountiescollected,
                "keyword": "bounties",
                "ach": [],
                "incl": ["collect"]
            },
            "Bounties collected (money)": {
                "stats": personalstats.totalbountyreward,
                "keyword": "bounty",
                "ach": [],
                "incl": ["earn", "hunting"]
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

