gymLoaded().then(function(){
    console.log("TT - Gym");

    let gym_container = content.new_container("Gym", {id: "tt-gym"});

    // Graph
    if(extensions.doctorn == false || extensions.doctorn == "force_false" || settings.force_tt){
        displayGraph();
    }

    // Energy needed for next gym estimates
    if(settings.pages.gym.estimated_energy){
        let div = doc.new({type: "div", id: "ttEnergyEstimate"});

        gym_container.find(".content").appendChild(div);
        showProgress();
    }

    // Disable buttons
    let div = doc.new({type: "div", class: "tt-checkbox-wrap"});
    let checkbox = doc.new({type: "input", attributes: {type: "checkbox"}});
    let div_text = doc.new({type: "div", text: "Disable Gym buttons"});

    div.appendChild(checkbox);
    div.appendChild(div_text);
    gym_container.find(".content").appendChild(div);

    checkbox.addEventListener("click", function(){
        if(checkbox.checked){
            disableGymButton(["strength", "speed", "dexterity", "defense"], true);
        } else {
            disableGymButton(["strength", "speed", "dexterity", "defense"], false);
        }
    });

    let stats = {
        "strength": "strength___1GeGr",
        "speed": "speed___1o1b_",
        "defense": "defense___311kR",
        "dexterity": "dexterity___1YdUM",
    }
    // Individual buttons
    for(let stat in stats){
        let checkbox = doc.new({type: "input", class: "tt-gym-stat-checkbox", attributes: {type: "checkbox"}});
        checkbox.checked = settings.pages.gym[`disable_${stat}`];
        
        if(settings.pages.gym[`disable_${stat}`] && !doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.contains("locked___r074J")){
            doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.add("locked___r074J");
        }

        doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).appendChild(checkbox);
        
        checkbox.onclick = function(){
            if(!doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.contains("locked___r074J") && checkbox.checked){
                disableGymButton([stat], true);
            } else if(!checkbox.checked){
                disableGymButton([stat], false);
            }
        }
    }

    if(settings.pages.gym.disable_strength && settings.pages.gym.disable_speed && settings.pages.gym.disable_dexterity && settings.pages.gym.disable_defense){
        checkbox.checked = true;
        disableGymButton(["strength", "speed", "dexterity", "defense"], true);
    }

    // Train button listeners
    for(let button of doc.findAll(".button___3AlDV")){
        button.addEventListener("click", function(){
            for(let button of doc.findAll(".button___3AlDV")){
                setTimeout(function(){
                    if(findParent(button, {class: "propertyContent___1hg0-"}).parentElement.find(".tt-gym-stat-checkbox").checked == true){
                        findParent(button, {class: "propertyContent___1hg0-"}).parentElement.classList.add("locked___r074J");
                    }
                }, 400);
            }
        });
    }
});

function gymLoaded(){
    return new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            if(doc.find(".gymButton___3OFdI")){
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function disableGymButton(types, disable){
    let stats = {
        "strength": "strength___1GeGr",
        "speed": "speed___1o1b_",
        "defense": "defense___311kR",
        "dexterity": "dexterity___1YdUM",
    }

    console.log(types)
    console.log(disable)

    for(let stat of types){
        if(disable){
            if(!doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.contains("locked___r074J")){
                console.log(`${stat}: disabling`);
                doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.add("locked___r074J");
                doc.find(`ul.properties___Vhhr7>li.${stats[stat]} .tt-gym-stat-checkbox`).checked = true;
            }
        } else {
            console.log(`${stat}: enabling`);
            doc.find(`ul.properties___Vhhr7>li.${stats[stat]}`).classList.remove("locked___r074J");
            doc.find(`ul.properties___Vhhr7>li.${stats[stat]} .tt-gym-stat-checkbox`).checked = false;
        }

    }
    local_storage.get("settings", function(settings){
        for(let stat of types){
            settings.pages.gym[`disable_${stat}`] = disable;
        }
        local_storage.set({"settings": settings});
    });
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
    let container = doc.find("#tt-gym .content");
    let graph_area = doc.new({type: "div", class: "tt-graph-area"});
    container.appendChild(graph_area);

    fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=getStatGraph`)
    .then(async function(response){
        if(!mobile){
            let result = await response.json();
    
            if(result.error){
                console.log("TornStats API result", result);
                
                let text;
                if(result.error.indexOf("User not found") > -1){
                    text = "Can't display graph because no TornStats account was found. Please register an account @ www.tornstats.com";
                }
    
                let div = doc.new({type: "div", text: text || result.error, class: "tt-error-message"});
                graph_area.appendChild(div);
                return;
            }
    
            let canvas = doc.new({type: "canvas", id: "tt-gym-graph", attributes: {width: "784", height: "250"}});
            graph_area.appendChild(canvas);
    
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
        }

        // Update TornStats button
        let update_button = doc.new({type: "button", text: "Update TornStats", class: "update-button"});
        graph_area.appendChild(update_button);

        update_button.addEventListener("click", function(){
            if(graph_area.find(".response-message")) graph_area.find(".response-message").remove();
            if(graph_area.find(".tt-info-message")) graph_area.find(".tt-info-message").remove();

            fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=recordStats`)
            .then(async function(response){
                let result = await response.json();
                console.log("result", result);

                let response_div = doc.new({type: "div", class: "response-message"});
                graph_area.appendChild(response_div);

                if(result.error){
                    console.log("TornStats API result", result);

                    response_div.classList.add("failure");
                    response_div.innerText = result.error;
                } else if(result.status == true){
                    response_div.classList.add("success");
                    response_div.innerText = result.message;

                    let gains = []
                    let update_message = `You have gained `

                    if(result.deltaStrength != 0){
                        gains.push(`${numberWithCommas(result.deltaStrength, false)} Strength`);
                    } else if(result.deltaDefense != 0){
                        gains.push(`${numberWithCommas(result.deltaDefense, false)} Defense`);
                    } else if(result.deltaDexterity != 0){
                        gains.push(`${numberWithCommas(result.deltaDexterity, false)} Dexterity`);
                    } else if(result.deltaSpeed != 0){
                        gains.push(`${numberWithCommas(result.deltaSpeed, false)} Speed`);
                    }

                    update_message += gains.join(", ") + ` since your last update ${result.age}.`;
                    if(gains.length == 0) update_message = `You have not gained any stats since your last update ${result.age}.`

                    let info_div = doc.new({type: "div", class: "tt-info-message", text: update_message});
                    graph_area.appendChild(info_div);
                }
            });
        });
    });
}


// function saved(saved){
//     if(saved){
//         doc.find("#tt-gym-settings .saving .text").setClass("text done");    
//         doc.find("#tt-gym-settings .saving .text").innerText = "Saved!";
//         doc.find("#tt-gym-settings .saving .loading-icon").style.display = "none";
//     } else {
//         doc.find("#tt-gym-settings .saving").style.display = "block";
//         doc.find("#tt-gym-settings .saving .text").setClass("text");
//         doc.find("#tt-gym-settings .saving .text").innerText = "Saving..";
//         doc.find("#tt-gym-settings .saving .text").style.display = "inline-block";
//         doc.find("#tt-gym-settings .saving .loading-icon").style.display = "inline-block";
//     }
// }

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