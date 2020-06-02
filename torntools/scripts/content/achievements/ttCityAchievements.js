navbarLoaded().then(function(){
    console.log("TT - City | Achievements");

    let show_completed = settings.achievements.completed;
    let personalstats = userdata.personalstats;

    if(!settings.achievements.show)
        return;

    // object of all the achievements on this page
    let achievements = {
        "City finds": {
            "stats": personalstats.cityfinds,
            "keyword": "city",
            "incl": ["find", "items"]
        },
        "Dump finds": {
            "stats": personalstats.dumpfinds,
            "keyword": "dump",
            "incl": ["find"]
        }
    }

    displayAchievements(achievements, show_completed);
});