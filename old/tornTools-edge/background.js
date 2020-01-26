console.log("START");

const links = {
	itemlist: "https://api.torn.com/torn/?selections=items",
	userdata: "https://api.torn.com/user/?selections=personalstats,crimes,battlestats,perks,profile,workstats,stocks",
	torndata: "https://api.torn.com/torn/?selections=honors,stocks",
	inventory: "https://api.torn.com/user/?selections=inventory"
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	switch (alarm.name){
		case "getMainData":
			chrome.storage.local.get(["api_key"], function(data){
				const api_key = data["api_key"];
		    	getData(api_key);
			});
			break;
		case "resetApiCount":
			chrome.storage.local.set({"api_count": 0}, function(){
				console.log("API counter reset.")
			});
			break;
		default:
			break;
	}
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.action) {
        case "openOptionsPage":
            openOptionsPage();
            break;
        case "START":
        	Main();
        	break;
        case "getApiCounterInfo":
        	sendResponse({"response": [2,3]})
        	break;
        default:
            break;
    }
});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
    chrome.storage.local.set({"update": true}, function(){
    	console.log("Updated.");
    });
});

function Main(){
	// MAIN DATA LOOP
	chrome.alarms.create('getMainData', {
		periodInMinutes: 1
	});

	// API COUNTER RESET LOOP
	chrome.alarms.create('resetApiCount', {
		periodInMinutes: 1
	});

	// SET SETTINGS
	chrome.storage.local.set({"settings": {
		"default_window": "market",
		"tabs": ["market", "stocks", "calculator"],
		"other": {
			"achievements": true,
			"completed": true,
			"tradecalc": true,
			"networth": true,
			"ct": false,
			"bazaar": false,
			"auction": true,
			"missionValues": true,
			"forums": true,
			"forumsScrollTop": true
		}
	}}, function(){
		console.log("Settings set.")
	})
	
	// GET DATA FIRST TIME
	chrome.storage.local.get(["api_key"], function(data){
		const api_key = data["api_key"];

		getTornItemList(api_key);
		getData(api_key);
	});

	// SET API COUNTER AND LIMIT
	chrome.storage.local.set({
		"api_count": 0,
		"api_limit": 60
	}, function(){
		console.log("API COUNT AND LIMIT SET.")
	});
}

function getData(api_key){
	get_api(links.userdata, api_key).then((data) => {
		chrome.storage.local.set({"userdata": data}, function(){
			console.log("Userdata set.")
		});
	})

	get_api(links.torndata, api_key).then((data) => {
		chrome.storage.local.set({"torndata": data}, function(){
			console.log("Torndata set.")
		});
	})
}

function getLowest(lists){
	var lowest;

	for(let list of lists){
		for(let id in list){
			let price = parseInt(data[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}

function getTornItemList(api_key){
	get_api(links.itemlist, api_key).then((data) => {
		chrome.storage.local.set({"itemlist": data}, function(){
			console.log("Itemlist set.")
		});
	})
}

async function get_api(http, api_key) {
  	const response = await fetch(http + "&key=" + api_key)
  	return await response.json()
}

function openOptionsPage(){
    chrome.runtime.openOptionsPage();
}