window.onload = window.onload.extend(function(){
    console.log("TT - Jail | Achievements");

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
            "Busts": {
                "stats": personalstats.peoplebusted,
                "keyword": "bust",
                "ach": []
            },
            "Bails": {
                "stats": personalstats.peoplebought,
                "keyword": "bails",
                "ach": []
            }
        }

        displayAchievements(achievements, show_completed, honors, medals, date);
    });
});

function displayAchievements(achievements, show_completed, honors, medals, date){
    let achievements_window = createWindow(date);
    let filled_achievements = fillAchievements(achievements, honors, medals);

    // add achievement rows to window
    for(let key in filled_achievements){
        let name = key;
        let stat = filled_achievements[key].stats || 0;
        let goal = getGoal(stat, filled_achievements[key].ach);

        if(goal == "completed" && !show_completed)
            continue;

        let row = document.createElement("div");
            row.setAttribute("class", "area-desktop___2YU-q");
            row.style.cursor = "default";
        let row_inner = document.createElement("div");
            row_inner.setAttribute("class", "area-row___34mEZ");
            row_inner.setAttribute("style", "line-height: 23px; min-height: 25px;");
            row_inner.style.cursor = "default";
        let a = document.createElement("a");
            a.setAttribute("class", "desktopLink___2dcWC");
            a.style.cursor = "default";
        let span = document.createElement("span");

        let status = getStatus();
        if(status == "hospital")
            row.classList.add("in-hospital___2RRIG");
        else if(status == "jail")
            row.classList.add("in-jail___3XdP8");

        if(goal != "completed"){
            span.innerText = `${name}: ${numberWithCommas(stat)}/${numberWithCommas(goal)}`;
        } else {
            span.innerText = `${name}: Completed!`;
            span.style.color = "#11c511"
        }

        a.appendChild(span);
        row_inner.appendChild(a);
        row.appendChild(row_inner);
        achievements_window.appendChild(row);
    }

    // FUNCTIONS
    function createWindow(date){
        // find slot
        const sidebar = document.querySelector("#sidebar");  // left nav panel
        const areas_container = findAreas(sidebar);
    
        // new sidebar block
        let tt_block = document.createElement("div");
        tt_block.setAttribute("class", "sidebar-block___1Cqc2");
            let tt_content = document.createElement("div");
            tt_content.setAttribute("class", "content___kMC8x");
                let tt_areas = document.createElement("div");
                tt_areas.setAttribute("class", "areas___2pu_3");
                    let tt_toggle_block = document.createElement("div");
                    tt_toggle_block.setAttribute("class", "toggle-block___13zU2");
                        let tt_header = document.createElement("h2");
                        tt_header.setAttribute("class", "header___30pTh desktop___vemcY");
                        tt_header.innerText = "TT - Awards";
    
                        let tt_header_time = document.createElement("span");
                        tt_header_time.setAttribute("style", `
                            font-size: 10px;
                            color: orange;
                            margin-left: 10px;
                        `);
                        tt_header_time.innerText = time_ago(Date.parse(date));
    
                        let tt_toggle_content = document.createElement("div");
                        tt_toggle_content.setAttribute("class", "toggle-content___3XKOC");
    
        // check for hospital and jail status
        let status = getStatus();
    
        if(status == "hospital")
            tt_header.classList.add("in-hospital___2RRIG");
        else if(status == "jail")
            tt_header.classList.add("in-jail___3XdP8");
        
        // append new elements
        tt_header.appendChild(tt_header_time);
        tt_toggle_block.appendChild(tt_header);
        tt_toggle_block.appendChild(tt_toggle_content);
        tt_areas.appendChild(tt_toggle_block);
        tt_content.appendChild(tt_areas);
        tt_block.appendChild(tt_content);
    
        areas_container.parentElement.insertBefore(tt_block, areas_container.nextElementSibling);
        
        return tt_toggle_content;
    }
    function fillAchievements(achievements, honors, medals){

        console.log("ACHIVEMENTS 1", achievements);
    
        // fill achievements
        for(let key in achievements){
            let keyword = achievements[key].keyword;
            let inclusions = achievements[key].incl || [];
            let exclusions = achievements[key].excl || [];
    
            // loop through honors
            for(let in_key in honors){
                let desc = honors[in_key].description.toLowerCase();
                if(desc.indexOf(keyword) > -1){  // keyword is present in desc.
                    let includes = inclusions.length == 0 ? true : false;
                    let excludes = exclusions.length == 0 ? true : false;

                    // check for inclusions and exclusions
                    for(let incl of inclusions){
                        if(desc.indexOf(incl) > -1)
                            includes = true;
                        else
                            includes = false;
                    }
                    for(let excl of exclusions){
                        if(desc.indexOf(excl) == -1)
                            excludes = true;
                        else
                            excludes = false;
                    }

                    if(!(includes && excludes))
                        continue

                    desc = desc.replace(/\D/g,'');  // replace all non-numbers
                    let stat = parseInt(desc);
    
                    if(!achievements[key].ach.includes(stat)){
                        achievements[key].ach.push(stat);
                    }
                }
            }
    
            // loop through medals
            for(let in_key in medals){
                let desc = medals[in_key].description.toLowerCase();
                if(desc.indexOf(keyword) > -1){  // keyword is present in desc.
                    let includes = inclusions.length == 0 ? true : false;
                    let excludes = exclusions.length == 0 ? true : false;

                    // check for inclusions and exclusions
                    for(let incl of inclusions){
                        if(desc.indexOf(incl) > -1)
                            includes = true;
                        else
                            includes = false;
                    }
                    for(let excl of exclusions){
                        if(desc.indexOf(excl) == -1)
                            excludes = true;
                        else
                            excludes = false;
                    }

                    if(!(includes && excludes))
                        continue
                    
                    desc = desc.replace(/\D/g,'');  // replace all non-numbers
                    let stat = parseInt(desc);
    
                    if(!achievements[key].ach.includes(stat)){
                        achievements[key].ach.push(stat);
                    }
                }
            }
        }
    
        console.log("ACHIVEMENTS 2", achievements);
        return achievements;
    }
    function getGoal(stat, achievements){
        let goal;
    
        achievements = achievements.sort(function(a, b){return a-b});
    
        for(let ach of achievements){
            if(ach > stat){
                goal = ach;
                break;
            }
        }
        
        if(!goal)
            goal = "completed";
        
        return goal;
    }
    function findAreas(sidebar){
        let headers = sidebar.querySelectorAll(".header___30pTh");
        for(let header of headers){
            if(header.innerText == "Areas"){
                return header.parentElement.parentElement.parentElement.parentElement;
            }
        }
    }
    function time_ago(time) {

        switch (typeof time) {
            case 'number':
                break;
            case 'string':
                time = +new Date(time);
                break;
            case 'object':
                if (time.constructor === Date) time = time.getTime();
                break;
            default:
                time = +new Date();
        }
        var time_formats = [
            [60, 'seconds', 1], // 60
            [120, '1 minute ago', '1 minute from now'], // 60*2
            [3600, 'minutes', 60], // 60*60, 60
            [7200, '1 hour ago', '1 hour from now'], // 60*60*2
            [86400, 'hours', 3600], // 60*60*24, 60*60
            [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
            [604800, 'days', 86400], // 60*60*24*7, 60*60*24
            [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
            [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
            [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
            [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
            [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
            [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
            [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
            [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
        ];
        var seconds = (+new Date() - time) / 1000,
            token = 'ago',
            list_choice = 1;
    
        if (seconds == 0) {
            return 'Just now'
        }
        if (seconds < 0) {
            seconds = Math.abs(seconds);
            token = 'from now';
            list_choice = 2;
        }
        var i = 0,
            format;
        while (format = time_formats[i++])
            if (seconds < format[0]) {
                if (typeof format[2] == 'string')
                    return format[list_choice];
                else
                    return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
            }
        return time;
    }
    function getStatus(){
        let hdr = document.querySelector("h2.header___30pTh");
        
        for(let class_ of hdr.classList){
            if(class_.indexOf("hospital") > -1){
                return "hospital";
            } else if (class_.indexOf("in-jail") > -1){
                return "jail";
            }
        }
        return "okay";
    }
    function numberWithCommas(x) {
        if(x > 1e6){
            let mil = (x/1e6).toFixed(2) + "mil"
            if(parseFloat(mil)%1 == 0)
                mil = parseInt(mil) + "mil";
            return mil;
        }
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

function flying() {
	try {	
		if(document.querySelector("#skip-to-content").innerText === "Traveling"){
			console.log("TT - User Flying");
			return true
		}
	} catch(err) {}
	return false
}

function hours(x) {
	return Math.floor(x / 60 / 60); // seconds, minutes
}