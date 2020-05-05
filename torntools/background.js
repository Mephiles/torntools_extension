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
	change: function(key, keys_to_change, callback){
		chrome.storage.local.get([key], function(data){
			for(let key_to_change of Object.keys(keys_to_change)){
				data[key][key_to_change] = keys_to_change[key_to_change];
			}

			chrome.storage.local.set({[key]: data[key]}, function(){
				callback ? callback() : null;
			});
		});
	},
	clear: function(callback){
		chrome.storage.local.clear(function(){
			callback ? callback() : null;
		});
	},
	reset: function(callback){
		chrome.storage.local.get(["api_key"], function(data){
			let api_key = data.api_key;
			chrome.storage.local.clear(function(){
				chrome.storage.local.set(STORAGE, function(){
					chrome.storage.local.set({
						"api_key": api_key
					}, function(){
						chrome.storage.local.get(null, function(data){
							console.log("Storage cleared");
							console.log("New storage", data);
							callback ? callback() : null;
						});
					});
				});
			});
		});
	}
}

const STORAGE = {
	// app settings
	"api_key": undefined,
	"itemlist": {},
	"torndata": {},
	"userdata": {},
	"updated": "force_true",
	"show_update_notification": true,
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
		"last_target": -1,
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
			},
			"profile": {
				"show": true
			},
			"racing": {
				"show": true
			},
			"gym": {
				"show": true,
				"disable_buttons": false
			},
			"shop": {
				"show": true
			},
			"casino": {
				"show": true,
				"hilo": true,
				"blackjack": true
			},
			"items": {
				"prices": true
			},
			"travel": {
				"profit": true
			}
		}
	}
}

// First - set storage
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
			
			if(typeof STORAGE[key] == "object" && !Array.isArray(STORAGE[key])){
				if(Object.keys(STORAGE[key]).length == 0)
					new_local_storage[key] = old_storage[key];
				else
					new_local_storage[key] = fillStorage(old_storage[key], STORAGE[key]);
			} else {
				if(STORAGE[key] == "force_false")
					new_local_storage[key] = false;
				else if(STORAGE[key] == "force_true")
					new_local_storage[key] = true;
				else if(typeof STORAGE[key] == "string" && STORAGE[key].indexOf("force_") > -1)
					new_local_storage[key] = STORAGE[key].split(/_(.+)/)[1];
				else
					new_local_storage[key] = old_storage[key];
			}
			
		}

		return new_local_storage;
	}
});

// Second - run every 1 min
let main_interval = setInterval(Main, 60*1000);
let api_counter_interval = setInterval(function(){
	local_storage.change("api", {"count": 0});
}, 60*1000);

function Main(){
	local_storage.get("api_key", async function(api_key){

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		console.log("================================");
		console.log("API_KEY", api_key);
		
		// userdata & networth
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

		// torndata
		get_api("https://api.torn.com/torn/?selections=honors,medals,stocks,gyms", api_key).then((data) => {
			if(!data)
				return;

			data.date = String(new Date());
			local_storage.set({"torndata": data}, function(){
				console.log("Torndata set.");
			});
		});

		// itemlist
		get_api("https://api.torn.com/torn/?selections=items", api_key).then((data) => {
			if(!data)
				return;

			data.date = String(new Date());
			local_storage.set({"itemlist": data}, function(){
				console.log("Itemlist set.");
			});
		});

		// targetlist
		local_storage.get("target_list", function(target_list){
			if(target_list.show)
				updateTargetList();
		});

		// check extensions
		let doctorn_installed = await detectExtension("doctorn");
		console.log("Doctorn installed:", doctorn_installed);
		local_storage.change("extensions", {"doctorn": doctorn_installed});
	});
}

// MAINTENANCE & OTHER //

	// Check whether new version is installed
	chrome.runtime.onInstalled.addListener(function(details){
		local_storage.set({"updated": true}, function(){
			console.log("Extension updated:", chrome.runtime.getManifest().version);
		});
	});

function updateTargetList(){
	local_storage.get(["api_key", "userdata", "target_list"], function([api_key, userdata, target_list]){
		let first_time = Object.keys(target_list.targets).length == 0 ? true : false;
		let user_id = userdata.player_id;

		if(api_key == undefined || Object.keys(userdata).length == 0)
			return;
		
		get_api(`https://api.torn.com/user/?selections=${first_time?'attacksfull':'attacks'}`, api_key).then((data) => {
			if(!data)
				return;

			for(let fight_id in data.attacks){
				if(parseInt(fight_id) <= parseInt(target_list.last_target))
					continue;
				
				target_list.last_target = fight_id;
				let fight = data.attacks[fight_id];
				let opponent_id = fight.attacker_id == user_id ? fight.defender_id : fight.attacker_id;


				if(!opponent_id)
					continue;
				
				if(!target_list.targets[opponent_id]){
					target_list.targets[opponent_id] = {
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

				if(fight.defender_id == user_id){  // user defended
					if(fight.result == "Lost")
						target_list.targets[opponent_id].defend++;
					else
						target_list.targets[opponent_id].defend_lose++;
				} else if(fight.attacker_id == user_id){  // user attacked
					if(fight.result == "Lost")
						target_list.targets[opponent_id].lose++;
					else if(fight.result == "Stalemate")
						target_list.targets[opponent_id].stalemate++;
					else {
						target_list.targets[opponent_id].win++;
						let respect = parseFloat(fight.respect_gain);

						if(!first_time)
							respect = respect / fight.modifiers.war / fight.modifiers.groupAttack / fight.modifiers.overseas / fight.modifiers.chainBonus;  // get base respect
						
						if(fight.stealthed == "1")
							target_list.targets[opponent_id].stealth++;

						switch(fight.result){
							case "Mugged":
								target_list.targets[opponent_id].mug++;

								first_time ? target_list.targets[opponent_id].respect.mug.push(respect) : target_list.targets[opponent_id].respect_base.mug.push(respect);
								break;
							case "Hospitalized":
								target_list.targets[opponent_id].hosp++;

								first_time ? target_list.targets[opponent_id].respect.hosp.push(respect) : target_list.targets[opponent_id].respect_base.hosp.push(respect);
								break;
							case "Attacked":
								target_list.targets[opponent_id].leave++;

								first_time ? target_list.targets[opponent_id].respect.leave.push(respect) : target_list.targets[opponent_id].respect_base.leave.push(respect);
								break;
							case "Arrested":
								target_list.targets[opponent_id].arrest++;

								first_time ? target_list.targets[opponent_id].respect.arrest.push(respect) : target_list.targets[opponent_id].respect_base.arrest.push(respect);
								break;
							case "Special":
								target_list.targets[opponent_id].special++;
								
								first_time ? target_list.targets[opponent_id].respect.special.push(respect) : target_list.targets[opponent_id].respect_base.special.push(respect);
								break;
							case "Assist":
								target_list.targets[opponent_id].assist++;
								break;
						}
					}
				}
			}

			target_list.targets.date = String(new Date());
			local_storage.set({"target_list": target_list}, function(){
				console.log("Target list set");
			});
		});
	});
}

function detectExtension(ext){
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