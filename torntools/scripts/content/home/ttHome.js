window.addEventListener('load', (event) => {
    console.log("TT - Home");

    if(flying())
        return

    chrome.storage.local.get(["settings", "userdata", "torndata", "networth"], function(data) {
		const settings = data.settings;
		const networth = data.networth;
		const show_networth = settings.pages.home.networth;
		
		console.log(networth);

        if(!show_networth)
            return

        let user_networth = data.userdata.networth.total;
		displayNetworth(parseInt(user_networth));
		displayNetworthChange(networth);
    });
});

function displayNetworth(user_networth){
	// find Networth slot in General Information
	let gen_info_box = getGenInfoBox();
	let inner_box = gen_info_box.children[1].children[0].children[0];
	let last_item = inner_box.children[inner_box.children.length-1];

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
	spanR.innerText = "$" + String(numberWithCommas(user_networth, shorten=false)) + " ";
	spanR.style.paddingLeft = "12px";
    
    // add to table
	spanL.appendChild(spanName);
	spanR.appendChild(i);
	li.appendChild(spanL);
	li.appendChild(spanR);
	inner_box.appendChild(li);
}

function displayNetworthChange(networth){
	if(!networth)
		return;

	let headings = ["Type", "Value", "Change"];
	let types = ["Points", "Vault", "Items", "Bazaar", "Properties", "Stock Market", "Company", "Bookie"];
	
	let li = document.createElement("li");
	let table = document.createElement("table");
	let tr_h = document.createElement("tr");

	table.style.width = "100%";
	li.style.padding = "3px";
	tr_h.style.paddingBottom = "5px";

	for(let heading of headings){
		let td = document.createElement("td");
		td.style.fontWeight = "600";
		td.style.paddingBottom = "5px";
		td.innerText = heading;
		tr_h.appendChild(td);
	}

	table.appendChild(tr_h);

	for(let type of types){
		if(parseInt(networth.current.value[type.replace(" ", "").toLowerCase()]) == 0 && parseInt(networth.previous.value[type.replace(" ", "").toLowerCase()]) == 0)
			continue;

		let tr = document.createElement("tr");
		for(let heading of headings){
			let td = document.createElement("td");
			td.style.paddingBottom = "2px";
			let value = networth.current.value[type.replace(" ", "").toLowerCase()];
			let change = 0;

			if(networth.previous.value && Object.keys(networth.previous.value).length != 0)
				change = value - (networth.previous.value[type.replace(" ", "").toLowerCase()]);

			if(heading == "Type")
				td.innerText = type;
			else if(heading == "Value")
				td.innerText = "$" + String(numberWithCommas(value));
			else if(heading == "Change"){
				td.innerText = "$" + String(numberWithCommas(change));

				if(change > 0)
					td.style.color = "green";
				else if (change < 0)
					td.style.color = "red";
			}
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}

	li.appendChild(table);
	
	let gen_info_box = getGenInfoBox();
	let inner_box = gen_info_box.children[1].children[0].children[0];
	inner_box.appendChild(li);
	
}

function getGenInfoBox(){
	let headings = document.querySelectorAll("h5");
	let gen_info_box;
	for(let heading of headings){
		if(heading.innerText == "General Information")
			gen_info_box = heading.parentElement.parentElement;
	}
	return gen_info_box;
}