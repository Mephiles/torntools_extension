
function displayAchievements(achievements, show_completed, honors, medals, date){
    let achievements_window = createWindow(date);
    let filled_achievements = fillAchievements(achievements, honors, medals);

    createAchievementTooltip();

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
            row_inner.setAttribute("style", "line-height: 25px; min-height: 25px;");
            row_inner.style.cursor = "default";
        let a = document.createElement("a");
            a.setAttribute("class", "desktopLink___2dcWC");
            a.setAttribute("info", `Goals: ${filled_achievements[key].ach.map(x => " "+numberWithCommas(x))}\n Your score: ${numberWithCommas(stat)}`);
            a.style.cursor = "default";
        let span = document.createElement("span");

        a.addEventListener("mouseenter", function(event){
            showAchievementTooltip(event.target.getAttribute("info"), event.target.getBoundingClientRect());
        });

        a.addEventListener("mouseleave", function(){
            hideAchievementTooltip();
        });

        let status = getStatus();
        if(status == "hospital")
            row.classList.add("in-hospital___2RRIG");
        else if(status == "jail")
            row.classList.add("in-jail___3XdP8");

        if(filled_achievements[key].extra === "###"){
            span.innerText = `${name}: ${numberWithCommas(stat)}`;
        } else if(goal != "completed"){
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
                        tt_header_time.id = "tt-awards-time";
                        tt_header_time.setAttribute("seconds", (new Date() - Date.parse(date))/1000);
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
        // fill achievements
        for(let key in achievements){
            if(achievements[key].extra == "###")
                continue
                
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
    
                    if(!achievements[key].ach.includes(stat) && !isNaN(stat)){
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
                    
                    desc = desc.split("for at least")[0];  // remove 'day' numbers from networth
                    desc = desc.replace(/\D/g,'');  // replace all non-numbers
                    let stat = parseInt(desc);
    
                    if(!achievements[key].ach.includes(stat)){
                        achievements[key].ach.push(stat);
                    }
                }
            }
        }
    
        console.log("ACHIVEMENTS", achievements);
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
    
}

function showAchievementTooltip(text, position){
    let tt_ach_tooltip = document.querySelector("#tt-ach-tooltip");
    tt_ach_tooltip.setAttribute("style", `
        position: absolute;
        display: block;
        z-index: 999999;
        left: ${String(position.x + 172+7) + "px"};
        top: ${String(position.y + Math.abs(document.body.getBoundingClientRect().y)+6) + "px"};
    `);

    document.querySelector("#tt-ach-tooltip-text").innerText = text;
}

function hideAchievementTooltip(){
    document.querySelector("#tt-ach-tooltip").style.display = "none";
}

function createAchievementTooltip(){
    let div = document.createElement("div");
    let arrow = document.createElement("div");
    let text = document.createElement("div");

    div.id = "tt-ach-tooltip";
    arrow.id = "tt-ach-tooltip-arrow";
    text.id = "tt-ach-tooltip-text";

    div.appendChild(arrow);
    div.appendChild(text);
    document.querySelector("body").appendChild(div);
}

function getDonations(){
    return parseInt(document.querySelector("#church-donate .desc").innerText.split("donated")[1].split("to")[0].trim().replace(/,/g, "").replace("$", ""));
}