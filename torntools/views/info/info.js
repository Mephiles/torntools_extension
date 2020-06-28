var previous_chain_timer;
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
        
        updateInfo(settings);

        // Update interval
        let updater = setInterval(function(){
            updateInfo(settings);
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

function updateInfo(settings){
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
        let status = userdata.status.state.toLowerCase() == "traveling" || userdata.status.state.toLowerCase() == "abroad"? "okay" : userdata.status.state.toLowerCase();
        doc.find("#status span").innerText = capitalize(status);
        doc.find("#status span").setClass(status);

        // Update bars
        for(let bar of ["energy", "nerve", "happy", "life", "chain"]){
            let current_stat = userdata[bar].current;
            let max_stat = bar == "chain" && current_stat != userdata[bar].maximum ? getNextBonus(current_stat) : userdata[bar].maximum;

            if(bar == "chain" && current_stat == 0){
                doc.find("#chain").style.display = "none";
                continue;
            } else {
                doc.find("#chain").style.display = "block";
            }

            if(current_stat > max_stat && ["happy"].includes(bar)){
                let tick_times = [15, 30, 45, 60];
                let current_minutes = new Date().getMinutes();

                for(let tick of tick_times){
                    if(tick > current_minutes){
                        let next_tick_date = new Date(new Date(new Date().setMinutes(tick)).setSeconds(0));
                        let ms_left = next_tick_date - new Date();
                        let resets_in = time_until(ms_left);

                        doc.find(`#${bar} .resets-in`).style.display = "block";
                        doc.find(`#${bar} .resets-in span`).innerText = resets_in;
                        doc.find(`#${bar} .resets-in span`).setAttribute("seconds-down", parseInt(ms_left/1000));

                        break;
                    }
                }
            }
            
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
            if(time_left == "0s" || time_left == -1){
                doc.find(`#${bar} .full-in`).style.display = "none";
            } else {
                doc.find(`#${bar} .full-in`).style.display = "block";
                doc.find(`#${bar} .full-in span`).innerText = time_left;
                doc.find(`#${bar} .full-in span`).setAttribute("seconds-down", full_stat);
            }
        }

        // Update travel bar
        if(userdata.travel.time_left != 0){
            doc.find("#travel").style.display = "block";
            let travel_time = (userdata.travel.timestamp - userdata.travel.departed)*1000;  // ms
            let time_left = new Date(userdata.travel.timestamp*1000) - new Date(); // ms
            let progress = parseInt((travel_time - time_left) / travel_time*100);
            console.log(travel_time)
            console.log(time_left)

            if(time_until(time_left) == -1){
                doc.find("#travel").style.display = "none";
            }

            doc.find("#travel .full-in span").innerText = time_until(time_left);
            doc.find("#travel .full-in span").setAttribute("seconds-down", (time_left/1000).toFixed(0));
            doc.find("#travel .progress div").style.width = `${progress}%`;

            let land_date = new Date(userdata.travel.timestamp*1000);
            let [hours, minutes, seconds] = [land_date.getHours(), land_date.getMinutes(), land_date.getSeconds()];
            doc.find("#travel .progress .stat").innerText = formatTime([hours, minutes, seconds], settings.format.time);
        } else {
            doc.find("#travel").style.display = "none";
        }

        // Update chain timer
        console.log("Chain timeout: ", userdata.chain.timeout);
        if(userdata.chain.timeout > 0){
            if(!previous_chain_timer || previous_chain_timer != userdata.chain.timeout){
                previous_chain_timer = userdata.chain.timeout;
                doc.find("#chain").style.display = "block";
    
                let time_diff = new Date() - new Date(userdata.date);
                let real_timeout = userdata.chain.timeout*1000 - time_diff;
    
                if(real_timeout > 0){
                    doc.find(`#chain .resets-in`).style.display = "block";
                    doc.find("#chain .resets-in span").innerText = time_until(real_timeout);
                    doc.find("#chain .resets-in span").setAttribute("seconds-down", (real_timeout/1000).toFixed(0));
                } else {
                    doc.find("#chain").style.display = "none";
                }
            }
        } else {
            doc.find("#chain").style.display = "none";
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
        for(let event_key of Object.keys(userdata.events).reverse()){
            if(userdata.events[event_key].seen == 0){
                event_count++;
            } else {
                break;
            }
        }
        let message_count = 0;
        for(let message_key of Object.keys(userdata.messages).reverse()){
            if(userdata.messages[message_key].seen == 0){
                message_count++;
            } else {
                break;
            }
        }

        doc.find(".footer .messages span").innerText = message_count;
        doc.find(".footer .events span").innerText = event_count;
        doc.find(".footer .money span").innerText = `$${numberWithCommas(userdata.money_onhand, shorten=false)}`;

        doc.find(".footer .messages").addEventListener("click", function(){
            chrome.tabs.create({url: "https://www.torn.com/messages.php"});
        });
        doc.find(".footer .events").addEventListener("click", function(){
            chrome.tabs.create({url: "https://www.torn.com/events.php"});
        });
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