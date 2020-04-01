// Extension background starts
console.log("START");

// Chrome or something else?
const chrome = window.chrome || window.browser;

let STORAGE = {
	// app settings
	"api_key": undefined,
	"itemlist": {},
	"torndata": {},
	"userdata": {},
	"update-available": false,
	"updated": true,
	"api": {
		"count": 0,
		"limit": 60,
		"online": true,
		"error": ""
	},
	// user settings
	"networth": {},
	"target_list": {
		"last_target": undefined,
		"show": true,
		"targets": {}
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
				"networth": true,
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
			},
			"profile": {
				"show": true
			},
			"racing": {
				"show": true
			}
		}
	},
	"allies": []
}

chrome.storage.local.get(null, function(old_storage){

	if(!old_storage){
		chrome.storage.local.set(STORAGE, function(){
			console.log("Storage set");
		});
	} else {
		console.log("old", old_storage)
		let new_storage = fillStorage(old_storage, STORAGE);
		console.log("new", new_storage)
		chrome.storage.local.clear(function(){
			chrome.storage.local.set(new_storage, function(){
				console.log("Storage set");
			});
		});
	}

	function fillStorage(old_storage, STORAGE){
		let new_local_storage = {};

		for(let key in STORAGE){
			if(!(key in old_storage)){
				new_local_storage[key] = STORAGE[key];
				continue;
			}
			
			if(typeof STORAGE[key] == "object"){
				if(Array.isArray(STORAGE[key]))
					new_local_storage[key] = old_storage[key];
				else{
					if(Object.keys(STORAGE[key]).length == 0)
						new_local_storage[key] = old_storage[key];
					else
						new_local_storage[key] = fillStorage(old_storage[key], STORAGE[key]);
				}
			} else {
				new_local_storage[key] = old_storage[key];
			}
		}

		return new_local_storage;
	}
});

function Main(){
	// Get user and torn data
	chrome.storage.local.get(["api_key", "api"], function(data){
		const api_key = data.api_key;
		console.log("API_KEY", api_key);

		if(api_key == undefined){
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

			let new_networth = data.networth;

			// set networth
			chrome.storage.local.get(["networth"], function(data){
				if(Object.keys(data.networth).length == 0){
					data.networth = {
						"previous": {
							"value": undefined,
							"date": undefined
						},
						"current": {
							"value": undefined,
							"date": undefined
						}
					}
				} else if(new Date(data.networth.current.date).getDate() != new Date().getDate()){
					console.log("Current:", new Date(data.networth.current.date).getDate());
					console.log("Now:", new Date().getDate());
					data.networth.previous.value = data.networth.current.value;
					data.networth.previous.date = data.networth.current.date;
				}

				data.networth.current.value = new_networth;
				data.networth.current.date = String(new Date());

				chrome.storage.local.set({"networth": data.networth}, function(){
					console.log("Networth set.");

					chrome.storage.local.get(["networth"], function(data){
						console.log("NEW NETWORTH SET", data);
					});
				});
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
		return false;
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

		chrome.alarms.create('updateTargetList', {  // update target list
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
			case "updateTargetList":
				chrome.storage.local.get(["target_list"], function(data){
					if(!data.target_list.show)
						return;
					
					updateTargetList();
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

	function updateTargetList(){
		chrome.storage.local.get(["api_key", "userdata", "target_list"], function(data){
			let user_id = data.userdata.player_id;
			let api_key = data.api_key;
			let targets = data.target_list.targets;
			let attacksfull = true;
			let last_target = data.target_list.last_target || -1;


			if(Object.keys(targets).length > 0)
				attacksfull = false;
			
			get_api(`https://api.torn.com/user/?selections=${attacksfull?'attacksfull':'attacks'}`, api_key).then((data) => {
				if(!data)
					return;

				for(let fight_id in data.attacks){
					if(parseInt(fight_id) <= parseInt(last_target))
						continue;
					
					last_target = fight_id;
					let fight = data.attacks[fight_id];
					let opponent_id = fight.attacker_id == user_id ? fight.defender_id : fight.attacker_id;

					if(!opponent_id)
						continue;
					
					if(!targets[opponent_id]){
						targets[opponent_id] = {
							win: 0,
							lose: 0,
							stealth: 0,
							leave: 0,
							mug: 0,
							hosp: 0,
							assist: 0,
							arrest: 0,
							stalemate: 0,
							defend: 0,
							defend_lose: 0,
							special: 0,
							respect: {
								leave: [],
								mug: [],
								hosp: [],
								arrest: [],
								special: []
							},
							respect_base: {
								leave: [],
								mug: [],
								hosp: [],
								arrest: [],
								special: []
							}
						}
					}
	
					if(fight.attacker_id == user_id){  // user attacked
						if(fight.result == "Lost")
							targets[opponent_id].lose += 1;
						else if(fight.result == "Stalemate")
							targets[opponent_id].stalemate += 1;
						else {
							targets[opponent_id].win += 1;
							let respect = parseFloat(fight.respect_gain);
							
							if(!attacksfull)
								respect = respect / fight.modifiers.war / fight.modifiers.groupAttack / fight.modifiers.overseas / fight.modifiers.chainBonus;

							if(fight.stealthed == "1")
								targets[opponent_id].stealth += 1;
	
							if(fight.result == "Mugged"){
								targets[opponent_id].mug += 1;
								
								if(!attacksfull)
									targets[opponent_id].respect_base.mug.push(respect);
								else
									targets[opponent_id].respect.mug.push(respect);
							} else if(fight.result == "Hospitalized"){
								targets[opponent_id].hosp += 1;
								if(!attacksfull)
									targets[opponent_id].respect_base.hosp.push(respect);
								else
									targets[opponent_id].respect.hosp.push(respect);
							} else if(fight.result == "Attacked"){
								targets[opponent_id].leave += 1;
								if(!attacksfull)
									targets[opponent_id].respect_base.leave.push(respect);
								else
									targets[opponent_id].respect.leave.push(respect);
							} else if(fight.result == "Arrested"){
								targets[opponent_id].arrest += 1;
								if(!attacksfull)
									targets[opponent_id].respect_base.arrest.push(respect);
								else
									targets[opponent_id].respect.arrest.push(respect);
							} else if(fight.result == "Assist"){
								targets[opponent_id].assist += 1;
							} else if(fight.result == "Special"){
								targets[opponent_id].special += 1;
								if(!attacksfull)
									targets[opponent_id].respect_base.special.push(respect);
								else
									targets[opponent_id].respect.special.push(respect);
							}
						}
					} else if(fight.defender_id == user_id){  // user defended
						if(fight.result == "Lost")
							targets[opponent_id].defend += 1;
						else {
							if(!opponent_id)
								continue;
	
							targets[opponent_id].defend_lose += 1;
						}
					}
				}

				targets.date = String(new Date());
				chrome.storage.local.get(["target_list"], function(data){
					data.target_list.targets = targets;
					data.target_list.last_target = last_target;
					chrome.storage.local.set({"target_list": data.target_list}, function(){
						console.log("Target list set.")
					});
				});
			});
		});
	}