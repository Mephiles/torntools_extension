window.addEventListener('load', async (event) => {
    console.log("TT - Gym");

    if(await flying() || await abroad())
        return

    // local_storage.get(["settings", "torndata"], function([settings, torndata]) {
    //     console.log(torndata.gyms);

    //     if(!settings.pages.gym.show)
    //         return;
        
        // displayGymInfo(torndata.gyms);
    // });
});

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