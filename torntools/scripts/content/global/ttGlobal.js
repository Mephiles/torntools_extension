window.addEventListener('load', (event) => {
    console.log("TT - Global");

    if(flying())
        return

    chrome.storage.local.get(["updated"], function(data) {
        if(data.updated)
            showTTLink();
    });
});

function showTTLink(){
    let headers = document.querySelectorAll("h2");
    let container;
    for(let header of headers){
        if(header.innerText == "Areas")
            container = header.nextElementSibling;
    }

    let link = chrome.runtime.getURL("/views/settings.html");

    let div_1 = document.createElement("div");
    let div_2 = document.createElement("div");
    let a = document.createElement("a");
    let span = document.createElement("span");

    div_1.setAttribute("class", "area-desktop___2YU-q");
    div_2.setAttribute("class", "area-row___34mEZ");
    div_2.style.height = "25px";
    div_2.style.backgroundColor = "#93ff93";
    a.setAttribute("class", "desktopLink___2dcWC");
    a.setAttribute("href", link);
    a.setAttribute("target", "_blank");
    span.innerText = "TornTools updated: v" + chrome.runtime.getManifest().version;

    a.appendChild(span);
    div_2.appendChild(a);
    div_1.appendChild(div_2);
    container.insertBefore(div_1, container.firstChild);
}

// GLOBAL FUNCTIONS

function flying() {
	try {	
		if(document.querySelector("#skip-to-content").innerText === "Traveling"){
			console.log("TT - User Flying");
			return true
		}
	} catch(err) {}
	return false
}

function hours(x) {
	return Math.floor(x / 60 / 60); // seconds, minutes
}

function time_ago(time) {

    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    var time_formats = [
        [60, 'seconds', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds == 0) {
        return 'Just now'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0,
        format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
}

function numberWithCommas(x, shorten=true) {
    if(!shorten)
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if(x%10 == 0){
        if(x >= 1e9)
            return (x/1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "bil"
        else if(x >= 1e6)
            return (x/1e6) + "mil"
        else if(x >= 1e3)
            return (x/1e3) + "k"
    }

    if(x > 1e9)
        return (x/1e9).toFixed(3) + "bil";
    else if(x > 1e6)
        return (x/1e6).toFixed(3) + "mil";

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function days(x) {
	return Math.floor(x / 60 / 60 / 24); // seconds, minutes, hours
}

// ACHIEVEMENT FUNCTIONS

function showAchievementTooltip(text, position){
    let tt_ach_tooltip = document.querySelector("#tt-ach-tooltip");
    tt_ach_tooltip.setAttribute("style", `
        position: absolute;
        display: block;
        z-index: 999999;
        left: ${String(position.x + 172+7) + "px"};
        top: ${String(position.y + Math.abs(document.body.getBoundingClientRect().y)+6) + "px"};
    `);

    document.querySelector("#tt-ach-tooltip-text").innerText = text;
}

function hideAchievementTooltip(){
    document.querySelector("#tt-ach-tooltip").style.display = "none";
}

function createAchievementTooltip(){
    let div = document.createElement("div");
    let arrow = document.createElement("div");
    let text = document.createElement("div");

    div.id = "tt-ach-tooltip";
    arrow.id = "tt-ach-tooltip-arrow";
    text.id = "tt-ach-tooltip-text";

    div.appendChild(arrow);
    div.appendChild(text);
    document.querySelector("body").appendChild(div);
}