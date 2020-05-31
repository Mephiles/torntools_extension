window.addEventListener('load', async (event) => {
    console.log("TT - Gym");

    if(await flying() || await abroad() || await captcha()){
        return;
    }

    local_storage.get("settings", function(settings){
        let gym_settings_container = content.new_container("Gym", {id: "tt-gym-settings", theme: settings.theme, collapsed: false});

        // Energy needed for next gym estimates
        if(settings.pages.gym.estimated_energy){
            let div = doc.new({type: "div", id: "ttEnergyEstimate"});

            gym_settings_container.find(".content").appendChild(div);
            showProgress();
        }

        // setup box
        let div = doc.new("div");
            div.setClass("tt-setting");
        let checkbox = doc.new("input");
            checkbox.type = "checkbox";
        let p = doc.new("p");
            p.setClass("tt-setting-description")
            p.innerText = "Disable Gym buttons";
    
        let saving_div = doc.new("div");
            saving_div.setClass("saving");
        let text = doc.new("div");
            text.setClass("text");
            text.innerText = "Saving..";
        let img_div = doc.new("div");
            img_div.setClass("loading-icon");
            img_div.style.backgroundImage = `url(${chrome.runtime.getURL("images/loading.gif")})`;
    
        saving_div.appendChild(text);
        saving_div.appendChild(img_div);
        div.appendChild(checkbox);
        div.appendChild(p);
        div.appendChild(saving_div);
        gym_settings_container.find(".content").appendChild(div);

        // Disable buttons
        // checkbox listener
        checkbox.addEventListener("click", function(event){
            let checked = event.target.checked;
            saved(false);
    
            if(doc.find(".tt-awards-time").getAttribute("seconds")%60 >= 55 || doc.find(".tt-awards-time").getAttribute("seconds")%60 <= 5){
                setTimeout(function(){
                    local_storage.change({"settings": {"pages": {"gym": {"disable_buttons": checked}}}}, function(){
                        saved(true);

                        setTimeout(function(){
                            saving_div.style.display = "none";
                        }, 1500);
                    });
                }, 10*1000);  // wait 20 seconds
            } else {
                local_storage.change({"settings": {"pages": {"gym": {"disable_buttons": checked}}}}, function(){
                    saved(true);

                    setTimeout(function(){
                        saving_div.style.display = "none";
                    }, 1500);
                });
            }
    
            if(checked)
                disableTrainButtons(true);
            else
                disableTrainButtons(false)
        });
        
        if(settings.pages.gym.disable_buttons){
            checkbox.checked = true;
            disableTrainButtons(true);
        }
    });
});

function saved(saved){
    if(saved){
        doc.find("#tt-gym-settings .saving .text").setClass("text done");    
        doc.find("#tt-gym-settings .saving .text").innerText = "Saved!";
        doc.find("#tt-gym-settings .saving .loading-icon").style.display = "none";
    } else {
        doc.find("#tt-gym-settings .saving").style.display = "block";
        doc.find("#tt-gym-settings .saving .text").setClass("text");
        doc.find("#tt-gym-settings .saving .text").innerText = "Saving..";
        doc.find("#tt-gym-settings .saving .text").style.display = "inline-block";
        doc.find("#tt-gym-settings .saving .loading-icon").style.display = "inline-block";
    }
}

function disableTrainButtons(disable){
    let containers = doc.findAll("ul.properties___Vhhr7>li");
    for(let container of containers){
        if(disable)
            container.classList.add("locked___r074J");
        else if(!disable)
            container.classList.remove("locked___r074J");
    }
}

function showProgress(){
    let gym_goals = [
        200, 500, 1000, 2000, 2750, 3000, 3500, 4000,
        6000, 7000, 8000, 11000, 12420, 18000, 18100, 24140,
        31260, 36610, 46640, 56520, 67775, 84535, 106305
    ]

    let in_prog_gym = doc.find(".gymButton___3OFdI.inProgress___1Nd26");
    
    let index = parseInt(in_prog_gym.id.split("-")[1])-1;
    let goal = gym_goals[index];
    let percentage = parseInt(in_prog_gym.find(".percentage___1vHCw").innerText.replace("%", ""));

    let stat = parseInt((goal * (percentage/100)).toFixed(0));

    console.log("Estimated stat", stat);
    console.log("Estimated goal", goal);
    doc.find("#ttEnergyEstimate").innerText = `Estimated Energy progress: ${numberWithCommas(stat, false)}E/${numberWithCommas(goal, false)}E`;
}

// function displayGymInfo(gyms_data){
//     let locked_gyms = document.querySelectorAll(".gymList___2NGl7 .locked___3akPx");

//     for(let gym of locked_gyms){
//         let id = parseInt(gym.getAttribute("id").replace("gym-", ""));

//         gym.addEventListener("mouseover", function(){
//             displayTooltip(gyms_data[id]);
//         });
//     }

//     function displayTooltip(gym){
//         let stages = {
//             1: "Lightweight",
//             2: "Middleweight",
//             3: "Heavyweight",
//             4: "Specialist"
//         }

//         // setting info

//         let tooltip = document.querySelectorAll(".ToolTipPortal")[1];
//         tooltip.querySelector(".gymName___3olj4").innerText = gym.name + " ";
//             let span = document.createElement("span");
//             span.setAttribute("class", "gymClass___1FZ6q");
//             span.innerText = `(${stages[gym.stage]})`;
//             tooltip.querySelector(".gymName___3olj4").appendChild(span);
//         tooltip.querySelectorAll(".gymInfo___1P0Vl p")[0].innerText = `Membership cost - $${gym.cost}`;
//         tooltip.querySelectorAll(".gymInfo___1P0Vl p")[1].innerText = `Energy usage - ${gym.energy} per train`;

//         // displaying
//         let left = 586.5;  // 641.422 ; 662.844
//         let top = 467;
        
//         let container = tooltip.querySelector("div");
//         container.setAttribute("style", `
//             position: absolute; 
//             padding: 5px 8px; 
//             background: rgb(242, 242, 242); 
//             box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 8px; 
//             border-radius: 3px; 
//             transition: 
//                 all 0.3s ease-in-out 0s, 
//                 visibility 0.3s ease-in-out 0s; 
//             opacity: 0; 
//             visibility: hidden; 
//             z-index: 50; 
//             left: 587px; 
//             top: 467px;
//         `);
//     }
// }