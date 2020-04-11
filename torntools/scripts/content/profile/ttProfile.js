window.addEventListener('load', (event) => {
    console.log("TT - Profile");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "allies"], function(data) {
        const settings = data.settings;
        const show_profile = settings.pages.profile.show;
        let allies = data.allies;

        profileLoaded().then(function(loaded){
            if(!loaded)
                return;

            displayCreator();

            if(!show_profile)
                return

            let user_faction = data.userdata.faction.faction_name;
            let profile_faction = document.querySelector(".basic-information ul.basic-list li:nth-of-type(3) div:nth-of-type(2)").innerText;

            console.log(allies);
    
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
        setInterval(function(){
            if(document.querySelector(".basic-information"))
                return resolve(true);
            else if(counter > 1000)
                return resolve(false);
            else
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