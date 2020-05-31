window.addEventListener("load", function(){
    console.log("Start Info popup");

    local_storage.get(["settings", "api"], function([settings, api]){
        
        // show error
        if(!api.online){
            doc.find(".error").style.display = "block";
            doc.find(".error").innerText = api.error;
        }

        // setup links
        for(let tab in settings.tabs){
            if(tab == "default")
                continue;

            if(settings.tabs[tab] == false){
                doc.find(`#${tab}-html`).style.display = "none";
            } else {
                doc.find(`#${tab}-html`).addEventListener("click", function(){
                    window.location.href = `../${tab}/${tab}.html`;
                });
            }
		}
		
		// setup settings button
		doc.find(".settings").addEventListener("click", function(){
			window.open("../settings/settings.html");
        });
        
        updateInfo();

        // Update interval
        let updater = setInterval(function(){
            updateInfo();
        }, 15*1000);

        // Global time reducer
        let time_decreaser = setInterval(function(){
            for(let time of doc.findAll("*[seconds-down]")){
                let seconds = parseInt(time.getAttribute("seconds-down"));
                seconds--;

                if(seconds == 0){
                    time.parentElement.style.display = "none";
                    time.removeAttribute("seconds-down");
                    continue;
                }
    
                let time_left = time_until(seconds*1000);
                time.innerText = time_left;
                time.setAttribute("seconds-down", seconds);
            }
        }, 1000);

        // Update time increaser
        let time_increaser = setInterval(function(){
            let time = doc.find("#last-update span")
            let seconds = parseInt(time.getAttribute("seconds-up"));
            seconds++;

            time.innerText = time_ago(new Date() - seconds*1000);
            time.setAttribute("seconds-up", seconds);
        }, 1000);
    });
});

function updateInfo(){
    console.log("Updating INFO");
    local_storage.get("userdata", function(userdata){
        console.log("Data", userdata);

        let time_diff = parseInt(((new Date().getTime() - new Date(userdata.date).getTime()) / 1000).toFixed(0));
        doc.find("#last-update span").innerText = time_ago(new Date(userdata.date));
        doc.find("#last-update span").setAttribute("seconds-up", time_diff);

        // Update location
        let country = userdata.travel.destination;
        if(userdata.travel.time_left > 0){
            doc.find("#location span").innerText = `Traveling to ${country}`;
        } else {
            doc.find("#location span").innerText = country;
        }

        // Update status
        let status = userdata.status.state.toLowerCase();
        doc.find("#status span").innerText = status;
        doc.find("#status span").setClass(status);

        // Update bars
        for(let bar of ["energy", "nerve", "happy", "life", "chain"]){
            let current_stat = userdata[bar].current;
            let max_stat = bar == "chain" && current_stat != userdata[bar].maximum ? getNextBonus(current_stat) : userdata[bar].maximum;
            let full_stat = userdata[bar].fulltime - time_diff;

            let time_left = time_until(full_stat*1000);

            doc.find(`#${bar} .stat`).innerText = `${current_stat}/${max_stat}`;

            // Progress
            if(current_stat < max_stat){
                let progress = (current_stat/max_stat * 100).toFixed(0);
                doc.find(`#${bar} .progress div`).style.width = `${progress}%`;
            } else {
                doc.find(`#${bar} .progress div`).style.width = `100%`;
            }

            if(bar == "chain"){
                continue;
            }

            // Time
            if(time_left == "0s" || time_left.indexOf("-") > -1){
                doc.find(`#${bar} .full-in`).style.display = "none";
            } else {
                doc.find(`#${bar} .full-in`).style.display = "block";
                doc.find(`#${bar} .full-in span`).innerText = time_left;
                doc.find(`#${bar} .full-in span`).setAttribute("seconds-down", full_stat);
            }
        }

        // Update cooldowns
        for(let cd of ["drug", "medical", "booster"]){
            let time_left = time_until((userdata.cooldowns[cd] - time_diff)*1000);

            if(time_left == "0s" || time_left.indexOf("-") > -1){
                doc.find(`#${cd}`).style.display = "none";
            } else {
                doc.find(`#${cd}`).style.display = "block";
                doc.find(`#${cd} .time`).innerText = time_left;
                doc.find(`#${cd} .time`).setAttribute("seconds-down", userdata.cooldowns[cd]);
            }
        }

        // Update footer info
        let event_count = 0;
        for(let event_id in userdata.events){
            if(userdata.events[event_id].seen == 0){
                event_count++;
            } else {
                break;
            }
        }

        doc.find(".footer .events span").innerText = event_count;
        doc.find(".footer .money span").innerText = `$${numberWithCommas(userdata.money_onhand, shorten=false)}`;
    });
}

function getNextBonus(current){
    let chain_bonuses = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

    for(let bonus of chain_bonuses){
        if(bonus > current){
            return bonus;
        }
    }
}