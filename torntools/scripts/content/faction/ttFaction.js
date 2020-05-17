window.addEventListener("load", async function(){
    console.log("TT - Faction");

    if(await flying() || await abroad())
        return;

	local_storage.get(["settings", "oc"], function([settings, oc]){
        if(settings.pages.faction.oc_time){
            if(subpage() == "crimes"){
                subpageLoaded("crimes").then(function(loaded){
                    if(!loaded){
                        return;
                    }
                    ocTimes(oc, settings.format);
                });
            }

            doc.find(".faction-tabs li[data-case=crimes]").addEventListener("click", function(){
                subpageLoaded("crimes").then(function(loaded){
                    if(!loaded){
                        return;
                    }
                    ocTimes(oc, settings.format);
                });
            });
        }
	});
});

function ocTimes(oc, format){
    let crimes = doc.findAll(".organize-wrap .crimes-list>li");
    for(let crime of crimes){
        console.log(crime)
        let crime_id = crime.find(".details-wrap").getAttribute("data-crime");

        let finish_time = oc[crime_id].time_ready;
        let [day, month, year, hours, minutes, seconds]  = dateParts(new Date(finish_time*1000));

        let span = doc.new("span");
            span.setClass("tt-oc-time");
            span.innerText =`${formatTime([hours, minutes], format.time)} | ${formatDate([day, month], format.date)}`;

        crime.find(".status").appendChild(span);
    }
}

function subpage(){
    let hash = window.location.hash.replace("#/", "");
    let key = hash.split("=")[0];
    let value = hash.split("=")[1];

    if(key == "tab"){
        return value;
    }
    return "";
}

function subpageLoaded(page){
    return new Promise(function(resolve, reject){
        let counter = 50;
        let checker = setInterval(function(){
            console.log("checking");
            if(page == "crimes" && doc.find(".organize-wrap ul.crimes-list li")){
                resolve(true);
                return clearInterval(checker);
            } else if(counter == 0){
                resolve(false);
                return clearInterval(checker);
            } else {
                counter--;
            }
        }, 100);
    });
}