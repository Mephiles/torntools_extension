console.log("START - Background Script");
import personalized from "../personalized.js";

only_wants_functions = true;
let [seconds, minutes, hours, days] = [1000, 60*1000, 60*60*1000, 24*60*60*1000];

var notifications = {
	'travel': {},
	"hospital": {},
	"loot": {},
	"events": {},
	"messages": {},
	"stakeouts": {}
}

var links = {
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	education: "https://www.torn.com/education.php#/step=main",
	messages: "https://www.torn.com/messages.php",
	events: "https://www.torn.com/events.php#/step=all"
}

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
			console.log("	Old storage", old_storage);
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
					if(Object.keys(STORAGE[key]).length == 0 || key === "chat_highlight")
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

	local_storage.get(null, function(db){
		DB = db;

        userdata = DB.userdata;
        torndata = DB.torndata;
        settings = DB.settings;
        api_key = DB.api_key;
        chat_highlight = DB.chat_highlight;
        itemlist = DB.itemlist;
        travel_market = DB.travel_market;
        oc = DB.oc;
        allies = DB.allies;
        loot_times = DB.loot_times;
        target_list = DB.target_list;
        vault = DB.vault;
        // personalized = DB.personalized;
        mass_messages = DB.mass_messages;
        custom_links = DB.custom_links;
        loot_alerts = DB.loot_alerts;
        extensions = DB.extensions;
        new_version = DB.new_version;
        hide_icons = DB.hide_icons;
        quick = DB.quick;
        notes = DB.notes;
        stakeouts = DB.stakeouts;
        updated = DB.updated;
        networth = DB.networth;
        filters = DB.filters;
        cache = DB.cache;
        watchlist = DB.watchlist;
		
		if(api_key){
			console.log("Setting up intervals.");
			setInterval(Main_5_seconds, 5*seconds);  // 5 seconds
			setInterval(Main_15_seconds, 15*seconds);  // 15 seconds
			setInterval(Main_1_minute, 1*minutes);  // 1 minute
			setInterval(Main_15_minutes, 15*minutes);  // 15 minutes

			// Update info about installed extensions
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			// Clear API history
			clearAPIhistory();
		}
	});
});

function Main_5_seconds(){
	if (!settings.notifications.global) return;

	console.group("Notifications");

	// Notifications
	console.log(notifications);
	for(let notification_type in notifications){
		for(let notification_key in notifications[notification_type]){
			if(notifications[notification_type][notification_key].seen == 0){
				notifyUser(
					notifications[notification_type][notification_key].title,
					notifications[notification_type][notification_key].text,
					notifications[notification_type][notification_key].url
				);

				notifications[notification_type][notification_key].seen = 1;
			}

			if(notifications[notification_type][notification_key].seen == 1 && (new Date() - notifications[notification_type][notification_key].date) > 7*24*60*60*1000){
				// notifications[notification_type][notification_key] = undefined;
				delete notifications[notification_type][notification_key];
			}
		}
	}
	
	console.groupEnd("Notifications");
}

function Main_15_seconds(){
	console.group("Main (userdata | torndata | stakeouts)");

	local_storage.get(["api_key", "target_list", "stakeouts", "torndata"], async function([api_key, target_list, stakeouts, old_torndata]){
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
				let selections = `personalstats,crimes,battlestats,perks,profile,workstats,stocks,travel,bars,cooldowns,money,events,messages,timestamp,inventory,education${attack_history? `,${attack_history}`:''}`;

				local_storage.get(["settings", "userdata"], function([settings, previous_userdata]){
					get_api(`https://api.torn.com/user/?selections=${selections}`, api_key).then(async (userdata) => {
						if(!userdata.ok) return resolve(false);
			
						userdata = userdata.result;

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
								if(settings.notifications.global && settings.notifications.messages && !notifications.messages[message_key]){
									notifications.messages[message_key] = {
										title: `TornTools - New Message by ${message.name}`,
										text: message.title,
										url: links.messages,
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
								if(settings.notifications.global && settings.notifications.events && !notifications.events[event_key]){
									notifications.events[event_key] = {
										title: `TornTools - New Event`,
										text: event.event.replace(/<\/?[^>]+(>|$)/g, ""),
										url: links.events,
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
						if(settings.notifications.global && previous_userdata.status && settings.notifications.status){
							let current_status = userdata.status.state;
							let previous_status = previous_userdata.status.state;
							
							if(!(current_status == previous_status || current_status == "Traveling" || current_status == "Abroad")){
								if(current_status == "Okay"){
									if(previous_status == "Hospital"){
										notifyUser("TornTools - Status", `You are out of the hospital.`, links.home);
									} else if(previous_status == "Jail"){
										notifyUser("TornTools - Status", `You are out of the jail.`, links.home);
									}
								} else {
									notifyUser("TornTools - Status", userdata.status.description, links.home);
								}
							} 
						}

						// Check for cooldowns
						if(settings.notifications.global && previous_userdata.cooldowns && settings.notifications.cooldowns){
							for(let cd_type in userdata.cooldowns){
								if(userdata.cooldowns[cd_type] == 0 && previous_userdata.cooldowns[cd_type] != 0){
									notifyUser("TornTools - Cooldowns", `Your ${cd_type} cooldown has ended`, links.items);
								}
							}
						}

						// Check for education
						if(settings.notifications.global && previous_userdata.education_timeleft && settings.notifications.education){
							if(userdata.education_timeleft == 0 && previous_userdata.education_timeleft != 0){
								notifyUser("TornTools - Education", `You have finished your education course`, links.education);
							}
						}

						// Check for travelling
						if(settings.notifications.global && previous_userdata.travel && settings.notifications.traveling){
							if(userdata.travel.time_left == 0 && previous_userdata.travel.time_left != 0){
								notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}`, links.home);
							}
						}

						// Check for bars
						if (settings.notifications.global) {
							for (let bar of ["energy", "happy", "nerve", "life"]) {
								if (previous_userdata[bar] && settings.notifications[bar].length > 0) {
									for (let checkpoint of settings.notifications[bar].sort(function (a, b) {
										return b - a
									})) {
										if (previous_userdata[bar].current < userdata[bar].current && (userdata[bar].current / userdata[bar].maximum) * 100 >= checkpoint) {
											notifyUser("TornTools - Bars", `Your ${capitalize(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum} (${checkpoint}%)`, links.home);
											break;
										}
									}
								}
							}
						}

						// Check for hospital notification
						if(settings.notifications.global && settings.notifications.hospital.length > 0 && userdata.status.state == "Hospital"){
							for(let checkpoint of settings.notifications.hospital.sort(function(a,b){return a-b})){
								let time_left = new Date(userdata.status.until*1000) - new Date(); // ms

								if(time_left <= checkpoint*60*1000 && !notifications.hospital[checkpoint]){
									notifications.hospital[checkpoint] = {
										title: "TornTools - Hospital",
										text: `You will be out of the Hospital in ${Math.floor(time_left/1000/60)} minutes ${(time_left/1000 % 60).toFixed(0)} seconds`,
										url: links.hospital,
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
						if(settings.notifications.global && settings.notifications.landing.length > 0 && userdata.travel.time_left > 0){
							for(let checkpoint of settings.notifications.landing.sort(function(a,b){return a-b})){
								let time_left = new Date(userdata.travel.timestamp*1000) - new Date(); // ms

								if(time_left <= checkpoint*60*1000 && !notifications.travel[checkpoint]){
									notifications.travel[checkpoint] = {
										checkpoint: checkpoint,
										title: "TornTools - Travel",
										text: `You will be Landing in ${Math.floor(time_left/1000/60)} minutes ${(time_left/1000 % 60).toFixed(0)} seconds`,
										url: links.home,
										seen: 0,
										date: new Date()
									};
									break;
								}
							}
						} else {
							notifications.travel = {}
						}

						userdata.date = new Date().toString();
						delete userdata.attacks;

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
				let all_false = true;
				for(let option in stakeouts[user_id]){
					if(stakeouts[user_id][option] == true){
						all_false = false;
					}
				}

				if(all_false){
					local_storage.get("stakeouts", function(stakeouts){
						delete stakeouts[user_id];
						local_storage.set({"stakeouts": stakeouts});
					});
					continue;
				}

				await new Promise(function(resolve, reject){
					get_api(`https://api.torn.com/user/${user_id}?selections=`, api_key)
					.then(stakeout_info => {
						if(!stakeout_info.ok) return resolve(false);

						stakeout_info = stakeout_info.result;

						console.log(`	Checking ${stakeout_info.name} [${user_id}]`);

						if(stakeouts[user_id].online){
							if(stakeout_info.last_action.status == "Online" && !notifications.stakeouts[user_id+"_online"]){
								console.log("	Adding [online] notification to notifications.");
								notifications.stakeouts[user_id+"_online"] = {
									title: `TornTools - Stakeouts`,
									text: `${stakeout_info.name} is now Online`,
									url: `https://www.torn.com/profiles.php?XID=${user_id}`,
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
									url: `https://www.torn.com/profiles.php?XID=${user_id}`,
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
									url: `https://www.torn.com/profiles.php?XID=${user_id}`,
									seen: 0,
									date: new Date()
								}
							} else if(stakeout_info.status.state == "Traveling"){
								delete notifications.stakeouts[user_id+"_lands"];
							}
						}

						return resolve(true);
					});
				});
			}
		} else {
			console.log("No stakeouts.");
		}

		// Torndata
		if(new Date() - new Date(old_torndata.date) >= 24*60*60*1000){
			console.log("Setting up torndata.")
			await new Promise(function(resolve, reject){
				get_api("https://api.torn.com/torn/?selections=honors,medals,items,pawnshop", api_key).then((torndata) => {
					if(!torndata.ok) return resolve(false);
			
					torndata = torndata.result;
					let itemlist = {items: {...torndata.items}, date: (new Date).toString()};
					delete torndata.items;

					let new_date = (new Date()).toString();
					torndata.date = new_date;
			
					torndata.stocks = old_torndata.stocks;
					
					local_storage.set({"torndata": torndata, "itemlist": itemlist}, function(){
						console.log("	Torndata info updated.");
						console.log("	Itemlist info updated.");
						return resolve(true);
					});
				});
			});
		}
	});
	
	console.groupEnd("Main (userdata | torndata | stakeouts)");
}

async function Main_1_minute(){
	console.group("Main (YATA)");

	// loot times
	console.log("Setting up loot times.");
	await new Promise(async function(resolve, reject){
		let response = await fetch("https://yata.alwaysdata.net/loot/timings/");
		let result = await response.json();

		local_storage.set({"loot_times": result}, function(){
			console.log("	Loot times set.");
			checkLootAlerts();
			return resolve(true);
		});
	});

	// travel markets
	console.log("Setting up Travel market info.");
	await new Promise(async function(resolve, reject){
		let response = await fetch("https://yata.alwaysdata.net/bazaar/abroad/export/");
		let result = await response.json();

		local_storage.set({"travel_market": result.stocks}, function(){
			console.log("	Travel market info set.");
			return resolve(true);
		});
	});

	console.groupEnd("Main (YATA)");

	// networth
	if(networth.current.date == undefined || new Date() - new Date(networth.current.date) >= 10*60*1000){  // 10 minutes
		console.log("Updating networth");
		await new Promise(function(resolve, reject){
			get_api("https://api.torn.com/user/?selections=personalstats,networth", api_key).then((data) => {
				if(!data.ok) return resolve(data.error);
				
				data = data.result;

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
					console.log("Networth info updated.");
					return resolve(networth);
				});
			});
		});
	}

	clearCache();

	// Clear API history
	await clearAPIhistory();
}

function Main_15_minutes(){
	local_storage.get("api_key", async function(api_key){
		console.group("Main (stocks | OC info | installed extensions)");

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}
	
		await new Promise(function(resolve, reject){
			get_api("https://api.torn.com/torn/?selections=stocks", api_key).then((stocks) => {
				if(!stocks.ok) return resolve(false);
		
				stocks = {...stocks.result.stocks};

				let new_date = (new Date()).toString();
				stocks.date = new_date;
		
				local_storage.change({"torndata": {"stocks": stocks}}, function(){
					console.log("Stocks info updated.");
					checkStockAlerts();
					return resolve(true);
				});
			});
		});

		// faction data
		console.log("Setting up faction data.");
		if(settings.pages.faction.oc_time){
			await new Promise(function(resolve, reject){
				get_api("https://api.torn.com/faction/?selections=crimes", api_key).then((factiondata) => {
					if(!factiondata.ok) return resolve(false);

					factiondata = factiondata.result;

					let new_date = new Date().toString();
					factiondata.crimes.date = new_date;

					local_storage.set({"oc": factiondata.crimes}, function(){
						console.log("	Faction data set.");
						return resolve(true);
					});
				});
			});
		} else {
			console.log("	Faction OC time formatting turned off.");
		}

		// Doctorn
		updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));
	
		console.groupEnd("Main (stocks | OC info | installed extensions)");
	});
}

// FUNCTIONS //

// Check if new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	local_storage.set({"updated": true, "new_version": {"available": false}}, function(){
		console.log("Extension updated:", chrome.runtime.getManifest().version);
	});
});

// Messaging
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log(sender.tab ? "from a content script:"+sender.tab.url : "from the extension");

	switch(request.action){
		case "initialize":
			console.log("Initializing app.")

			console.log("Setting up intervals.");
			setInterval(Main_5_seconds, 5*seconds);  // 5 seconds
			setInterval(Main_15_seconds, 15*seconds);  // 15 seconds
			setInterval(Main_1_minute, 1*minutes);  // 1 minute
			setInterval(Main_15_minutes, 15*minutes);  // 15 minutes

			console.log("Fetching initial info.");
			Main_15_minutes();

			exportData("basic");

			sendResponse({success: true, message: "TornTools app has been intialized."});
			break;
		case "export_data":
			exportData(request.type);
			sendResponse({success: true, message: "Export successful."});
			break;
		case "import_data":
			importData();
			sendResponse({success: true, message: "Import successful."});
			break;
		default:
			sendResponse({success: false, message: "Unknown command."});
			break;
	}
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

// Notification links
chrome.notifications.onClicked.addListener(function(notification_id){
	chrome.tabs.create({url: notification_link_relations[notification_id]});
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

async function checkStockAlerts(){
	console.group("Checking stock prices");

	await new Promise(function(resolve, reject){
		let notified = false;

		local_storage.get(["stock_alerts", "torndata"], function([stock_alerts, torndata]){
			for(let stock_id in stock_alerts){
				if(parseFloat(torndata.stocks[stock_id].current_price) >= parseFloat(stock_alerts[stock_id].reach)){
					console.log("	Notifiying of reaching price point.");
					notified = true;

					notifyUser(
						"TornTools - Stock alerts", 
						`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has reached $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].reach})`,
						links.stocks
					);

					local_storage.change({"stock_alerts": {
						[stock_id]: {
							"reach": undefined
						}
					}});
				} else if(parseFloat(torndata.stocks[stock_id].current_price) <= parseFloat(stock_alerts[stock_id].fall)){
					console.log("	Notifiying of reaching price point.");
					notified = true;
					
					notifyUser(
						"TornTools - Stock alerts",
						`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has fallen to $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].fall})`,
						links.stocks
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
		
	console.groupEnd("Checking stock prices");
}

async function checkLootAlerts(){
	console.group("Checking NPC loot times.");

	await new Promise(function(resolve, reject){
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
							text: `${loot_times[npc_id].name} is reaching loot level ${arabicToRoman(alert_level)} in ${time_until((alert_loot_time - current_time)*1000).replace("m", "min")}`,
							url: `https://www.torn.com/profiles.php?XID=${npc_id}`,
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

	console.groupEnd("Checking NPC loot times.");
}

async function clearCache(){
	console.group("Clearing cache");

	await new Promise(function(resolve, reject){
		for(let type in cache){
			for(let key in cache[type]){
				if(!cache[type][key].date || new Date() - new Date(cache[type][key].date) >= 60*1000){
					console.log(`	Cleared cache for ${type}: ${key}`)
					delete cache[type][key];
				}
			}
		}
		local_storage.set({"cache": cache}, function(){
			console.log("	Cleared cache.");
			return resolve(true);
		});
	});
	
	console.groupEnd("Clearing cache");
}

async function detectExtension(browserName, ext){
	const ids = {
		"doctorn": {
			"chrome": {"id": "kfdghhdnlfeencnfpbpddbceglaamobk"},
			"firefox": {"name": "DoctorN for Torn"}
		},
		/* as example
		"torntools": {
			"firefox": {"id": "torntools@mephiles.github.com"}
		}
		 */
	}

	if (!(ext in ids)) return Promise.reject(`Detection for '${ext}' is not supported!`);
	else if (!(browserName in ids[ext])) return Promise.reject(`Detection for '${ext}' with ${browserName} is not supported!`);

	const information = ids[ext][browserName];

	if (information.id) {
		return new Promise(function(resolve, reject){
			chrome.management.get(information.id, function(result) {
				if(result.enabled === true){
					resolve(true);
				} else {
					resolve(false)
				}
			});
		});
	} else if (information.name) {
		const getAll = chrome.management.getAll;
		if (!getAll) return Promise.reject(`Detection for '${ext}' with ${browserName} is not supported!`);

		return new Promise( async function(resolve, reject) {
			const addons = await getAll();

			resolve(addons && !!addons
				.filter((addon) => addon.type === "extension")
				.filter((addon) => addon.name === information.name)
				.filter((addon) => addon.enabled === true)
				.length);
		});
	}
}

async function updateExtensions() {
	console.log("Checking for installed extensions.");

	return new Promise(((resolve, reject) => {
		local_storage.get("extensions", async function(extensions) {
			let browser = false;
			if (usingChrome()) browser = "chrome";
			else if (usingFirefox()) browser = "firefox";

			if (browser) {
				const extensions = {
					"doctorn": false
				}

				for (let extension in extensions) {
					extensions[extension] = await detectExtension(browser, extension);
				}

			    local_storage.change({extensions}, function(){
					return resolve(extensions);
			 	});
			} else {
				console.log("	Using something else than Chrome or Firefox.");
			}
		});
	}));
}

function clearAPIhistory(){
	return new Promise(function(resolve, reject){
		local_storage.get("api_history", function(api_history){
			let time_limit = 10*60*60*1000;
	
			for(let type in api_history){
				let data = [...api_history[type]].reverse();
	
				for(let fetch of data){
					if(new Date() - new Date(fetch.date) > time_limit){
						data.splice(data.indexOf(fetch), 1);
					}
				}
	
				data.reverse();
				api_history[type] = data;
			}
	
			local_storage.set({"api_history": api_history}, function(){
				console.log("	API history cleared");
				return resolve(true);
			});
		});
	});
}

function exportData(type){
	console.log("Exporting DATA:", type);
	local_storage.get(null, async function(database){
		let post_data;
	
		switch(type){
			case "basic":
				post_data = {
					id: userdata.player_id.toString(),
					name: database.userdata.name,
					role: database.userdata.role,
					client: {
						version: chrome.runtime.getManifest().version,
						disk_space: await (function(){
							return new Promise(function(resolve, reject){
								if(chrome.storage.local.getBytesInUse){
									chrome.storage.local.getBytesInUse(function(data){
										return resolve(data.toString());
									});
								} else {
									return resolve("N/A");
								}
							});
						})()
					}
				}
				break;
			case "storage":
				post_data = {
					id: userdata.player_id.toString(),
					storage: {
						allies: database.allies,
						custom_links: database.custom_links,
						chat_highlight: database.chat_highlight,
						hide_icons: database.hide_icons,
						quick: database.quick,
						settings: database.settings
					}
				}
				break;
			case "all":
				post_data = {
					id: userdata.player_id.toString(),
					name: database.userdata.name,
					role: database.userdata.role,
					client: {
						version: chrome.runtime.getManifest().version,
						disk_space: await (function(){
							return new Promise(function(resolve, reject){
								if(chrome.storage.local.getBytesInUse){
									chrome.storage.local.getBytesInUse(function(data){
										return resolve(data.toString());
									});
								} else {
									return resolve("N/A");
								}
							});
						})()
					},
					storage: {
						allies: database.allies,
						custom_links: database.custom_links,
						chat_highlight: database.chat_highlight,
						hide_icons: database.hide_icons,
						quick: database.quick,
						settings: database.settings
					}
				}
			default:
				break;
		}
	
		console.log("data", post_data);
		fetch(`https://torntools.gregork.com/api/settings/export`, {
			method: "POST", 
			headers: {"content-type": "application/json"}, 
			body: JSON.stringify(post_data)
		}).then(response => {
			console.log("RESPONSE", response);
		});
	});
}

function importData(){
	console.log("Importing DATA");
	fetch(`https://torntools.gregork.com/api/settings/import/${userdata.player_id}`)
	.then(async function(response){
		let result = await response.json();
		console.log("result", result);

		if(!result.success) return;
		result = result.data;

		// Set storage
		for(let key in result.storage){
			await new Promise(function(resolve, reject){
				local_storage.set({[key]: result.storage[key]}, function(){
					console.log(`${key} imported.`);
					return resolve(true);
				});
			});
		}

		// Export if versions don't match
		if(result.client.version != chrome.runtime.getManifest().version){
			exportData("all");
		}
	});
}