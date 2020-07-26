DBloaded().then(function(){
    requireNavbar().then(function(){
        console.log("TT - Racing | Achievements");
        
        let show_completed = settings.achievements.completed;
        let personalstats = userdata.personalstats;

        if(!settings.achievements.show)
            return;
        
        // object of all the achievements on this page
        let achievements = {
            "Races won": {
                "stats": personalstats.raceswon,
                "keyword": "races",
                "incl": ["win"],
                "excl": ["single car"]
            },
            "Skill": {
                "stats": personalstats.racingskill,
                "keyword": "skill",
                "incl": ["racing"]
            },
            "Points": {
                "stats": personalstats.racingpointsearned,
                "keyword": "points",
                "incl": ["racing"]
            }
        }

        displayAchievements(achievements, show_completed);
    });
});