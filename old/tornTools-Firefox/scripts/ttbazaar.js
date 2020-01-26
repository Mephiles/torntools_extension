const chrome = browser;
window.onload = () => {
	console.log("TornTools", "bazaar");
	initialize();
	Main();
}

function Main(){
	chrome.storage.local.get(["itemlist", "settings", "api_key", "vicodin"], function(data){
		const settings = data["settings"];
		const showBazaar = settings["other"]["bazaar"];
		const vicodin = settings["other"]["vicodin"];
		const itemlist = data["itemlist"]["items"];
		const api_key = data["api_key"];
		var itemPrices = {}
		var addDone = false;
		var vicodinDone = false;
		var manageDone = false;

		let checker = setInterval(function(){
			if(vicodin){
				if(subSite("bazaar")){
					if(!vicodinDone){
						markVicodin();
						vicodinDone = true;
					}
				} else {
					vicodinDone = false;
				}
			} else {
				console.log("VICODIN NOTIFICATION TURNED OFF");
			}

			if(showBazaar){
				if(subSite("add")){
					if(!addDone){
						setAppStatus("notready", "add");
						addMain(itemlist, api_key, itemPrices);
						addDone = true;
					}
				} else {
					addDone = false;
				}

				if(subSite("manage")){
					if(!manageDone){
						setAppStatus("notready", "manage");
						manageMain(itemlist, api_key, itemPrices);
						manageDone = true;
					}
				} else {
					manageDone = false;
				}
			} else {
				console.log("BAZAAR HELPER TURNED OFF");
			}

			if(!vicodin && !showBazaar){
				clearIntervall(checker);
			}
		}, 1000);
	});
}

function addMain(itemlist, api_key, itemPrices){
	var initialCount;

	setTimeout(function(){}, 500) // WAIT FOR INPUTS
	const inputs = document.querySelectorAll("input[placeholder='Qty']");
	if(inputs.length > 0){
		for(let input of inputs){
			input.addEventListener("focus", function(){
				modifyItem(this, itemlist, api_key, itemPrices, "add");	
			});
		}
		setAppStatus("ready", "add");
	}
	initialCount = openAllItems();
	var checkCounter = 0;

	let b = setInterval(function(){
		var checkboxes = document.querySelectorAll("a[role='presentation']");
		if(checkboxes.length > initialCount || checkCounter > 5){
			for(let box of checkboxes){
				box.addEventListener("click", function(){
					modifyItem(this, itemlist, api_key, itemPrices, "add")
				})
			}
			console.log("WAITING FOR INPUTS")
			clearInterval(b);
		}
		checkCounter += 1;
	}, 500);
}

function manageMain(itemlist, api_key, itemPrices){
	var initialCount;

	setTimeout(function(){}, 500) // WAIT FOR INPUTS
	const inputs = document.querySelectorAll(".input-money-group.no-max-value input:nth-of-type(1)");

	if(inputs.length > 0){
		for(let input of inputs){
			input.addEventListener("focus", function(){
				modifyItem(this, itemlist, api_key, itemPrices, "manage");	
			});
		}
		setAppStatus("ready", "manage");
	}
	// initialCount = openAllItems();
	// var checkCounter = 0;

	// let b = setInterval(function(){
	// 	var checkboxes = document.querySelectorAll("a[role='presentation']");
	// 	if(checkboxes.length > initialCount || checkCounter > 5){
	// 		for(let box of checkboxes){
	// 			box.addEventListener("click", function(){
	// 				modifyItem(this, itemlist, api_key, itemPrices)
	// 			})
	// 		}
	// 		console.log("WAITING FOR INPUTS")
	// 		clearInterval(b);
	// 	}
	// 	checkCounter += 1;
	// }, 500);
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

function displayBazaarItemPrice(price, row, view){
	if(view === "add"){
		let priceContainer = row.children[2].children[0].children[2].children[0].children[0];
		priceContainer.setAttribute("placeholder", String(numberWithCommas(price)));

		// SET PLACEHOLDERS TO CERTAIN COLOR
		let css = `li[data-reactid="${row.getAttribute("data-reactid")}"] input.clear-all.input-money::placeholder {color: #3ec505}`;
		let style = document.createElement("style");

		if(style.styleSheet){
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}

		document.getElementsByTagName("head")[0].appendChild(style);
	} else if(view === "manage"){
		let priceContainer = row.children[1].children[0].children[1];
		priceContainer.innerText = `$${numberWithCommas(price)}`
		priceContainer.style.color = "#3ec505";
	}
}

async function getBazaarItemPrice(id, api_key, prices){
	let value;

	if(!prices[id]){
		value = await get_api(`https://api.torn.com/market/${id}?selections=bazaar,itemmarket`, api_key).then(data => {
			value = getLowest([data["bazaar"], data["itemmarket"]]);
			return value
		});
	} else {
		value = prices[id];
	}
	return value
}

async function modifyItem(el, itemlist, api_key, itemPrices, view){
	let row;
	let itemName;
	if(view === "add"){
		try{
			row = el.parentElement.parentElement.parentElement.parentElement;
			itemName = row.children[1].children[1].innerText.split(" x")[0];
		} catch(err){
			row = el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
			itemName = row.children[1].children[1].innerText.split(" x")[0];
		}
		let id;

		for(let i in itemlist){
			if(itemlist[i]["name"] === itemName){
				id = i;
			}
		}

		await getBazaarItemPrice(id, api_key, itemPrices).then(data => {
			let price = data;
			itemPrices[id] = price
			displayBazaarItemPrice(price, row, "add");
		});
	} else if (view === "manage"){
		row = el.parentElement.parentElement.parentElement.parentElement;
		itemName = row.children[0].children[3].innerText.split(" x")[0].trim();
		
		let id;

		for(let i in itemlist){
			if(itemlist[i]["name"] === itemName){
				id = i;
			}
		}

		await getBazaarItemPrice(id, api_key, itemPrices).then(data => {
			let price = data;
			itemPrices[id] = price
			displayBazaarItemPrice(price, row, "manage");
		});
	}
}

function addView(){
	let check = document.querySelector("input[value='ADD TO BAZAAR']");
	if(check){
		return true;
	}
	return false;
}

function openAllItems(){
	// APPEND ALL ITEMS
	var checkboxes = document.querySelectorAll("a[role='presentation']");
	for(let box of checkboxes){
		if(box.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("data-group") === "parent"){
			box.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].click();
		}
	}
	return checkboxes.length;
}

function setAppStatus(status, view){
	const icons = {
		"disabled": "disabled.png",
		"notready": "notready.png",
		"ready": "ready.png"
	}
	const src = chrome.extension.getURL("images/"+icons[status]);
	if(!document.querySelector("#ttBazaarStatus")){
		var container;

		if(view === "add"){
			container = document.querySelector(".items-footer.clearfix");
		} else if(view === "manage"){
			container = document.querySelector("#top-page-links-list");
		}
		
		let div = document.createElement("div");
		div.setAttribute("style", `
			width: 20px;
			height: 20px;
			background-image: url("${src}");
			float: right;
			background-size: cover;
		`);
		div.id = "ttBazaarStatus";

		if(view === "add"){
			container.appendChild(div);
		} else if(view === "manage"){
			div.setAttribute("class", "t-clear h c-pointer  m-icon line-h24 right");
			container.insertBefore(div, container.children[container.children.length-2])
		}
	} else {
		document.querySelector("#ttBazaarStatus").style.backgroundImage = `url(${src})`
	}
}

function subSite(site){
	var hash = window.location.hash;
	hash = hash.slice(2);
	hash = hash.split("&");
	var params = {}

	for(let param of hash){
		param = param.split("=");
		params[param[0]] = param[1];
	}

	if(params["p"] && params["p"] === site){
		return true;
	}
	return false;
}

function markVicodin(){
	const priceTag = 100000;

	const names = document.querySelectorAll("p.t-overflow");
	for(let name of names){
		if(name.innerText === "Vicodin"){
			let price = name.nextElementSibling.innerText;
			price = price.replace("$", "");
			price = price.replace(/,/g, "");

			if(parseInt(price) >= priceTag){
				name.parentElement.parentElement.parentElement.parentElement.style.backgroundColor = "#fb5b5b";
			}
			break;
		}
	}
}