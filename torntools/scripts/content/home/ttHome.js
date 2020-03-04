window.onload = window.onload.extend(function(){
    console.log("TT - Home");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "torndata"], function(data) {
        const settings = data.settings;
        const show_networth = settings.pages.home.networth;

        if(!show_networth)
            return

        let user_networth = data.userdata.networth.total;
        displayNetworth(parseInt(user_networth));
    
    });
});

function displayNetworth(user_networth){

    // find Networth slot in General Information
	const gen_info_box = document.querySelector("#item4741013");
	const inner_box = gen_info_box.children[1].children[0].children[0];
	const last_item = inner_box.children[inner_box.children.length-1];

    // remove class "last" from last element
	last_item.removeAttribute("class");

    // create new element
	let li = document.createElement("li");
	let spanL = document.createElement("span");
	let spanName = document.createElement("span");
	let spanR = document.createElement("span");
	let i = document.createElement("i");

	li.classList.add("last");
	li.style.backgroundColor = "#65c90069";
	spanL.classList.add("divider");
	spanR.classList.add("desc");
	i.classList.add("networth-info-icon");
	i.setAttribute("title", "Torn Tools: Your networth is fetched from Torn's API which may have a small delay. It is fetched every 1 minute.");
	spanName.style.backgroundColor = "rgba(0,0,0,0)";

	spanName.innerText = "Networth"
	spanR.innerText = "$" + String(numberWithCommas(user_networth)) + " ";
	spanR.style.paddingLeft = "12px";
    
    // add to table
	spanL.appendChild(spanName);
	spanR.appendChild(i);
	li.appendChild(spanL);
	li.appendChild(spanR);
	inner_box.appendChild(li);
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

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}