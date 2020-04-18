// Extension background starts
console.log("START - Background Script");

// Chrome or something else?
const chrome = window.chrome || window.browser;

const local_storage = {
	get: function(key, callback){
		let promise = new Promise(function(resolve, reject){
			if(Array.isArray(key)){
				let arr = [];
				chrome.storage.local.get(key, function(data){
					for(let item of key){
						arr.push(data[item]);
					}
					resolve(arr);
				});
			} else if(key == null){
				chrome.storage.local.get(null, function(data){
					resolve(data);
				});
			} else {
				chrome.storage.local.get([key], function(data){
					resolve(data[key]);
				});
			}
		});

		promise.then(function(data){
			callback(data);
		});
	},
	set: function(object, callback){
		chrome.storage.local.set(object, function(){
			callback ? callback() : null;
		});
	},
	// local_storage.change("api", {"count": 0});
	change: function(key, keys_to_change, callback){
		chrome.storage.local.get([key], function(data){
			for(let key_to_change of Object.keys(keys_to_change)){
				data[key][key_to_change] = keys_to_change[key_to_change];
			}

			chrome.storage.local.set({key: data[key]}, function(){
				callback ? callback() : null;
			});
		});
	},
	clear: function(callback){
		chrome.storage.local.clear(function(){
			callback ? callback() : null;
		});
	}
}

const STORAGE = {
	// app settings
	"api_key": undefined,
	"itemlist": {},
	"torndata": {},
	"userdata": {},
	"updated": true,
	"api": {
		"count": 0,
		"limit": 60,
		"online": true,
		"error": ""
	},
	"extensions": {
		"doctorn": false
	},
	// user settings
	"networth": {
		"previous": {
			"value": undefined,
			"date": undefined
		},
		"current": {
			"value": undefined,
			"date": undefined
		}
	},
	"target_list": {
		"last_target": undefined,
		"show": true,
		"targets": {}
	},
	"allies": [],
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
			},
			"gym": {
				"show": true
			},
			"shop": {
				"show": true
			}
		}
	}
}

local_storage.get(null, function(old_storage){
	if(!old_storage){  // fresh install
		local_storage.set(STORAGE, function(){
			console.log("Storage set");
		});
	} else {  // existing storage
		let new_storage = fillStorage(old_storage, STORAGE);

		console.log("New storage", new_storage);

		local_storage.clear(function(){
			local_storage.set(new_storage, function(){
				console.log("Storage updated");
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
	local_storage.get("api_key", function(api_key){

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		console.log("API_KEY", api_key);
		
		console.log("================================");
		get_api("https://api.torn.com/user/?selections=personalstats,crimes,battlestats,perks,profile,workstats,stocks,networth", api_key).then((data) => {
			if(!data)
				return;
			
			data.date = String(new Date());
			local_storage.set({"userdata": data}, function(){
				console.log("Userdata set.")
			});

			let new_networth = data.networth;

			// set networth
			local_storage.get("networth", function(networth){
				if(networth.current.date && new Date(networth.current.date).getDate() != new Date().getDate()){
					networth.previous.value = networth.current.value;
					networth.previous.date = networth.current.date;
				}

				networth.current.value = new_networth;
				networth.current.date = String(new Date());

				local_storage.set({"networth": networth}, function(){
					console.log("Networth set.");
				});
			});
		});

		get_api("https://api.torn.com/torn/?selections=honors,medals,stocks,gyms", api_key).then((data) => {
			if(!data)
				return;

			data.date = String(new Date());
			local_storage.set({"torndata": data}, function(){
				console.log("Torndata set.");
			});
		});

		get_api("https://api.torn.com/torn/?selections=items", api_key).then((data) => {
			if(!data)
				return;

			data.date = String(new Date());
			local_storage.set({"itemlist": data}, function(){
				console.log("Itemlist set.");
			});
		});
	});
}

async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key);
	const result = await response.json();

	if(result.error){
		console.log("API SYSTEM OFFLINE");
		local_storage.change("api", {"online": false, "error": result.error.error});
		return false;
	} else
		local_storage.change("api", {"online": true, "error": ""});

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

		chrome.alarms.create('checkForDoctorn', {  // check if DocTorn is in use
			periodInMinutes: 1
		});

	// Set alarm listeners (do something every minute)
	chrome.alarms.onAlarm.addListener(function(alarm) {
		switch (alarm.name){
			case "getMainData":
				Main();
				break;
			case "resetApiCount":
				local_storage.change("api", {"count": 0});
				break;
			case "updateTargetList":
				local_storage.get("target_list", function(target_list){
					if(target_list.show)
						updateTargetList();
				});
				break;
			case "checkForDoctorn":
				local_storage.change("extensions", {"doctorn": detectExtension("doctorn")});
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
			case "getDefaultSettings":
				sendResponse({"response": STORAGE});
			default:
				break;
		}
	});

// MAINTENANCE & OTHER //

	// Check whether new version is installed
	chrome.runtime.onInstalled.addListener(function(details){
		console.log("UPDATE REASON:", details.reason)
		local_storage.set({"updated": true}, function(){
			console.log("Updated");
		});
	});

	// Open settings page for the user
	function openOptionsPage(){
		chrome.tabs.create({
			url: chrome.runtime.getURL("/views/settings.html")
		});
	}

	function updateTargetList(){
		local_storage.get(["api_key", "userdata", "target_list"], function([api_key, userdata, target_list]){
			let user_id = userdata.player_id;
			let targets = target_list.targets;
			let attacksfull = true;
			let last_target = target_list.last_target || -1;

			if(api_key == undefined)
				return;

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
				local_storage.change("target_list", {"targets": targets, "last_target": last_target}, function(){
					console.log("Target list set");
				});
			});
		});
	}

function detectExtension(ext, callback){
	let ids = {
		"doctorn": 'kfdghhdnlfeencnfpbpddbceglaamobk'
	}

	let promise = new Promise(function(resolve, reject){
		var img;
		img = new Image();
		img.src = `chrome-extension://${ids[ext]}/resources/images/icon_16.png`;
		img.onload = function() {
			resolve(true);
		};
		img.onerror = function() {
			resolve(false);
		};
	});

	return promise.then(function(data){
		return data;
	});
}
