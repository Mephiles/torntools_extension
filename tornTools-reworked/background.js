// Extension background starts
console.log("START");

// Chrome or something else?
const chrome = window.chrome || window.browser;

// Set settings
chrome.storage.local.set({
	"update-available": false,
	"updated": true,
	"api": {
		"count": 0,
		"limit": 60,
		"online": true,
		"error": ""
	},
	"settings": {
		"tabs": {
			"market": true,
			"stocks": true,
			"calculator": true,
			"default": "market"
		},
		"achievements": {
			"show": true,
			"show_completed": true
		},
		"pages": {
			"trade": {
				"calculator": true
			},
			"home": {
				"networth": true
			},
			"missions": {
				"show": true
			},
			"city": {
				"show": true,
				"items_value": true
			},
			"hub": {
				"show": false,
				"pinned": false
			}
		}
	}
}, function(){console.log("Settings set.")});


function Main(){
	// Get user and torn data
	chrome.storage.local.get(["api_key", "api"], function(data){
		const api_key = data.api_key;
		console.log("API_KEY", api_key);
		
		if(!data.api.online || api_key === undefined){
			console.log("NO API KEY");
			return;
		}
		
		console.log("================================");
		get_api("https://api.torn.com/user/?selections=personalstats,crimes,battlestats,perks,profile,workstats,stocks,networth", api_key).then((data) => {
			if(!data)
				return
			data.date = String(new Date());
			chrome.storage.local.set({"userdata": data}, function(){
				console.log("Userdata set.")
			});
		});

		get_api("https://api.torn.com/torn/?selections=honors,medals,stocks", api_key).then((data) => {
			if(!data)
				return
			data.date = String(new Date());
			chrome.storage.local.set({"torndata": data}, function(){
				console.log("Torndata set.")
			});
		});

		get_api("https://api.torn.com/torn/?selections=items", api_key).then((data) => {
			if(!data)
				return
			data.date = String(new Date());
			chrome.storage.local.set({"itemlist": data}, function(){
				console.log("Itemlist set.")
			});
		});
	});
}

async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key)
	const result = await response.json()

	if(result.error){
		console.log("API SYSTEM OFFLINE");
		chrome.storage.local.get(["api"], function(data){
			data.api.online = false;
			data.api.error = result.error.error;
			chrome.storage.local.set({"api": data.api}, function(){});
		});
		return false
	} else {
		chrome.storage.local.get(["api"], function(data){
			data.api.online = true;
			data.api.error = "";
			chrome.storage.local.set({"api": data.api}, function(){});
		});
	}

	return result;
}

// ALARMS & CONNECTIONS //

	// Set alarms
		chrome.alarms.create('getMainData', {  // main user and torn data
			periodInMinutes: 1
		});

		chrome.alarms.create('resetApiCount', {  // reset api counter
			periodInMinutes: 1
		});

	// Set alarm listeners (do something every minute)
	chrome.alarms.onAlarm.addListener(function(alarm) {
		switch (alarm.name){
			case "getMainData":
				Main();
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

	// Listen for connections from extension pages
	chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
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

// MAINTENANCE & OTHER //

	// Check whether new version is installed
	chrome.runtime.onInstalled.addListener(function(details){
		chrome.storage.local.set({"updated": true}, function(){
			console.log("Updated.");
		});
	});

	// If update is available
	chrome.runtime.onUpdateAvailable.addListener((details) => {
		chrome.storage.local.set({"update-available": true});
	});

	// Open settings page for the user
	function openOptionsPage(){
		var url = chrome.runtime.getURL("/views/settings.html");

		chrome.tabs.create({
			url: url
		});
	}