const chrome = browser;
window.onload = () => {
	console.log("TornTools", "points");
	initialize();
	Main();
}

function Main(){
	chrome.storage.local.get(["settings", "userdata", "torndata"], function(data){
		const settings = data["settings"];
		const ach = settings["other"]["achievements"]
		
		if(ach){
			const completed = settings["other"]["completed"];
			const stats = data["userdata"];
			const honors = data["torndata"]["honors"];

			const ps = stats["personalstats"]
			const status = getStatus()

			// CREATE WINDOW
			window_ = createAwardsWindow();
			
			console.log('Stats retrieved', stats);
			console.log("Honors retrieved", honors);

			var items = {
				//"Energy": {stats: ps["erefills"], ach: []},
				//"Nerve": {stats: ps["nrefills"], ach: []}
			}

			items = setItemHonors(items, honors);

			console.log("ITEMS", items)

			appendItems(items, window_.inner_content, completed);
			setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}
	});
}

//////////////////////////////
// FUNCTIONS
//////////////////////////////

function initialize(){
	chrome.storage.local.get(["update"], function(data){
		const update = data["update"];
		
		if(update){
			const headers = document.querySelectorAll(".header___30pTh.desktop___vemcY");
			const version = chrome.runtime.getManifest().version;
			
			var container;
			for(let header of headers){
				if(header.innerText === "Areas"){
					container = header.parentElement.children[1];
				}
			}
			const nextElement = document.querySelector("#nav-home");

			let div = document.createElement("div");
			let innerDiv = document.createElement("div");
			let link = document.createElement("a");
			let span = document.createElement("span");
			let icon = document.createElement("div");

			div.classList.add("area-desktop___29MUo");
			innerDiv.classList.add("area-row___51NLj");
			innerDiv.style.backgroundColor = "#8eda53b0";

			link.addEventListener("click", function(){
				chrome.runtime.sendMessage({"action": "openOptionsPage"});
			});

			span.innerHTML = `Torn<span style="font-weight:600;margin:0;line-height:7px;">Tools</span>  v${version}`;
			span.setAttribute("style", `
				height: 20px;
				line-height: 20px;
			`);

			const src = chrome.extension.getURL("images/icon50.png");
			icon.setAttribute("style", `
				width: 15px;
				height: 15px;
				background-size: cover;
				background-image: url(${src});
				margin-top: 2px;
				margin-left: 10px;
				margin-right: 6px;
				float: left;
			`)

			link.appendChild(icon)
			link.appendChild(span);
			innerDiv.appendChild(link);
			div.appendChild(innerDiv);
			container.insertBefore(div, nextElement);
		}

		// functions
		capitalize();
	});
}

async function get_api(http, api_key) {
//  	console.log("START");

	// chrome.storage.local.get(["api_count", "api_limit"], function(data){

	// 	console.log("CURRENT API COUNT 1", api_count)
	// 	console.log("CURRENT API LIMIT 1", api_limit)

	// 	localStorage.setItem("api_count", parseInt(data["api_count"]));
	// 	localStorage.setItem("api_limit", parseInt(data["api_limit"]));
	// });

	// const api_count = parseInt(localStorage.getItem("api_count"));
	// const api_limit = parseInt(localStorage.getItem("api_limit"));
	// console.log("CURRENT API COUNT 2", api_count)
	// console.log("CURRENT API LIMIT 2", api_limit)

	// if(api_count >= api_limit){
	// 	console.log("API limit exceeded.");
	// } else {
	// 	await increaseApiCount(api_count)
	// 	const response = await fetch(http + "&key=" + api_key)
	// 	const result = await response.json()
	// 	console.log("HERE4", result)
	// 	return result
	// }

	// function increaseApiCount(api_count){
	// 	chrome.storage.local.set({"api_count": parseInt(api_count+1)}, function(){
	// 		console.log("Api count set.", parseInt(api_count+1))
	// 	})
	// }
	const response = await fetch(http + "&key=" + api_key)
	const result = await response.json()
	return result;
}

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function compare(a,b) {
  if (a.cost < b.cost)
    return -1;
  if (a.cost > b.cost)
    return 1;
  return 0;
}

function getLowest(lists){
	var lowest;

	for(let list in lists){
		for(let id in lists[list]){
			let price = parseInt(lists[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}

function days(x){
	return Math.floor(x/60/60/24); // seconds, minutes, hours
}

function hours(x){
	return Math.floor(x/60/60); // seconds, minutes
}

function countPerks(perks){
	let total = 0;

	for(let perklist of perks){
		for(let perk of perklist){
			total++;
		}
	}

	return total
}

function displayNetworth(x){
	const container = document.querySelector("#item4741013");
	const innerBox = container.children[1].children[0].children[0];
	const last = innerBox.children[innerBox.children.length-1];

	last.removeAttribute("class");

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
	spanR.innerText = "$" + String(numberWithCommas(x));
	spanR.style.paddingLeft = "12px";
	
	spanL.appendChild(spanName);
	spanR.appendChild(i);
	li.appendChild(spanL);
	li.appendChild(spanR);
	innerBox.appendChild(li);
}

function cleanNr(x){
	return String(parseInt(x).toFixed())
}

function capitalize(){
	String.prototype.capitalize = function () {
	  	return this.replace(/^./, function (match) {
	    	return match.toUpperCase();
	  	});
	};
}

function appendItems(items, inner_content, completed){
	for(let item in items){
		let ach = items[item]["ach"]
		let stats = items[item]["stats"]

		if(!stats){
			addRow(`${item}: 0/${ach[0]}`, inner_content)
		} else if (stats >= ach[ach.length-1] && completed) {
			addRow(`${item}: Completed!`, inner_content)
		} else {
			for(let milestone of ach){
				if(stats < milestone){
					addRow(`${item}: ${stats}/${milestone}`, inner_content)
					break;
				}
			}
		}
	}
}

function setItemHonors(items, honors){
	for(let item in items){
		let term;
		if(items[item]["alt"]){
			term = items[item]["alt"][0]
		} else {
			term = item.split(" ")[0]
		}

		for(let honor in honors) {
			let desc = honors[honor].description;

			if(desc.indexOf(term) !== -1 || desc.indexOf(term.toLowerCase()) !== -1){
				if(items[item]["excl"]){
					let unique = true;
					for(let word of items[item]["excl"]){
						if(desc.indexOf(word) !== -1 || desc.indexOf(word.capitalize()) !== -1){
							unique = false
						}
					}
					if(unique){
						let nr = parseInt(desc.replace(/\D/g,''));
						if(!isNaN(nr)){
							items[item]["ach"].push(nr)
						}
					}
				} else if(items[item]["incl"]){
					let correct = true;
					for(let word of items[item]["incl"]){
						if(desc.indexOf(word) === -1 && desc.indexOf(word.capitalize()) === -1){
							correct = false;
						}
					}
					if(correct) {
						let nr = parseInt(desc.replace(/\D/g,''));
						if(!isNaN(nr)){
							items[item]["ach"].push(nr)
						}
					}
				} else {
					let nr = parseInt(desc.replace(/\D/g,''));
					if(!isNaN(nr)){
						items[item]["ach"].push(nr)
					}
				}
			}
		}
		items[item]["ach"].sort(function(a,b){return a-b})
	}

	return items
}

function addRow(html, inner_content){
	let row = document.createElement("div");
	let row_inner = document.createElement("div");
	row.classList.add("area-desktop___29MUo");
	if(status == "hospital"){row.classList.add("in-hospital___2RRIG")}
	else if(status == "jail"){row.classList.add("in-jail___3XdP8")}
	row_inner.innerHTML = numberWithCommas(html);
	row_inner.classList.add("area-row___51NLj")
	row_inner.style.height = "23px"
	row_inner.style.lineHeight = "23px"
	row_inner.style.paddingLeft = "5px"

	if(html.slice(-10) === "Completed!"){
		row_inner.style.color = "#11c511"
	}

	row.appendChild(row_inner)
	inner_content.appendChild(row)
}

function getStatus(){
	let nav = document.querySelector("#sidebarroot");
	
	if(!nav){
		return "flying";
	}
	
	let hdr = nav.firstElementChild.firstElementChild
				.firstElementChild.firstElementChild
				.firstElementChild.firstElementChild
				.firstElementChild;

	for(let class_ of hdr.classList){
		if(class_.indexOf("hospital") !== -1){
			return "hospital";
		} else if (class_.indexOf("in-jail") !== -1){
			return "jail";
		}
	}
	return "okay";
}

function createAwardsWindow(){
	// Create window
	var containers = document.getElementsByClassName("sidebar-block___1Cqc2");
	var last_block = containers[containers.length-1]

	var content = document.createElement("div");
	var block = document.createElement("div");
	var header = document.createElement("h2");
	var inner_content = document.createElement("div");

	return {last_block: last_block, content: content, block: block, header: header, inner_content: inner_content}
}

function setAwardsWindow(window_, status){
	window_.header.innerText = "Awards";
	window_.content.classList.add("content___kMC8x");
	window_.block.classList.add("toggle-block___13zU2");
	window_.header.classList.add("header___30pTh");
	window_.header.classList.add("desktop___vemcY")
	if(status == "hospital"){window_.header.classList.add("in-hospital___3XdP8")}
	else if(status == "jail"){window_.header.classList.add("in-jail___nwOPJ")}
	window_.inner_content.classList.add("toggle-content___3XKOC");

	window_.block.appendChild(window_.header)
	window_.block.appendChild(window_.inner_content)
	window_.content.appendChild(window_.block)
	window_.last_block.insertBefore(window_.content, window_.last_block.firstChild)
}