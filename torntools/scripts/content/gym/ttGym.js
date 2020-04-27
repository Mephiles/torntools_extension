window.addEventListener('load', async (event) => {
    console.log("TT - Gym");

    if(await flying() || await abroad())
        return;

    // setup box
    let gym_settings_container = content.new_container("Torn Tools - Gym settings", {id: "tt-gym-settings"});
    let div = doc.new("div");
        div.setClass("tt-setting");
    let checkbox = doc.new("input");
        checkbox.type = "checkbox";
    let p = doc.new("p");
        p.setClass("tt-setting-description")
        p.innerText = "Disable Gym buttons";

    div.appendChild(checkbox);
    div.appendChild(p);
    gym_settings_container.find(".content").appendChild(div);

    // checkbox listener
    checkbox.addEventListener("click", function(event){
        let checked = event.target.checked;
        local_storage.change("settings", {"pages": {"gym": {"disable_buttons": checked}}});

        if(checked)
            disableTrainButtons(true);
        else
            disableTrainButtons(false)
    });
    
    local_storage.get("settings", function(settings) {
        if(settings.pages.gym.disable_buttons){
            checkbox.checked = true;
            disableTrainButtons(true);
        }

        // displayGymInfo(torndata.gyms);
    });
});

function disableTrainButtons(disable){
    let list = doc.find("ul.properties___Vhhr7");
    for(let button of list.findAll("button")){
        if(disable)
            button.classList.add("disabled___33AAM");
        else if(!disable)
            button.classList.remove("disabled___33AAM");
    }
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