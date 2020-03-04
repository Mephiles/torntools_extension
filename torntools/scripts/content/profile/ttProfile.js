window.addEventListener('load', (event) => {
    console.log("TT - Profile");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "allies"], function(data) {
        const settings = data.settings;
        const show_profile = settings.pages.profile.show;
        let allies = data.allies;

        if(!show_profile)
            return

        setTimeout(function(){
            let user_faction = data.userdata.faction.faction_name;
            let profile_faction = document.querySelector(".basic-information ul.basic-list li:nth-of-type(3) div:nth-of-type(2)").innerText;
    
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
        }, 1000);
    });
});

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

function flying() {
	try {	
		if(document.querySelector("#skip-to-content").innerText === "Traveling"){
			console.log("TT - User Flying");
			return true
		}
	} catch(err) {}
	return false
}