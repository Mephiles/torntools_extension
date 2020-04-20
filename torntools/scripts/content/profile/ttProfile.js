window.addEventListener('load', (event) => {
    console.log("TT - Profile");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "allies", "target_list"], function(data) {
        const settings = data.settings;
        const show_profile = settings.pages.profile.show;
        const show_target = data.target_list.show;
        const user_faction = data.userdata.faction.faction_name;
        let allies = data.allies;

        profileLoaded().then(function(loaded){
            if(!loaded){
                console.log("Page not loaded");
                return;
            }

            displayCreator();

            if(show_profile)
                displayAlly(user_faction, allies);
            
            if(show_target)
                displayTargetInfo(data.target_list.targets);
        });
    });
});

function displayCreator(){
    let name = document.querySelector("#skip-to-content");

    if(name.innerText == "Mephiles' Profile"){
        let span1 = document.createElement("span");
        span1.innerText = " - Thanks for using ";
        span1.style.fontSize = "17px";
        span1.style.color = "#888888";

        let span2 = document.createElement("span");
        span2.innerText = "TornTools";
        span2.style.color = "#39a539";

        span1.appendChild(span2);
        name.appendChild(span1);
    }
}

function profileLoaded(){
    let promise = new Promise(function(resolve, reject){
        let counter = 0;
        let checker = setInterval(function(){
            if(document.querySelector(".basic-information ul.basic-list li")){
                resolve(true);
                return clearInterval(checker);
            } else if(counter > 10000){
                resolve(false);
                return clearInterval(checker);
            } else
                counter+=1;
        }, 100);
    });

    return promise.then(function(data){
        return data;
    });
}

function showWarning(type){
    let title = document.querySelector(".profile-left-wrapper .title-black");
    let msg;

    if(type == 'user')
        msg = "This user is in your faction!";
    else if(type == 'ally')
        msg = "This user is an ally!";
    
    let span = document.createElement("span");
    span.style.color = "#ff4040";
    span.style.float = "right";
    span.style.paddingRight = "7px";
    span.innerText = msg;

    title.appendChild(span);
}

function displayAlly(user_faction, allies){
    let profile_faction = document.querySelector(".basic-information ul.basic-list li:nth-of-type(3) div:nth-of-type(2)").innerText;

    if(user_faction == profile_faction){
        showWarning('user');
        return;
    }

    for(let ally of allies){
        if(ally.trim() == profile_faction){
            showWarning('ally');
            return;
        }
    }
}

function displayTargetInfo(targets){
    let user_id = getUserId();
    let div = document.createElement("div");
    div.setAttribute("class", "profile-wrapper m-top10");

        let title = document.createElement("div");
        title.setAttribute("class", "title-green top-round");
        title.innerText = "TornTools - Target Info"

            let inner_div = document.createElement("div");
            inner_div.setAttribute("class", "cont bottom-round");

            let inner_div2 = document.createElement("div");
            inner_div2.setAttribute("class", "profile-container bottom-round");
            inner_div2.style.overflow = "auto";
            inner_div2.style.borderBottom = "0";

                if(!targets[user_id]){
                    inner_div2.style.padding = "7px";
                    inner_div2.style.fontSize = "15px";
                    inner_div2.innerText = "No data on user."
                } else {
                    // let legend = document.createElement("div");
                    //     legend.setAttribute("class", "tt-table-legend");
                    // let info = [
                    //     {cls: "green", text: "Base respect based on leaves"},
                    //     {cls: "yellow", text: "Base respect based on other outcomes"},
                    //     {cls: "", marker: "*", text: "Not base respect"}
                    // ];

                    // for(let item of info){
                    //     let div = document.createElement("div");
                    //     let marker = document.createElement("div");
                    //         marker.setAttribute("class", "marker "+item.cls);
                    //         marker.innerText = item.marker || "";
                    //     let text = document.createElement("div");
                    //         text.setAttribute("class", "text");

                    //     text.innerText = item.text;

                    //     div.appendChild(marker);
                    //     div.appendChild(text);
                    //     legend.appendChild(div);
                    // }

                    let table = document.createElement("table");
                    table.setAttribute("class", "tt-table");
                    let headings = ["Win", "Mug", "Leave", "Hosp", "Arrest", "Special", "Assist", "Defend", "Lose", "Defend lose", "Stalemate", "Stealth", "Respect"];
                    let head_cls = ["good", "good", "good", "good", "good", "good", "good", "good", "new-section bad", "bad", "bad", "new-section neutral", "neutral"];
                    
                    let row_heading = document.createElement("row");
                    row_heading.setAttribute("class", "row header-row");
                    for(let heading of headings){
                        let item = document.createElement("div");
                        item.setAttribute("class", "item "+head_cls[headings.indexOf(heading)]);
                        item.innerText = heading;
                        row_heading.appendChild(item);
                    }

                    let row_data = document.createElement("row");
                    row_data.setAttribute("class", "row");
                    for(let heading of headings){
                        let item = document.createElement("div");
                        item.setAttribute("class", "item "+head_cls[headings.indexOf(heading)]);
                        heading = heading.toLowerCase().replace(" ", "_");

                        if(heading == "respect"){
                            let [value, color] = getRespect(targets, user_id);
                            item.innerText = value;
                            item.style.backgroundColor = color;
                        } else
                            item.innerText = targets[user_id][heading];

                        row_data.appendChild(item);
                    }

                    table.appendChild(row_heading);
                    table.appendChild(row_data);
                    // inner_div2.appendChild(legend);
                    inner_div2.appendChild(table);
                }

    inner_div.appendChild(inner_div2);
    div.appendChild(title);
    div.appendChild(inner_div);
    document.querySelector(".user-profile").insertBefore(div, document.querySelectorAll(".profile-wrapper")[1]);
}

function getUserId(){
    return document.querySelector(".basic-information ul.basic-list li:nth-of-type(1) div:nth-of-type(2)").innerText.split("[")[1].replace("]", "");
}

function getRespect(target_list, id){
    let respect_type = "respect";
    let respect_value;
    let color;

    for(let list in target_list[id]["respect_base"]){
        if(target_list[id]["respect_base"][list].length > 0){
            respect_type = "respect_base";
            break;
        }
    }

    let leaves = target_list[id][respect_type]["leave"].length > 0 ? true : false;

    if(leaves){
        respect_value = getAverage(target_list[id][respect_type]["leave"]);
    } else {
        let averages = [];
        
        for(let list in target_list[id][respect_type]){
            let avrg_of_list = getAverage(target_list[id][respect_type][list]);

            if(avrg_of_list != 0)
                averages.push(avrg_of_list);
        }

        respect_value = getAverage(averages);
    }
    
    if(respect_type == "respect")
        respect_value = respect_value + "*";
    else if(respect_type == "respect_base"){
        if(leaves)
            color = "#dfffdf";
        else 
            color = "#fffdcc";
    }

    if(respect_value == "0*")
        respect_value = "-"

    return [respect_value, color];
}

function getAverage(arr){
	if(arr.length == 0)
		return 0;
	
	let sum = 0;
	for(let item of arr){
		sum += item;
	}
	return parseFloat((sum / arr.length).toFixed(2));
}