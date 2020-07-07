navbarLoaded().then(function(){
    console.log("TT - Gym | Achievements");
    
    let show_completed = settings.achievements.completed;

    if(!settings.achievements.show) return;
    
    // object of all the achievements on this page
    let achievements = {
        "Strength": {
            "stats": parseInt(userdata.strength.replace(/,/g, "")),
            "keyword": "strength",
            "incl": ["gain"]
        },
        "Speed": {
            "stats": parseInt(userdata.speed.replace(/,/g, "")),
            "keyword": "speed",
            "incl": ["gain"]
        },
        "Defense": {
            "stats": parseInt(userdata.defense.replace(/,/g, "")),
            "keyword": "defense",
            "incl": ["gain"]
        },
        "Dexterity": {
            "stats": parseInt(userdata.dexterity.replace(/,/g, "")),
            "keyword": "dexterity",
            "incl": ["gain"]
        },
        "Total": {
            "stats": parseInt(userdata.total.replace(/,/g, "")),
            "keyword": "total stats"
        },
    }

    displayAchievements(achievements, show_completed);
});