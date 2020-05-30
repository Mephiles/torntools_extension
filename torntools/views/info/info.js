window.addEventListener("load", function(){
    console.log("Start Info popup");

    local_storage.get(["settings", "api", "api_key"], function([settings, api, api_key]){
        
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
        
        updateInfo(api_key);
    });
});

function updateInfo(api_key){
    fetch(`https://api.torn.com/user/?selections=profile,travel,bars&key=${api_key}`)
    .then(function(response){
        return response.json();
    }).then(function(user_data){
        console.log("Data", user_data);

        // Update location
        let country = user_data.travel.destination;
        if(user_data.travel.time_left > 0){
            doc.find("#location span").innerText = `Traveling to ${country}`;
        } else {
            doc.find("#location span").innerText = country;
        }

        // Update bars
        for(let bar of ["energy", "nerve", "happy", "life", "chain"]){
            let current_stat = user_data[bar].current;
            let max_stat = user_data[bar].maximum;
            let full_stat = user_data[bar].fulltime;

            let time_left = time_until(full_stat*1000);

            if(bar == "chain"){
                continue;
            }

            console.log("STAT", bar);
            console.log("Current", current_stat);
            console.log("Max", max_stat);

            doc.find(`#${bar} .stat`).innerText = `${current_stat}/${max_stat}`;

            if(time_left == "0s"){
                doc.find(`#${bar} .full-in`).style.display = "none";
            } else {
                doc.find(`#${bar} .full-in span`).innerText = time_left;
            }

            if(current_stat < max_stat){
                let progress = (current_stat/max_stat * 100).toFixed(0);
                doc.find(`#${bar} .progress div`).style.width = `${progress}%`;
            } else {
                doc.find(`#${bar} .progress div`).style.width = `100%`;
            }
        }
    });
}