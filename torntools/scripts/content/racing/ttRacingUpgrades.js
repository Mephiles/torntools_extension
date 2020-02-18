Function.prototype.extend = function(fn) {
    var self = this;
    return function() {
        self.apply(this, arguments);
        fn.apply(this, arguments);
    };
};

window.onload = function(){
    console.log("TT - Racing Upgrades");

    if(flying())
        return

    chrome.storage.local.get(["settings"], function(data) {
        const settings = data.settings;
        const show_racing = settings.pages.racing.show;

        if(!show_racing)
            return

        let done = false;
        let checker = setInterval(function(){
            if(upgradeView()){
				if(!done){
					showUpgrades();
					done = true;
				}
            } else {
                done = false;
            }
        }, 1000);
    });
}

function upgradeView(){
    let categories = document.querySelector(".pm-categories-wrap");

    if(categories)
        return true;
    return false;
}

function showUpgrades(){
    let items = document.querySelectorAll(".pm-items-wrap .d-wrap .pm-items .unlock");

    for(let item of items){
        item.style.position = "relative";
        let title = item.querySelector(".title");
        let properties = item.querySelectorAll(".properties");
        title.style.fontSize = "11px";

        let first = true;
        let amount = 7;
        let negative = false;
        for(let property of properties){
            if(property.querySelector(".negative"))
                negative = true;

            let span = document.createElement("span");
            span.style.position = "absolute";
            span.style.right = "0";
            span.style.top = amount + "px";

            span.style.color = "green";
            span.style.float = "right";
            span.style.fontSize = "10px";
            span.style.lineHeight = "10px";
            
            let name = property.querySelector(".name").innerText.trim();
            let stat_gray = parseInt(property.querySelector(".bar-gray-light-wrap-d").style.width);
            let stat_color = parseInt(property.querySelector(".bar-color-wrap-d").style.width);
            difference = stat_color - stat_gray;

            if(negative){
                difference = "-"+difference;
                span.style.color = "#ff4444";
            } else
                difference = "+"+difference;

            span.innerText += `${difference} ${name}`;
            title.appendChild(span);
            first = false;
            amount += 10;
        }
    }
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