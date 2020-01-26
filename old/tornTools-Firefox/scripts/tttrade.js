const chrome = browser;
window.onload = () => {
	console.log("TornTools", "trade");
	initialize();
	Main();
}

function Main(){
	chrome.storage.local.get(["itemlist", "settings"], function(data){
		const tradecalc = data["settings"]["other"]["tradecalc"];
		const itemlist = data["itemlist"]["items"];
		var tradeV = false;

		// CHECK FOR SITE CHANGE
		let checker = setInterval(function(){
			if(tradecalc){
				if(tradeView()){
					if(tradeV === false){
						tradeV = true;
						console.log("CALCULATING")
						subMain(itemlist);
					}
				} else {
					tradeV = false;
					console.log("NOT IN TRADE VIEW")
				}
			} else {
				console.log("TRADE CALCULATOR TURNED OFF")
			}
		}, 1000);
	});
}

async function subMain(itemlist){
	const tradeContainer = document.querySelector(".trade-cont");
	const leftSide = document.querySelector(".trade-cont .user.left");
	const rightSide = document.querySelector(".trade-cont .user.right");
	const adds = document.querySelectorAll(".log li div")

	const leftItems = getLeftItemIDs(itemlist);
	const rightItems = getRightItemIDs(itemlist);

	chrome.storage.local.get(["itemlist"], function(data){
		const itemlist = data["itemlist"]["items"];
		
		console.log(leftItems)
		const leftsidevalue = getItemsValue(leftItems, itemlist);
		displayValue(leftSide, leftsidevalue);
	
		const rightsidevalue = getItemsValue(rightItems, itemlist);
		displayValue(rightSide, rightsidevalue);

		// SHOW VALUES FOR INDEPENDENT ADDS
		for(let add of adds){
			let text = add.innerText
			if(text.indexOf("added") > -1){
				
				// remove unwanted parts
				text = text.replace(/ added/g, "")
				text = text.replace(/ to the trade./g, "")
				text = text.replace(text.split(" ")[0] + " ", "")
				var items = text.split(", ");

				var resultItems = {}

				for(let item of items){
					let name = item.split(" x")[0];
					let q = item.split(" x")[1];
					let id;

					for(let i in itemlist){
						if(itemlist[i]["name"] === name){
							resultItems[i] = q;
						}
					}
				}

				if(Object.keys(resultItems).length){
					var addValue = getItemsValue(resultItems, itemlist);
					displayLogValue(add, addValue);	
				}
			}
		}
		
	});
}

//////////////////////////////
// FUNCTIONS
//////////////////////////////

function tradeView(){
	const tradeContainer = document.querySelector(".trade-cont");
	if(!tradeContainer){
		return false;
	}
	return true
}

function displayValue(side, x){
	let div = document.createElement("div");
	let span = document.createElement("span");

	div.style.height = "30px";
	div.style.lineHeight = "30px";
	div.style.border = "0.5px solid black";
	div.style.fontWeight = "600";
	div.style.paddingLeft = "15px";
	div.innerText = "Items value: "

	span.style.color = "#678c00",
	span.style.fontWeight = "400";
	span.innerText = "$"+String(numberWithCommas(x))

	div.appendChild(span);
	side.appendChild(div);
}

function getLeftItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.left .cont .color2 .desc li .name.left");

	if(items[0].innerText !== "No items in trade"){
		for(let item of items){
			let parts = item.innerText.split(" x");
			let name = parts[0].trim();
			let q = parts[1];
			if(!q){q="1"}

			for(let id in itemlist){
				if(itemlist[id]["name"] === name){
					console.log(name)
					result[id] = q;
				}
			}
		}
		return result;
	}
	return "none";
}

function getRightItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.right .cont .color2 .desc li .name.left");
	if(items.length === 0){
		return "none"
	}

	for(let item of items){
		let parts = item.innerText.split(" x");
		let name = parts[0];
		let q = parts[1];

		for(let id in itemlist){
			if(itemlist[id]["name"] === name){
				result[id] = q;
			}
		}
	}
	return result;
}

function displayLogValue(add, x){
	let span = document.createElement("span");
	
	span.style.float = "right";
	span.style.color = "#678c00";
	span.innerText = "$"+String(numberWithCommas(x))

	add.appendChild(span);
}

function getItemsValue(items, itemlist){
	if(items === "none"){
		return 0;
	}
	var value = 0;
	
	for(let id in items){
		value += parseInt(items[id]) * parseInt(itemlist[id]["market_value"]);
	}	
	return value;
}

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

function tradeView(){
	const tradeContainer = document.querySelector(".trade-cont");
	if(!tradeContainer){
		return false;
	}
	return true
}

function displayValue(side, x){
	let div = document.createElement("div");
	let span = document.createElement("span");

	div.style.height = "30px";
	div.style.lineHeight = "30px";
	div.style.border = "0.5px solid black";
	div.style.fontWeight = "600";
	div.style.paddingLeft = "15px";
	div.innerText = "Items value: "

	span.style.color = "#678c00",
	span.style.fontWeight = "400";
	span.innerText = "$"+String(numberWithCommas(x))

	div.appendChild(span);
	side.appendChild(div);
}

function getLeftItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.left .cont .color2 .desc li .name.left");

	if(items[0].innerText !== "No items in trade"){
		for(let item of items){
			let parts = item.innerText.split(" x");
			let name = parts[0].trim();
			let q = parts[1];
			if(!q){q="1"}

			for(let id in itemlist){
				if(itemlist[id]["name"] === name){
					console.log(name)
					result[id] = q;
				}
			}
		}
		return result;
	}
	return "none";
}

function getRightItemIDs(itemlist){
	var result = {};

	let items = document.querySelectorAll(".user.right .cont .color2 .desc li .name.left");
	if(items.length === 0){
		return "none"
	}

	for(let item of items){
		let parts = item.innerText.split(" x");
		let name = parts[0];
		let q = parts[1];

		for(let id in itemlist){
			if(itemlist[id]["name"] === name){
				result[id] = q;
			}
		}
	}
	return result;
}

function displayLogValue(add, x){
	let span = document.createElement("span");
	
	span.style.float = "right";
	span.style.color = "#678c00";
	span.innerText = "$"+String(numberWithCommas(x))

	add.appendChild(span);
}

function getItemsValue(items, itemlist){
	if(items === "none"){
		return 0;
	}
	var value = 0;
	
	for(let id in items){
		value += parseInt(items[id]) * parseInt(itemlist[id]["market_value"]);
	}	
	return value;
}