console.log("START - Background Script");
import personalized from "../personalized.js";

// First - set storage
console.log("Checking Storage.");
let setup_storage = new Promise(function(resolve, reject){
	local_storage.get(null, function(old_storage){
		if(!old_storage || Object.keys(old_storage).length == 0){  // fresh install
			console.log("Setting new storage.");
			local_storage.set(STORAGE, function(){
				console.log("Storage set");
				return resolve(true);
			});
		} else {  // existing storage
			console.log("Converting old storage.");
			let new_storage = fillStorage(old_storage, STORAGE);
	
			console.log("New storage", new_storage);
			
			local_storage.clear(function(){
				local_storage.set(new_storage, function(){
					console.log("Storage updated");
					return resolve(true);
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
});

setup_storage.then(function(success){
	if(!success)
		return;

	// Second - run every 1 min
	console.log("Setting up intervals.");
	setInterval(Main, 60*1000);  // 1/minute
	setInterval(Main_fast, 15*1000);  // 4/minute
	setInterval(Main_slow, 60*60*1000);  // 1/hour
});

function Main(){
	local_storage.get(["api_key", "networth"], async function([api_key, networth]){

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		console.log("================================");
		console.log("API_KEY", api_key);

		// Clear api count
		console.log("Clearing API count.");
		await (function(){
			let promise = new Promise(function(resolve, reject){
				local_storage.change({"api": {"count": 0}}, function(){
					console.log("API count set to 0");
					return resolve(true);
				});
			});

			return promise.then(function(data){
				return data;
			});
		})();

		// userdata & networth
		console.log("Setting up userdata & networth.");
		let first_fetch_result = await (function(){
			let promise = new Promise(function(resolve, reject){
				get_api("https://api.torn.com/user/?selections=personalstats,crimes,battlestats,perks,profile,workstats,stocks,networth", api_key).then((userdata) => {
					if(!userdata.ok){
						return resolve(userdata);
					}
		
					userdata.date = String(new Date());
					let new_networth = userdata.networth;

					if(networth.current.date && new Date(networth.current.date).getDate() != new Date().getDate()){
						networth.previous.value = networth.current.value;
						networth.previous.date = networth.current.date;
					}

					networth.current.value = new_networth;
					networth.current.date = String(new Date());

					// Set Userdata & Networth
					local_storage.set({"networth": networth, "userdata": userdata}, function(){
						console.log("Userdata set.");
						console.log("Networth set.");
						return resolve(true);
					});
				});
			});

			return promise.then(function(data){
				return data;
			});
		})();

		// STOP IF SOMETHING WRONG WITH API FETCH
		if(!first_fetch_result.ok){
			console.log("(STOPPING) ERROR:", first_fetch_result.error);
			return;
		}

		// torndata & itemlist
		console.log("Setting up torndata & itemlist.");
		await (function(){
			let promise = new Promise(function(resolve, reject){
				get_api("https://api.torn.com/torn/?selections=honors,medals,stocks,items", api_key).then((torndata) => {
					if(!torndata.ok)
						return resolve(torndata);

					let new_date = String(new Date());
					let item_list = {items: {...torndata.items}, date: new_date}
					torndata.date = new_date;
					torndata.items = {};

					local_storage.set({"torndata": torndata, "itemlist": item_list}, function(){
						console.log("Torndata set.");
						console.log("Itemlist set.");
						return resolve(true);
					});
				});
			});

			return promise.then(function(data){
				return data;
			});
		})();

		// faction data
		console.log("Setting up faction data.");
		await (function(){
			return new Promise(function(resolve, reject){
				get_api("https://api.torn.com/faction/?selections=crimes", api_key).then((factiondata) => {
					if(!factiondata.ok){
						return resolve(factiondata);
					}

					let new_date = String(new Date());
					factiondata.crimes.date = new_date;

					local_storage.set({"oc": factiondata.crimes}, function(){
						console.log("Faction data set.");
						return resolve(true);
					});
				});
			});
		})();

		// targetlist
		console.log("Setting up target list.");
		await (function(){
			let promise = new Promise(function(resolve, reject){
				local_storage.get(["target_list", "userdata"], function([target_list, userdata]){
					if(target_list.show){
						return resolve(updateTargetList(api_key, userdata, target_list));
					}
				});
			});

			return promise.then(function(data){
				return data;
			});
		})();

		// loot times
		console.log("Setting up loot times.");
		await (function(){
			let promise = new Promise(async function(resolve, reject){
				let response = await fetch("https://yata.alwaysdata.net/loot/timings/");
				let result = await response.json();

				local_storage.set({"loot_times": result}, function(){
					console.log("Loot times set.");
					return resolve(true);
				})
			});

			return promise.then(function(data){
				return data;
			});
		})();
	});
}

async function Main_fast(){
	// check extensions
	console.log("Checking for installed extensions.");
	await (function(){
		let promise = new Promise(async function(resolve, reject){
			let doctorn_installed = await detectExtension("doctorn");
			console.log("Doctorn installed:", doctorn_installed);
			
			local_storage.change({"extensions": {"doctorn": doctorn_installed}}, function(){
				return resolve(true);
			});
		});

		return promise.then(function(data){
			return data;
		});
	})();
}

async function Main_slow(){
	// Check for personalized scripts
	console.log("Setting up personalized scripts.");
	await (function(){
		let promise = new Promise(function(resolve, reject){
			local_storage.get("userdata", function(userdata){
				if(!userdata)
					return resolve(userdata);

				let personalized_scripts = {}
			
				if(personalized.master == userdata.player_id){
					for(let type in personalized){
						if(type == "master"){
							continue;
						}
			
						for(let id in personalized[type]){
							for(let script of personalized[type][id]){
								personalized_scripts[script] = true;
							}
						}
					}
				} else if(personalized.users[userdata.player_id]){
					for(let script of personalized.users[userdata.player_id]){
						personalized_scripts[script] = true;
					}
				}
			
				local_storage.set({"personalized": personalized_scripts}, function(){
					console.log("Personalized scripts set.");
					return resolve(true);
				});
			});
		});

		return promise.then(function(data){
			return data;
		});
	})();
}

// FUNCTIONS //

// Check if new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	local_storage.set({"updated": true}, function(){
		console.log("Extension updated:", chrome.runtime.getManifest().version);
	});
});

function updateTargetList(api_key, userdata, target_list){
	let promise = new Promise(function(resolve, reject){
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
				return resolve(true);
			});
		});
	});

	return promise.then(function(data){
		return data;
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