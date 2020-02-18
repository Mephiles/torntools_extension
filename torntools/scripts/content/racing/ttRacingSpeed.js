var oldOnload = window.onload;

window.onload = function(){

    // run old window.onloads also
    if (typeof oldOnload == 'function') {
        oldOnload();
    }

    console.log("TT - Racing Speed");

    if(flying())
        return

    chrome.storage.local.get(["settings"], function(data) {
        const settings = data.settings;
        const show_racing = settings.pages.racing.show;

        if(!show_racing)
            return

        let done = false;
        let updateSpeed;
        let checker = setInterval(function(){
            if(racingView() && raceInProgress()){
				if(!done){
                    let track_length = document.querySelector(".drivers-list .track-info-wrap .track-info").getAttribute("data-length"); // miles
                    let laps = document.querySelector("#racingdetails .pd-lap").innerText.split("/")[1];
                    let race_length = parseFloat(track_length) * laps;
                    
					updateSpeed = setInterval(function(){
                        displaySpeed(race_length);
                    }, 100);
					done = true;
				}
            } else {
                done = false;
                clearInterval(updateSpeed);
            }
        }, 1000);
    });
}

function displaySpeed(race_length){
    console.log("Track length:", race_length);

    let racers = document.querySelectorAll("#leaderBoard .li");
    for(let racer of racers){
        let first_percentage = racer.querySelector(".time").innerText;
        if(first_percentage.indexOf(":") > -1)
            continue;
        console.log("First:", first_percentage);

        setTimeout(function(){
            let second_percentage = racer.querySelector(".time").innerText;
            if(second_percentage.indexOf(":") > -1)
                continue;
            console.log("Second:", second_percentage);

            let difference = parseFloat(now_percentage) - parseFloat(last_percentage);
            console.log("DIFFERENCE", difference);

            let speed = difference * race_length;

            let span = document.createElement("span");
            span.style.color = "green";
            span.style.float = "right";
            span.innerText = speed + " mph";
            racer.querySelector(".name").appendChild(span);
        }, 100);

    }

}

function raceInProgress(){
    let percentage = document.querySelector("#leaderBoard .driver-item .time").innerText || undefined;

    if(percentage)
        return true;
    return false;
}

function racingView(){
    let map = document.querySelector(".drivers-list .track-wrap");

    if(map)
        return true;
    return false;
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