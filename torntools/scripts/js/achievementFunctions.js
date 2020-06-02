console.log("Loading Achievement Functions");

function displayAchievements(achievements, show_completed){
    let awards_section = navbar.new_section("Awards", {next_element_heading: "Lists"});
    console.log(achievements);
    
    addTimeToHeader(awards_section, torndata.date);
    createAchievementTooltip();
    achievements = fillGoals(achievements, torndata);
    
    // add achievements to awards section
    for(let name in achievements){
        let current_stat = achievements[name].stats || 0;
        let next_goal = undefined;

        if(achievements[name].extra != "###")
            next_goal = getNextGoal(current_stat, achievements[name].goals);

        if(next_goal == "completed" && !show_completed)
            continue;

        let achievement_text, new_cell;
        if(next_goal == "completed"){
            achievement_text = `${name}: Completed!`;
            new_cell = navbar.new_cell(achievement_text, {parent_element: awards_section, href:"#", style: `color: #11c511`});
        } else {
            if(achievements[name].extra == "###")
                achievement_text = `${name}: ${numberWithCommas(current_stat)}`;
            else
                achievement_text = `${name}: ${numberWithCommas(current_stat)}/${numberWithCommas(next_goal)}`;
            
            new_cell = navbar.new_cell(achievement_text, {parent_element: awards_section, href:"#"});
        }

        if(achievements[name].extra != "###"){
            new_cell.setAttribute("info", `Goals: ${achievements[name].goals.map(x => " "+numberWithCommas(x))}\n Your score: ${numberWithCommas(current_stat)}`);
            addTooltip(new_cell);
        }
    }

    // if no content
    if(doc.findAll(".tt-nav-section div.tt-title+div *").length == 0){
        awards_section.style.display = "none";
    }
    
}

function addTimeToHeader(section, date){
    let span = doc.new("span");
        span.setClass("tt-awards-time");
        span.setAttribute("seconds", (new Date() - Date.parse(date))/1000);
        span.innerText = time_ago(Date.parse(date));

    section.find("div.tt-title").appendChild(span);

    // increment time
    let time_increase = setInterval(function(){
        let time_span = doc.find(".tt-awards-time");

        let seconds = parseInt(time_span.getAttribute("seconds"));
        let new_time = time_ago(new Date() - (seconds+1)*1000);

        time_span.innerText = new_time;
        time_span.setAttribute("seconds", seconds+1);
    }, 1000);
}

function getNextGoal(stat, achievements){
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

function fillGoals(achievements, torndata){
    for(let name in achievements){
        if(achievements[name].extra == "###")
            continue;
            
        let keyword = achievements[name].keyword;
        let inclusions = achievements[name].incl || [];
        let exclusions = achievements[name].excl || [];

        for(let type of [torndata.honors, torndata.medals]){  // loop through honors and medals
            for(let key in type){
                let desc = type[key].description.toLowerCase();

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
                        continue;

                    // get goal
                    desc = desc.split("for at least")[0];  // remove 'day' numbers from networth
                    desc = desc.replace(/\D/g,'');  // replace all non-numbers
                    let goal = parseInt(desc);

                    if(!achievements[name].goals){
                        achievements[name].goals = [];
                        achievements[name].goals.push(goal);
                    } else if(!achievements[name].goals.includes(goal) && !isNaN(goal)){
                        achievements[name].goals.push(goal);
                    }
                }
            }
        }
    }
    return achievements;
}

function createAchievementTooltip(){
    // create tooltip
    let div = doc.new("div");
    let arrow = doc.new("div");
    let text = doc.new("div");

    div.setClass("tt-ach-tooltip");
    arrow.setClass("tt-ach-tooltip-arrow");
    text.setClass("tt-ach-tooltip-text");

    div.appendChild(arrow);
    div.appendChild(text);
    doc.querySelector("body").appendChild(div);
}

function addTooltip(cell){
    cell.addEventListener("mouseenter", function(event){
        let position = event.target.getBoundingClientRect();

        let tooltip = doc.find(".tt-ach-tooltip");
        tooltip.style.left = String(position.x + 172+7) + "px";
        tooltip.style.top = String(position.y + Math.abs(document.body.getBoundingClientRect().y)+6) + "px";
        tooltip.style.display = "block";
        tooltip.find(".tt-ach-tooltip-text").innerText = event.target.getAttribute("info");
    });

    cell.addEventListener("mouseleave", function(){
        doc.find(".tt-ach-tooltip").style.display = "none";
    });
}

function getDonations(){
    return parseInt(doc.find("#church-donate .desc").innerText.split("donated")[1].split("to")[0].trim().replace(/,/g, "").replace("$", ""));
}