console.log("START - Background Script");
import personalized from "../personalized.js";

var notifications = {
	'travel': {},
	"hospital": {},
	"loot": {},
	"events": {},
	"messages": {},
	"stakeouts": {}
};

// First - set storage
console.log("Checking Storage.");
let setup_storage = new Promise(function(resolve, reject){
	local_storage.get(null, function(old_storage){
		if(!old_storage || Object.keys(old_storage).length == 0){  // fresh install
			console.log("	Setting new storage.");
			local_storage.set(STORAGE, function(){
				console.log("	Storage set");
				return resolve(true);
			});
		} else {  // existing storage
			console.log("Converting old storage.");
			let new_storage = convertStorage(old_storage, STORAGE);
	
			console.log("	New storage", new_storage);
			
			local_storage.clear(function(){
				local_storage.set(new_storage, function(){
					console.log("	Storage updated.");
					return resolve(true);
				});
			});
		}
	
		function convertStorage(old_storage, STORAGE){
			let new_local_storage = {};
	
			for(let key in STORAGE){
				// Key not in old storage
				if(!(key in old_storage)){
					new_local_storage[key] = STORAGE[key];
					continue;
				}

				// Key has new type
				if(typeof STORAGE[key] != "undefined" && typeof STORAGE[key] != typeof old_storage[key]){
					new_local_storage[key] = STORAGE[key];
					continue;
				} 
				
				if(typeof STORAGE[key] == "object" && !Array.isArray(STORAGE[key])){
					if(Object.keys(STORAGE[key]).length == 0)
						new_local_storage[key] = old_storage[key];
					else
						new_local_storage[key] = convertStorage(old_storage[key], STORAGE[key]);
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

setup_storage.then(async function(success){
	if(!success){
		return;
	}

	// Set doctorn as force_false if on firefox first time
	console.log("Checking Doctorn settings.")
	await (function(){
		return new Promise(function(resolve, reject){
			if(!usingChrome()){
				local_storage.get("extensions", function(extensions){
					if(extensions.doctorn == undefined){
						local_storage.change({"extensions": {
							"doctorn": "force_false"
						}}, function(){
							console.log("	Set doctorn as force_false");
							return resolve(true);
						});
					} else {
						return resolve(true);
					}
				});
			} else {
				console.log("	All good.");
				return resolve(true);
			}
		});
	})();
	
	// Check for personalized scripts
	console.log("Setting up personalized scripts.");
	if(Object.keys(personalized).length != 0){
		await (function(){
			return new Promise(function(resolve, reject){
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
						console.log("	Personalized scripts set.");
						return resolve(true);
					});
				});
			});
		})();
	} else {
		console.log("	Empty file.");
	}

	// Second - run every 1 min
	console.log("Setting up intervals.");
	setInterval(Main, 60*1000);  // 1/minute
	setInterval(Main_yata, 60*1000); // 1/minute
	setInterval(Main_fast, 15*1000);  // 4/minute
	setInterval(Main_extra_fast, 5*1000);  // 15/minute
});

function Main(){
	local_storage.get("api_key", async function(api_key){

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		console.log("================================");
		console.log("API_KEY", api_key);

		// Clear api count
		// console.log("Clearing API count.");
		// await (function(){
		// 	return new Promise(function(resolve, reject){
		// 		local_storage.change({"api": {"count": 0}}, function(){
		// 			console.log("	API count set to 0");
		// 			return resolve(true);
		// 		});
		// 	});
		// })();

		// networth
		console.log("Setting up networth.");
		let first_fetch_result = await (function(){
			return new Promise(function(resolve, reject){
				get_api("https://api.torn.com/user/?selections=personalstats,networth", api_key).then((data) => {
					if(data.ok != undefined && !data.ok){
						return resolve(data);
					}

					let ps = data.personalstats;
					let new_networth = data.networth;
					let networth = {
						current: {
							date: new Date().toString(),
							value: new_networth
						}, 
						previous: {
							value: {
								"pending": ps.networthpending,
								"wallet": ps.networthwallet,
								"bank": ps.networthbank,
								"points": ps.networthpoints,
								"cayman": ps.networthcayman,
								"vault": ps.networthvault,
								"piggybank": ps.networthpiggybank,
								"items": ps.networthitems,
								"displaycase": ps.networthdisplaycase,
								"bazaar": ps.networthbazaar,
								"properties": ps.networthproperties,
								"stockmarket": ps.networthstockmarket,
								"auctionhouse": ps.networthauctionhouse,
								"company": ps.networthcompany,
								"bookie": ps.networthbookie,
								"loan": ps.networthloan,
								"unpaidfees": ps.networthunpaidfees,
								"total": ps.networth
							}
						}
					}

					// Set Userdata & Networth
					local_storage.set({"networth": networth}, function(){
						console.log("	Networth set.");
						return resolve(true);
					});
				});
			});
		})();

		// STOP IF SOMETHING WRONG WITH API FETCH
		if(first_fetch_result.ok != undefined && !first_fetch_result.ok){
			console.log("(STOPPING) ERROR:", first_fetch_result.error);
			return;
		}

		// torndata & itemlist
		console.log("Setting up torndata & itemlist.");
		await (function(){
			return new Promise(function(resolve, reject){
				get_api("https://api.torn.com/torn/?selections=honors,medals,stocks,items", api_key).then((torndata) => {
					if(torndata.ok != undefined && !torndata.ok)
						return resolve(torndata);

					let new_date = String(new Date());
					let item_list = {items: {...torndata.items}, date: new_date}
					torndata.date = new_date;
					torndata.items = {};

					local_storage.set({"torndata": torndata, "itemlist": item_list}, function(){
						console.log("	Torndata set.");
						console.log("	Itemlist set.");
						return resolve(true);
					});
				});
			});
		})();

		// faction data
		console.log("Setting up faction data.");
		await (function(){
			return new Promise(function(resolve, reject){
				get_api("https://api.torn.com/faction/?selections=crimes", api_key).then((factiondata) => {
					if(factiondata.ok != undefined && !factiondata.ok){
						return resolve(factiondata);
					}

					let new_date = String(new Date());
					factiondata.crimes.date = new_date;

					local_storage.set({"oc": factiondata.crimes}, function(){
						console.log("	Faction data set.");
						return resolve(true);
					});
				});
			});
		})();

		// check stocks alerts
		console.log("Checking stock prices.");
		await (function(){
			return new Promise(function(resolve, reject){
				let notified = false;
				local_storage.get(["stock_alerts", "torndata"], function([stock_alerts, torndata]){
					for(let stock_id in stock_alerts){
						if(parseFloat(torndata.stocks[stock_id].current_price) >= parseFloat(stock_alerts[stock_id].reach)){
							console.log("Notifiying of reaching price point.");
							notified = true;
	
							notifyUser(
								"TornTools - Stock alerts", 
								`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has reached $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].reach})`
							);
	
							local_storage.change({"stock_alerts": {
								[stock_id]: {
									"reach": undefined
								}
							}});
						} else if(parseFloat(torndata.stocks[stock_id].current_price) <= parseFloat(stock_alerts[stock_id].fall)){
							console.log("Notifiying of reaching price point.");
							notified = true;
							
							notifyUser(
								"TornTools - Stock alerts",
								`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has fallen to $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].fall})`
							);
	
							local_storage.change({"stock_alerts": {
								[stock_id]: {
									"fall": undefined
								}
							}});
						}
					}
					if(!notified){
						console.log("	No new stock notifications.");
					}
					return resolve(true);
				});
			});
		})();

		// check NPC loot alerts
		console.log("Checking NPC loot times.");
		await (function(){
			return new Promise(function(resolve, reject){
				let notified = false;
				local_storage.get(["loot_alerts", "loot_times"], function([loot_alerts, loot_times]){
					let current_time = parseInt(((new Date().getTime())/ 1000).toFixed(0));
	
					for(let npc_id in loot_alerts){
						let alert_level = loot_alerts[npc_id].level;
						if(!alert_level){
							continue;
						}
	
						let alert_loot_time = loot_times[npc_id].timings[alert_level].ts;
	
						if(!loot_alerts[npc_id].time){
							continue;
						}
	
						if(loot_times[npc_id].levels.next <= alert_level && alert_loot_time - current_time <= parseFloat(loot_alerts[npc_id].time)*60){
							if(time_until((alert_loot_time - current_time)*1000) == -1){
								continue;
							}

							let checkpoint = loot_alerts[npc_id].time.toString();
							if(!notifications.loot[checkpoint+"_"+npc_id]){
								notifications.loot[checkpoint+"_"+npc_id] = {
									title: "TornTools - NPC Loot",
									text: `${loot_times[npc_id].name} is reaching loot level ${arabicToRoman(alert_level)} in ${time_until((alert_loot_time - current_time)*1000)}`,
									seen: 0,
									date: new Date()
								}
								console.log("	Added Loot time to notifications.");
								notified = true;
							}
						}
					}
					if(!notified){
						console.log("	No new loot notifications.");
					}
					return resolve(true);
				});
			});
		})();

		// check extensions
		console.log("Checking for installed extensions.");
		await (function(){
			return  new Promise(function(resolve, reject){
				local_storage.get("extensions", async function(extensions){
					if(typeof extensions.doctorn == "string" && extensions.doctorn.indexOf("force") > -1){
						return;
					}

					if(usingChrome()){
						let doctorn_installed = await detectExtension("doctorn");
						console.log("	Doctorn installed:", doctorn_installed);
						
						local_storage.change({"extensions": {"doctorn": doctorn_installed}}, function(){
							return resolve(true);
						});
					} else {
						console.log("	Using Firefox.");
					}
				});
			});
		})();
	});
}

async function Main_yata(){
	// loot times
	console.log("Setting up loot times.");
	await (function(){
		return new Promise(async function(resolve, reject){
			let response = await fetch("https://yata.alwaysdata.net/loot/timings/");
			let result = await response.json();

			local_storage.set({"loot_times": result}, function(){
				console.log("	Loot times set.");
				return resolve(true);
			});
		});
	})();

	// travel markets
	console.log("Setting up Travel market info.");
	await (function(){
		return new Promise(async function(resolve, reject){
			let response = await fetch("https://yata.alwaysdata.net/bazaar/abroad/export/");
			let result = await response.json();

			local_storage.set({"travel_market": result.stocks}, function(){
				console.log("	Travel market info set.");
				return resolve(true);
			});
		});
	})();
}

function Main_fast(){
	local_storage.get(["api_key", "target_list", "stakeouts"], async function([api_key, target_list, stakeouts]){
		let attack_history;

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		if(target_list.show){
			if(target_list.last_target == -1){
				attack_history = "attacksfull";
			} else {
				attack_history = "attacks";
			}
		}

		// userdata
		console.log("Setting up userdata.");
		await (function(){
			return new Promise(function(resolve, reject){
				let selections = `personalstats,crimes,battlestats,perks,profile,workstats,stocks,travel,bars,cooldowns,money,events,messages,education${attack_history? `,${attack_history}`:''}`;
				// console.log("---------selections", selections);

				local_storage.get(["settings", "userdata"], function([settings, previous_userdata]){
					get_api(`https://api.torn.com/user/?selections=${selections}`, api_key).then(async (userdata) => {
						if(userdata.ok != undefined && !userdata.ok){
							return resolve(userdata);
						}
			
						// Target list
						if(userdata.attacks){
							let attacks_data = {...userdata.attacks}
							updateTargetList(attacks_data, userdata.player_id, target_list, (attack_history == "attacksfull" ? true : false));
						}
	
						// Check for new messages
						let message_count = 0;
						for(let message_key of Object.keys(userdata.messages).reverse()){
							let message = userdata.messages[message_key];

							if(message.seen == 0){
								if(!notifications.messages[message_key]){
									notifications.messages[message_key] = {
										title: `TornTools - New Message by ${message.name}`,
										text: message.title,
										seen: 0,
										date: new Date()
									}
								}
								message_count++;
							} else {
								break;
							}
						}
						
						// Check for new events
						let event_count = 0;
						for(let event_key of Object.keys(userdata.events).reverse()){
							let event = userdata.events[event_key];
	
							if(event.seen == 0){
								if(!notifications.events[event_key]){
									notifications.events[event_key] = {
										title: `TornTools - New Event`,
										text: event.event.replace(/<\/?[^>]+(>|$)/g, ""),
										seen: 0,
										date: new Date()
									}
								}
								event_count++;
							} else {
								break;
							}
						}

						// Messages & Events badge
						if(event_count > 0 && message_count > 0){
							setBadge(`${message_count}/${event_count}`, {color: "#1ed2ac"});
						} else if(event_count > 0){
							setBadge("new_event", {count: event_count});
						} else if(message_count > 0){
							setBadge("new_message", {count: message_count});
						} else if(!isNaN(await getBadgeText())){
							setBadge("");
						}
						
						// Check for Status change
						if(previous_userdata.status && settings.notifications.status){
							let current_status = userdata.status.state;
							let previous_status = previous_userdata.status.state;
							
							if(!(current_status == previous_status || current_status == "Traveling" || current_status == "Abroad")){
								if(current_status == "Okay"){
									if(previous_status == "Hospital"){
										notifyUser("TornTools - Status", `You are out of the hospital.`);
									} else if(previous_status == "Jail"){
										notifyUser("TornTools - Status", `You are out of the jail.`);
									}
								} else {
									notifyUser("TornTools - Status", userdata.status.description);
								}
							} 
						}

						// Check for cooldowns
						if(previous_userdata.cooldowns && settings.notifications.cooldowns){
							for(let cd_type in userdata.cooldowns){
								if(userdata.cooldowns[cd_type] == 0 && previous_userdata.cooldowns[cd_type] != 0){
									notifyUser("TornTools - Cooldowns", `Your ${cd_type} cooldown has ended`);
								}
							}
						}

						// Check for education
						if(previous_userdata.education_timeleft && settings.notifications.education){
							if(userdata.education_timeleft == 0 && previous_userdata.education_timeleft != 0){
								notifyUser("TornTools - Education", `You have finished your education course`);
							}
						}

						// Check for travelling
						if(previous_userdata.travel && settings.notifications.traveling){
							if(userdata.travel.time_left == 0 && previous_userdata.travel.time_left != 0){
								notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}`);
							}
						}

						// Check for bars
						for(let bar of ["energy", "happy", "nerve", "life"]){
							if(previous_userdata[bar] && settings.notifications[bar].length > 0){
								for(let checkpoint of settings.notifications[bar].sort(function(a,b){return b-a})){
									if(previous_userdata[bar].current < userdata[bar].current && (userdata[bar].current/userdata[bar].maximum)*100 >= checkpoint){
										notifyUser("TornTools - Bars", `Your ${capitalize(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum} (${checkpoint}%)`);
										break;
									}
								}
							}
						}

						// Check for hospital notification
						if(settings.notifications.hospital.length > 0 && userdata.status.state == "Hospital"){
							for(let checkpoint of settings.notifications.hospital.sort(function(a,b){return a-b})){
								let time_left = new Date(userdata.status.until*1000) - new Date(); // ms

								if(time_left <= checkpoint*60*1000 && !notifications.hospital[checkpoint]){
									notifications.hospital[checkpoint] = {
										title: "TornTools - Hospital",
										text: `You will be out of the Hospital in ${Math.floor(time_left/1000/60)} minutes ${(time_left/1000 % 60).toFixed(0)} seconds`,
										seen: 0,
										date: new Date()
									};
									break;
								}
							}
						} else {
							notifications.hospital = {}
						}

						// Check for travel notification
						if(settings.notifications.landing.length > 0 && userdata.travel.time_left > 0){
							for(let checkpoint of settings.notifications.landing.sort(function(a,b){return a-b})){
								let time_left = new Date(userdata.travel.timestamp*1000) - new Date(); // ms

								if(time_left <= checkpoint*60*1000 && !notifications.travel[checkpoint]){
									notifications.travel[checkpoint] = {
										checkpoint: checkpoint,
										title: "TornTools - Travel",
										text: `You will be Landing in ${Math.floor(time_left/1000/60)} minutes ${(time_left/1000 % 60).toFixed(0)} seconds`,
										seen: 0,
										date: new Date()
									};
									break;
								}
							}
						} else {
							notifications.travel = {}
						}

						userdata.date = String(new Date());
						userdata.attacks = undefined;
	
						// Set Userdata
						local_storage.set({"userdata": userdata}, function(){
							console.log("	Userdata set.");
							return resolve(true);
						});
					});
				});
			});
		})();

		// stakeouts
		if(Object.keys(stakeouts).length > 0){
			console.log("Checking stakeouts.");
			for(let user_id of Object.keys(stakeouts)){
				await (function(){
					return new Promise(function(resolve, reject){
						get_api(`https://api.torn.com/user/${user_id}?`, api_key)
						.then(stakeout_info => {
							console.log(`	Checking ${stakeout_info.name} [${user_id}]`);

							if(stakeouts[user_id].online){
								if(stakeout_info.last_action.status == "Online" && !notifications.stakeouts[user_id+"_online"]){
									console.log("	Adding [online] notification to notifications.");
									notifications.stakeouts[user_id+"_online"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Online`,
										seen: 0,
										date: new Date()
									}
								} else if(stakeout_info.last_action.status != "Online"){
									delete notifications.stakeouts[user_id+"_online"];
								}
							}
							if(stakeouts[user_id].okay){
								if(stakeout_info.status.state == "Okay" && !notifications.stakeouts[user_id+"_okay"]){
									console.log("	Adding [okay] notification to notifications.");
									notifications.stakeouts[user_id+"_okay"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Okay`,
										seen: 0,
										date: new Date()
									}
								} else if(stakeout_info.status.state != "Okay"){
									delete notifications.stakeouts[user_id+"_okay"];
								}
							}
							if(stakeouts[user_id].lands){
								if(stakeout_info.status.state != "Traveling" && !notifications.stakeouts[user_id+"_lands"]){
									console.log("	Adding [lands] notification to notifications.");
									notifications.stakeouts[user_id+"_lands"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now ${stakeout_info.status.state == "Abroad" ? stakeout_info.status.description : "in Torn"}`,
										seen: 0,
										date: new Date()
									}
								} else if(stakeout_info.status.state == "Traveling"){
									delete notifications.stakeouts[user_id+"_lands"];
								}
							}

							let all_false = true;
							for(let option in stakeouts[user_id]){
								if(stakeouts[user_id][option] == true){
									all_false = false;
								}
							}

							if(all_false){
								local_storage.change({"stakeouts": {[user_id]: undefined}});
							}
							return resolve(true);
						});
					});
				})();
			}
		} else {
			console.log("No stakeouts.");
		}
	});
}

function Main_extra_fast(){
	// Notifications
	console.log(notifications);
	for(let notification_type in notifications){
		for(let notification_key in notifications[notification_type]){
			if(notifications[notification_type][notification_key].seen == 0){
				notifyUser(
					notifications[notification_type][notification_key].title,
					notifications[notification_type][notification_key].text
				);

				notifications[notification_type][notification_key].seen = 1;
			}

			if(notifications[notification_type][notification_key].seen == 1 && (new Date() - notifications[notification_type][notification_key].date) > 15*60*1000){
				// notifications[notification_type][notification_key] = undefined;
				delete notifications[notification_type][notification_key];
			}
		}
	}
}

// FUNCTIONS //

// Check if new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	local_storage.set({"updated": true, "new_version": {"available": false}}, function(){
		console.log("Extension updated:", chrome.runtime.getManifest().version);
	});
});

// Update available
chrome.runtime.onUpdateAvailable.addListener(function(details){
	console.log("Details", details);

	setBadge("update_available");

	local_storage.set({"new_version": {
		"available": true,
		"version": details.version
	}});
});

function updateTargetList(attacks_data, player_id, target_list, first_time){
	console.log("Updating Target list");

	for(let fight_id in attacks_data){
		if(parseInt(fight_id) <= parseInt(target_list.last_target)){
			continue;
		}

		target_list.last_target = fight_id;
		let fight = attacks_data[fight_id];
		let opponent_id = fight.attacker_id == player_id ? fight.defender_id : fight.attacker_id;

		if(!opponent_id){
			continue;
		}

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

		if(fight.defender_id == player_id){  // user defended
			if(fight.result == "Lost"){
				target_list.targets[opponent_id].defend++;
			} else {
				target_list.targets[opponent_id].defend_lose++;
			}
		} else if(fight.attacker_id == player_id){  // user attacked
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

	target_list.targets.date = new Date().toString();
	local_storage.set({"target_list": target_list}, function(){
		console.log("	Target list set");
	});
}

async function detectExtension(ext){
	let ids = {
		"doctorn": {
			"chrome": 'chrome-extension://kfdghhdnlfeencnfpbpddbceglaamobk/resources/images/icon_16.png'
		}
	}

	return new Promise(function(resolve, reject){
		var img;
		img = new Image();
		img.src = ids[ext].chrome;
		img.onload = function() {
			return resolve(true);
		};
		img.onerror = function() {
			return resolve(false);
		};
	});
}