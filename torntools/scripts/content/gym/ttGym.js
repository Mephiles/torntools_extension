gymLoaded().then(function(){
    console.log("TT - Gym");

    let gym_settings_container = content.new_container("Gym", {id: "tt-gym-settings", theme: settings.theme, collapsed: false});

    // Graph
    if(extensions.doctorn == false || extensions.doctorn == "force_false" || settings.force_tt){
        displayGraph();
    }

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

function gymLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".gymButton___3OFdI.inProgress___1Nd26")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

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
    let percentage = parseInt(in_prog_gym.find(".percentage___1vHCw").innerText.replace("%", ""));
    let goal = gym_goals[index];
    for(let perk of userdata.company_perks){
        if(perk.indexOf("increased gym experience") > -1){
            goal = parseInt(goal/1.3);
            break;
        }
    }

    let stat = parseInt((goal * (percentage/100)).toFixed(0));

    console.log("Estimated stat", stat);
    console.log("Estimated goal", goal);
    doc.find("#ttEnergyEstimate").innerText = `Estimated Energy progress: ${numberWithCommas(stat, false)}E/${numberWithCommas(goal, false)}E`;
}

function displayGraph(){
    fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=getStatGraph`)
    .then(async function(response){
        let result = await response.json();
        if(result.error){
            console.log("TornStats API result", result);
            
            let text;
            if(result.error.indexOf("User not found") > -1){
                text = "Please register an account @ www.tornstats.com";
            }
            let div = doc.new({type: "div", text: text || result.error, attributes: {style: "margin-bottom: 10px;"}});
            doc.find(".fetch-button").parentElement.insertBefore(div, doc.find(".fetch-button"));
            return;
        }

        let canvas = doc.new({type: "canvas", id: "tt-gym-graph", attributes: {width: "784", height: "250", style: "margin-bottom: 10px;"}});
        doc.find("#tt-gym-settings .content").insertBefore(canvas, doc.find("#tt-gym-settings .content").firstElementChild);

        let ctx = doc.find("#tt-gym-graph").getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: result.data.map(function(x){
                    let date = new Date(x.timestamp*1000);
                    return formatDate([date.getDate(), date.getMonth()+1], settings.format.date);
                }),
                datasets: [
                    {
                        label: "Strength",
                        data: result.data.map(x => x.strength),
                        borderColor: ["#3366CC"],
                        fill: false,
                        pointRadius: 0,
                        pointBackgroundColor: "#3366CC",
                        pointHoverRadius: 5
                    },
                    {
                        label: "Defense",
                        data: result.data.map(x => x.defense),
                        borderColor: ["#DC3912"],
                        fill: false,
                        pointRadius: 0,
                        pointBackgroundColor: "#DC3912",
                        pointHoverRadius: 5
                    },
                    {
                        label: "Speed",
                        data: result.data.map(x => x.speed),
                        borderColor: ["#FF9901"],
                        fill: false,
                        pointRadius: 0,
                        pointBackgroundColor: "#FF9901",
                        pointHoverRadius: 5
                    },
                    {
                        label: "Dexterity",
                        data: result.data.map(x => x.dexterity),
                        borderColor: ["#109618"],
                        fill: false,
                        pointRadius: 0,
                        pointBackgroundColor: "#109618",
                        pointHoverRadius: 5
                    },
                    {
                        label: "Total",
                        data: result.data.map(x => x.total),
                        borderColor: ["#990199"],
                        fill: false,
                        pointRadius: 0,
                        pointBackgroundColor: "#990199",
                        pointHoverRadius: 5,
                        hidden: true
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            step: 2000000,
                            callback: function(value, index, values){return numberWithCommas(value, false)}
                        },
                    }]
                },
                legend: {
                    position: "right",
                    labels: {
                        boxWidth: 13
                    }
                },
                tooltips: {
                    intersect: false,
                    mode: "index",
                    // enabled: true,
                    // mode: "y",
                    callbacks: {
                        label: function(tooltipItem, data){
                            return `${data.datasets[tooltipItem.datasetIndex].label}: ${numberWithCommas(tooltipItem.yLabel, false)}`;
                        }
                    }
                },
                hover: {
                    intersect: false,
                    mode: "index"
                }
            }
        });

        let update_button = doc.new({type: "button", text: "Update TornStats", class: "ttEnergyEstimate"});
        doc.find("#tt-gym-settings .content").insertBefore(update_button, doc.find("#ttEnergyEstimate"));

        update_button.addEventListener("click", function(){
            fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=recordStats`)
            .then(async function(response){
                let result = await response.json();
                if(result.error){
                    console.log("TornStats API result", result);

                    update_button.style.color = "#de0000";
                    update_button.innerText = result.error;
                } else if(result.status == true){
                    update_button.innerText = result.message;
                    update_button.style.color = "#00a500"
                }
            });
        });
    });
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