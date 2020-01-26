const chrome = browser;
window.onload = () => {
	console.log("TornTools", "auction");
	initialize();
	Main();
}

function Main(){
	chrome.storage.local.get(["settings"], function(data){
		const settings = data["settings"];
		const auc = settings["other"]["auction"];

		if(auc){
			setUpAuctionWindow();
			var initialCount;

			// OPEN ALL TABS
			initialCount = openAllAuctionTabs();
			
			let b = setInterval(function(){
				var listings = document.querySelectorAll(".items-list.t-blue-cont.h li");
				if(listings.length > initialCount){
					for(let item of listings){
						for(let clas of item.classList){
							if(clas === "bg-blue"){
								addAuctionListing(item);
							}
						}
					}
					clearInterval(b);
				}
			}, 500)
		} else {
			console.log("AUCTIONS TURNED OFF");
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

function openAllAuctionTabs(){
	// LOAD ALL ITEMS
	const tabs = document.querySelectorAll("ul.tabs.tabs-order.t5.dark.clearfix.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all li a");
	for(let tab of tabs){
		tab.click();
	}
	tabs[0].click(); // RETURN TO FIRST

	const listings = document.querySelectorAll(".items-list.t-blue-cont.h li");
	return listings.length;
}

function setUpAuctionWindow(){
	const main = document.querySelector(".auction-market-main-cont")
	const firstEl = document.querySelector(".after-msg-show")
	let container = document.createElement("div");
	let header = document.createElement("div");
	let clear = document.createElement("div");

	container.style.height = "180px";
	container.style.backgroundColor = "#F2F2F2";
	container.style.marginBottom = "10px";
	container.style.borderRadius = "8px";
	container.id = "ttListings"
	
	header.classList.add("title-brown");
	header.classList.add("top-round");
	header.innerText = "Your listings";
	header.style.color = "#36d136";

	clear.classList.add("clear");

	container.appendChild(header);
	main.insertBefore(clear, firstEl)
	main.insertBefore(container, clear);
}

function addAuctionListing(item){
	const container = document.querySelector("#ttListings");
	let div = document.createElement("div");
	let title = document.createElement("div");
	let high_bid = document.createElement("div");
	let time = document.createElement("div");
	let hr = document.createElement("hr");

	div.style.width = "20%";
	div.style.height = "120px";
	div.style.border = "0.5px solid lightgrey";
	div.style.borderTopLeftRadius = "10px";
	div.style.borderTopRightRadius = "10px";
	div.style.margin = "2.5%";
	div.style.float = "left";

	let bid = item.children[3].innerText.replace("Top bid:", "").replace(/\r?\n|\r/g, "").replace(" ", "");
	high_bid.innerHTML = "Highest bid: <br><span style='color: #678c00'>" + String(numberWithCommas(bid)) + "</span>";
	high_bid.style.marginLeft = "5px";
	high_bid.style.marginTop = "7px";
	high_bid.style.marginBottom = "7px";
	// high_bid.style.paddingBottom = "23px";
	high_bid.style.fontSize = "17px";
	high_bid.style.fontWeight = "600";

	let timeLeft = item.children[5].children[1].children[0].innerText.replace(/\r?\n|\r/g, "").replace(" ", "");
	time.innerText = "Time left: " + String(timeLeft);
	time.style.marginLeft = "5px";
	time.style.marginTop = "7px";
	time.style.fontSize = "17px";
	time.style.fontWeight = "600";

	if(timeLeft.indexOf("d") === -1){
		time.style.color = "red";
	} else {
		time.style.color = "black";	
	}
	
	title.classList.add("top-round");
	title.innerText = item.children[0].children[1].children[0].innerText;
	title.classList.add("title-gray");

	div.appendChild(title);
	div.appendChild(high_bid);
	div.appendChild(hr);
	div.appendChild(time);
	container.appendChild(div);
}