console.log("START - Background Script");
import personalized from "../personalized.js";

// noinspection JSUnusedLocalSymbols
let [seconds, minutes, hours, days] = [1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];

var notifications = {
	"travel": {},
	"hospital": {},
	"chain": {},
	"loot": {},
	"events": {},
	"messages": {},
	"stakeouts": {},
	"nerve": {},
	"energy": {},
	"happy": {},
	"life": {},
	"new_day": {},
}

var links = {
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	education: "https://www.torn.com/education.php#/step=main",
	messages: "https://www.torn.com/messages.php",
	events: "https://www.torn.com/events.php#/step=all",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain"
}

let userdata, torndata, settings, api_key, chat_highlight, itemlist,
	travel_market, oc, allies, loot_times, target_list, vault,
	mass_messages, custom_links, loot_alerts, extensions, new_version, hide_icons,
	quick, notes, stakeouts, updated, networth, filters, cache, watchlist;

// First - set storage
console.log("Checking Storage.");
let setup_storage = new Promise(function (resolve) {
	ttStorage.get(null, function (old_storage) {
		if (!old_storage || Object.keys(old_storage).length === 0) {  // fresh install
			console.log("	Setting new storage.");
			ttStorage.set(STORAGE, function () {
				console.log("	Storage set");
				return resolve(true);
			});
		} else {  // existing storage
			console.log("Converting old storage.");
			console.log("	Old storage", old_storage);
			let new_storage = convertStorage(old_storage, STORAGE);

			console.log("	New storage", new_storage);

			ttStorage.clear(function () {
				ttStorage.set(new_storage, function () {
					console.log("	Storage updated.");
					return resolve(true);
				});
			});
		}

		function convertStorage(old_storage, STORAGE) {
			let new_local_storage = {};

			for (let key in STORAGE) {
				// Key not in old storage
				if (!(key in old_storage)) {
					new_local_storage[key] = STORAGE[key];
					continue;
				}

				// Key has new type
				if (typeof STORAGE[key] != "undefined" && typeof STORAGE[key] !== typeof old_storage[key]) {
					new_local_storage[key] = STORAGE[key];
					continue;
				}

				if (typeof STORAGE[key] == "object" && !Array.isArray(STORAGE[key])) {
					if (Object.keys(STORAGE[key]).length === 0 || key === "chat_highlight")
						new_local_storage[key] = old_storage[key];
					else
						new_local_storage[key] = convertStorage(old_storage[key], STORAGE[key]);
				} else {
					if (STORAGE[key] === "force_false")
						new_local_storage[key] = false;
					else if (STORAGE[key] === "force_true")
						new_local_storage[key] = true;
					else if (typeof STORAGE[key] == "string" && STORAGE[key].indexOf("force_") > -1)
						new_local_storage[key] = STORAGE[key].split(/_(.+)/)[1];
					else
						new_local_storage[key] = old_storage[key];
				}

			}

			return new_local_storage;
		}
	});
});

setup_storage.then(async function (success) {
	if (!success) {
		return;
	}

	// Check for personalized scripts
	console.log("Setting up personalized scripts.");
	if (Object.keys(personalized).length !== 0) {
		await (function () {
			return new Promise(function (resolve) {
				ttStorage.get("userdata", function (userdata) {
					if (!userdata)
						return resolve(userdata);

					let personalized_scripts = {}

					if (personalized.master === userdata.player_id) {
						for (let type in personalized) {
							if (type == "master") {
								continue;
							}

							for (let id in personalized[type]) {
								for (let script of personalized[type][id]) {
									personalized_scripts[script] = true;
								}
							}
						}
					} else if (personalized.users[userdata.player_id]) {
						for (let script of personalized.users[userdata.player_id]) {
							personalized_scripts[script] = true;
						}
					}

					ttStorage.set({ "personalized": personalized_scripts }, function () {
						console.log("	Personalized scripts set.");
						return resolve(true);
					});
				});
			});
		})();
	} else {
		console.log("	Empty file.");
	}

	ttStorage.get(null, function (db) {
		userdata = db.userdata;
		torndata = db.torndata;
		settings = db.settings;
		api_key = db.api_key;
		chat_highlight = db.chat_highlight;
		itemlist = db.itemlist;
		travel_market = db.travel_market;
		oc = db.oc;
		allies = db.allies;
		loot_times = db.loot_times;
		target_list = db.target_list;
		vault = db.vault;
		// personalized = DB.personalized;
		mass_messages = db.mass_messages;
		custom_links = db.custom_links;
		loot_alerts = db.loot_alerts;
		extensions = db.extensions;
		new_version = db.new_version;
		hide_icons = db.hide_icons;
		quick = db.quick;
		notes = db.notes;
		stakeouts = db.stakeouts;
		updated = db.updated;
		networth = db.networth;
		filters = db.filters;
		cache = db.cache;
		watchlist = db.watchlist;

		if (api_key) {
			initiateTasks();

			// Update info about installed extensions
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			// Clear API history
			clearAPIhistory();
		}
	});
});

function initiateTasks() {
	console.log("Setting up intervals.");
	setInterval(Main_5_seconds, 5 * seconds);  // 5 seconds
	setInterval(Main_30_seconds, 30 * seconds);  // 30 seconds
	setInterval(Main_1_minute, minutes);  // 1 minute

	const now = new Date();
	const secondsTillStockTick = (15 - (now.getUTCMinutes() % 15)) * 60 - now.getUTCSeconds();

	setTimeout(() => {
		Main_15_minutes();

		setInterval(Main_15_minutes, 15 * minutes);  // 15 minutes
	}, (secondsTillStockTick + 10) * 1000);
}

function Main_5_seconds() {
	if (!settings.notifications.global) return;

	console.group("Notifications");

	// Notifications
	console.log(notifications);
	for (let notification_type in notifications) {
		for (let notification_key in notifications[notification_type]) {
			if (notifications[notification_type][notification_key].seen === 0) {
				console.log("NOTIFY USER", notification_type, notification_type)
				notifyUser(
					notifications[notification_type][notification_key].title,
					notifications[notification_type][notification_key].text,
					notifications[notification_type][notification_key].url
				);

				notifications[notification_type][notification_key].seen = 1;
			}

			if (notifications[notification_type][notification_key].seen === 1 && (new Date() - notifications[notification_type][notification_key].date) > 7 * 24 * 60 * 60 * 1000) {
				// notifications[notification_type][notification_key] = undefined;
				delete notifications[notification_type][notification_key];
			}
		}
	}

	console.groupEnd();
}

function Main_30_seconds() {
	console.group("Main (userdata | torndata | stakeouts)");

	ttStorage.get(["api_key", "target_list", "stakeouts", "torndata"], async function ([api_key, target_list, stakeouts, old_torndata]) {
		let attack_history;

		if (api_key === undefined) {
			console.log("NO API KEY");
			return;
		}

		if (target_list.show) {
			if (target_list.last_target === -1) {
				attack_history = "attacksfull";
			} else {
				attack_history = "attacks";
			}
		}

		// userdata
		console.log("Setting up userdata.");
		await (function () {
			return new Promise(function (resolve) {
				let selections = `personalstats,crimes,battlestats,perks,profile,workstats,stocks,travel,bars,cooldowns,money,events,messages,timestamp,inventory,education${attack_history ? `,${attack_history}` : ''}`;

				ttStorage.get(["settings", "userdata"], function ([settings, previous_userdata]) {
					fetchApi(`https://api.torn.com/user/?selections=${selections}`, api_key).then(async (userdata) => {
						if (!userdata.ok) return resolve(false);

						userdata = userdata.result;

						// Target list
						if (userdata.attacks) {
							let attacks_data = { ...userdata.attacks }
							updateTargetList(attacks_data, userdata.player_id, target_list, (attack_history == "attacksfull" ? true : false));
						}

						// Check for new messages
						let message_count = 0;
						for (let message_key of Object.keys(userdata.messages).reverse()) {
							let message = userdata.messages[message_key];

							if (message.seen === 0) {
								if (settings.notifications.global && settings.notifications.messages && !notifications.messages[message_key]) {
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
						for (let event_key of Object.keys(userdata.events).reverse()) {
							let event = userdata.events[event_key];

							if (event.seen === 0) {
								if (settings.notifications.global && settings.notifications.events && !notifications.events[event_key]) {
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
						if (event_count > 0 && message_count > 0) {
							setBadge(`${message_count}/${event_count}`, { color: "#1ed2ac" });
						} else if (event_count > 0) {
							setBadge("new_event", { count: event_count });
						} else if (message_count > 0) {
							setBadge("new_message", { count: message_count });
						} else if (!isNaN(await getBadgeText())) {
							setBadge("");
						}

						// Check for Status change
						if (settings.notifications.global && previous_userdata.status && settings.notifications.status) {
							let current_status = userdata.status.state;
							let previous_status = previous_userdata.status.state;

							if (!(current_status === previous_status || current_status === "Traveling" || current_status === "Abroad")) {
								if (current_status === "Okay") {
									if (previous_status === "Hospital") {
										notifyUser("TornTools - Status", `You are out of the hospital.`, links.home);
									} else if (previous_status === "Jail") {
										notifyUser("TornTools - Status", `You are out of the jail.`, links.home);
									}
								} else {
									notifyUser("TornTools - Status", userdata.status.description, links.home);
								}
							}
						}

						// Check for cooldowns
						if (settings.notifications.global && previous_userdata.cooldowns && settings.notifications.cooldowns) {
							for (let cd_type in userdata.cooldowns) {
								if (userdata.cooldowns[cd_type] === 0 && previous_userdata.cooldowns[cd_type] !== 0) {
									notifyUser("TornTools - Cooldowns", `Your ${cd_type} cooldown has ended`, links.items);
								}
							}
						}

						// Check for education
						if (settings.notifications.global && previous_userdata.education_timeleft && settings.notifications.education) {
							if (userdata.education_timeleft === 0 && previous_userdata.education_timeleft !== 0) {
								notifyUser("TornTools - Education", `You have finished your education course`, links.education);
							}
						}

						// Check for travelling
						if (settings.notifications.global && previous_userdata.travel && settings.notifications.traveling) {
							if (userdata.travel.time_left === 0 && previous_userdata.travel.time_left !== 0) {
								notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}`, links.home);
							}
						}

						// Check for bars
						if (settings.notifications.global) {
							for (let bar of ["energy", "happy", "nerve", "life"]) {
								if (previous_userdata[bar] && settings.notifications[bar].length > 0) {
									let checkpoints = settings.notifications[bar].map(x => (typeof x === "string" && x.includes("%")) ? parseInt(x) / 100 * userdata[bar].maximum : parseInt(x)).sort(function (a, b) {
										return b - a
									});
									console.log(`${bar} checkpoints previous:`, settings.notifications[bar]);
									console.log(`${bar} checkpoints modified:`, checkpoints);
									for (let checkpoint of checkpoints) {
										if (previous_userdata[bar].current < userdata[bar].current && userdata[bar].current >= checkpoint && !notifications[bar][checkpoint]) {
											notifications[bar][checkpoint] = {
												title: "TornTools - Bars",
												text: `Your ${capitalize(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}`,
												url: links.home,
												seen: 0,
												date: new Date()
											};
											break;
										} else if (userdata[bar].current < checkpoint && notifications[bar][checkpoint]) {
											delete notifications[bar][checkpoint];
										}
									}
								}
							}
						}

						// Check for hospital notification
						if (settings.notifications.global && settings.notifications.hospital.length > 0 && userdata.status.state === "Hospital") {
							for (let checkpoint of settings.notifications.hospital.sort(function (a, b) {
								return a - b
							})) {
								let time_left = new Date(userdata.status.until * 1000) - new Date(); // ms

								if (time_left <= parseInt(checkpoint) * 60 * 1000 && !notifications.hospital[checkpoint]) {
									notifications.hospital[checkpoint] = {
										title: "TornTools - Hospital",
										text: `You will be out of the Hospital in ${Math.floor(time_left / 1000 / 60)} minutes ${(time_left / 1000 % 60).toFixed(0)} seconds`,
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
						if (settings.notifications.global && settings.notifications.landing.length > 0 && userdata.travel.time_left > 0) {
							for (let checkpoint of settings.notifications.landing.sort(function (a, b) {
								return a - b
							})) {
								let time_left = new Date(userdata.travel.timestamp * 1000) - new Date(); // ms

								if (time_left <= parseInt(checkpoint) * 60 * 1000 && !notifications.travel[checkpoint]) {
									notifications.travel[checkpoint] = {
										checkpoint: checkpoint,
										title: "TornTools - Travel",
										text: `You will be Landing in ${Math.floor(time_left / 1000 / 60)} minutes ${(time_left / 1000 % 60).toFixed(0)} seconds`,
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

						// Check for chain notification
						if (settings.notifications.global && settings.notifications.chain.length > 0 && userdata.chain.timeout !== 0) {
							for (let checkpoint of settings.notifications.chain.sort(function (a, b) {
								return a - b
							})) {
								let real_timeout = userdata.chain.timeout * 1000 - (new Date() - new Date(userdata.timestamp * 1000));  // ms

								if (real_timeout <= parseInt(checkpoint) * 60 * 1000 && !notifications.chain[checkpoint]) {
									notifications.chain[checkpoint] = {
										checkpoint: checkpoint,
										title: "TornTools - Chain",
										text: `Chain timer will run out in ${Math.floor(real_timeout / 1000 / 60)} minutes ${(real_timeout / 1000 % 60).toFixed(0)} seconds`,
										url: links.chain,
										seen: 0,
										date: new Date()
									};
									break;
								}
							}
						} else {
							notifications.chain = {}
						}

						// Check for New Day notification
						let torn_time = new Date(new Date(userdata.timestamp).toUTCString().replace(" GMT", ""));
						// noinspection EqualityComparisonWithCoercionJS
						if (
							settings.notifications.global &&
							settings.notifications.new_day &&
							torn_time.getHours() == "00" &&
							torn_time.getMinutes() == "00" &&
							!(torn_time.getDate().toString() in notifications.new_day)) {
							notifications.new_day[torn_time.getDate().toString()] = {
								title: "TornTools - New Day",
								text: "It's a new day! Hopefully a sunny one.",
								url: links.home,
								seen: 0,
								date: new Date()
							}
						}

						userdata.date = new Date().toString();
						delete userdata.attacks;

						// Set Userdata
						ttStorage.set({ "userdata": userdata }, function () {
							console.log("	Userdata set.");
							return resolve(true);
						});
					});
				});
			});
		})();

		// stakeouts
		if (Object.keys(stakeouts).length > 0) {
			console.log("Checking stakeouts.");
			for (let user_id of Object.keys(stakeouts)) {
				let all_false = true;
				for (let option in stakeouts[user_id]) {
					if (stakeouts[user_id][option] === true) {
						all_false = false;
					}
				}

				if (all_false) {
					ttStorage.get("stakeouts", function (stakeouts) {
						delete stakeouts[user_id];
						ttStorage.set({ "stakeouts": stakeouts });
					});
					continue;
				}

				await new Promise(function (resolve) {
					fetchApi(`https://api.torn.com/user/${user_id}?selections=`, api_key)
						.then(stakeout_info => {
							if (!stakeout_info.ok) return resolve(false);

							stakeout_info = stakeout_info.result;

							console.log(`	Checking ${stakeout_info.name} [${user_id}]`);

							if (stakeouts[user_id].online) {
								if (stakeout_info.last_action.status === "Online" && !notifications.stakeouts[user_id + "_online"]) {
									console.log("	Adding [online] notification to notifications.");
									notifications.stakeouts[user_id + "_online"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Online`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date()
									}
								} else if (stakeout_info.last_action.status !== "Online") {
									delete notifications.stakeouts[user_id + "_online"];
								}
							}
							if (stakeouts[user_id].okay) {
								if (stakeout_info.status.state === "Okay" && !notifications.stakeouts[user_id + "_okay"]) {
									console.log("	Adding [okay] notification to notifications.");
									notifications.stakeouts[user_id + "_okay"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Okay`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date()
									}
								} else if (stakeout_info.status.state !== "Okay") {
									delete notifications.stakeouts[user_id + "_okay"];
								}
							}
							if (stakeouts[user_id].lands) {
								if (stakeout_info.status.state !== "Traveling" && !notifications.stakeouts[user_id + "_lands"]) {
									console.log("	Adding [lands] notification to notifications.");
									notifications.stakeouts[user_id + "_lands"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now ${stakeout_info.status.state === "Abroad" ? stakeout_info.status.description : "in Torn"}`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date()
									}
								} else if (stakeout_info.status.state === "Traveling") {
									delete notifications.stakeouts[user_id + "_lands"];
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
		if (!old_torndata || !old_torndata.date || new Date() - new Date(old_torndata.date) >= 24 * 60 * 60 * 1000) {
			console.log("Setting up torndata.")
			await updateTorndata(old_torndata);
		}
	});

	console.groupEnd();
}

async function Main_1_minute() {
	console.group("Main (YATA)");

	// loot times
	console.log("Setting up loot times.");
	await new Promise(async function (resolve) {
		let response = await fetch("https://yata.alwaysdata.net/loot/timings/");
		let result = await response.json();

		ttStorage.set({ "loot_times": result }, function () {
			console.log("	Loot times set.");
			checkLootAlerts();
			return resolve(true);
		});
	});

	// travel markets
	console.log("Setting up Travel market info.");
	await new Promise(async function (resolve) {
		fetchApi_v2('yata', { section: 'bazaar/abroad/export' })
			.then(result => {
				// console.log('travel market info', result);
				ttStorage.set({ "travel_market": result.stocks }, function () {
					console.log("	Travel market info set.");
					return resolve();
				});

			})
			.catch(result => {
				console.log('travel market fail', result);
				return resolve();
			})
	});

	console.groupEnd();

	// networth
	if (networth.current.date === undefined || new Date() - new Date(networth.current.date) >= 10 * 60 * 1000) {  // 10 minutes
		console.log("Updating networth");
		await new Promise(function (resolve) {
			fetchApi("https://api.torn.com/user/?selections=personalstats,networth", api_key).then((data) => {
				if (!data.ok) return resolve(data.error);

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
				ttStorage.set({ "networth": networth }, function () {
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

function Main_15_minutes() {
	ttStorage.get("api_key", async function (api_key) {
		console.group("Main (stocks | OC info | installed extensions)");

		if (api_key === undefined) {
			console.log("NO API KEY");
			return;
		}

		console.log("Setting up stocks");
		await new Promise(function (resolve) {
			fetchApi("https://api.torn.com/torn/?selections=stocks", api_key).then((stocks) => {
				if (!stocks.ok) return resolve(false);

				stocks = { ...stocks.result.stocks };

				stocks.date = (new Date()).toString();

				ttStorage.change({ "torndata": { "stocks": stocks } }, function () {
					console.log("Stocks info updated.");
					checkStockAlerts();
					return resolve(true);
				});
			});
		});

		// faction data
		console.log("Setting up faction data.");
		if (settings.pages.faction.oc_time) {
			await new Promise(function (resolve) {
				fetchApi("https://api.torn.com/faction/?selections=crimes", api_key).then((factiondata) => {
					if (!factiondata.ok) return resolve(false);

					factiondata = factiondata.result;

					factiondata.crimes.date = new Date().toString();

					ttStorage.set({ "oc": factiondata.crimes }, function () {
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

		console.groupEnd();
	});
}

/*
 * Updating Functions
 */

function updateTargetList(attacks_data, player_id, target_list, first_time) {
	console.log("Updating Target list");

	for (let fight_id in attacks_data) {
		if (parseInt(fight_id) <= parseInt(target_list.last_target)) {
			continue;
		}

		target_list.last_target = fight_id;
		let fight = attacks_data[fight_id];
		let opponent_id = fight.attacker_id === player_id ? fight.defender_id : fight.attacker_id;

		if (!opponent_id) {
			continue;
		}

		if (!target_list.targets[opponent_id]) {
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

		if (fight.defender_id === player_id) {  // user defended
			if (fight.result === "Lost") {
				target_list.targets[opponent_id].defend++;
			} else {
				target_list.targets[opponent_id].defend_lose++;
			}
		} else if (fight.attacker_id === player_id) {  // user attacked
			if (fight.result === "Lost")
				target_list.targets[opponent_id].lose++;
			else if (fight.result === "Stalemate")
				target_list.targets[opponent_id].stalemate++;
			else {
				target_list.targets[opponent_id].win++;
				let respect = parseFloat(fight.respect_gain);

				if (!first_time)
					respect = respect / fight.modifiers.war / fight.modifiers.groupAttack / fight.modifiers.overseas / fight.modifiers.chainBonus;  // get base respect

				if (fight.stealthed === "1")
					target_list.targets[opponent_id].stealth++;

				switch (fight.result) {
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
	ttStorage.set({ "target_list": target_list }, function () {
		console.log("	Target list set");
	});
}

async function updateExtensions() {
	console.log("Checking for installed extensions.");

	return new Promise(async (resolve) => {
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

			ttStorage.change({ extensions }, function () {
				return resolve(extensions);
			});
		} else {
			console.log("	Using something else than Chrome or Firefox.");
		}
	});
}

async function updateTorndata(oldTorndata) {
	if (!oldTorndata) {
		return new Promise((resolve) => {
			ttStorage.get("torndata", (oldTorndata) => updateTorndata(oldTorndata || {}).then(resolve));
		});
	}
	console.log("Updating torndata");

	return new Promise((resolve) => {
		fetchApi("https://api.torn.com/torn/?selections=honors,medals,items,pawnshop", api_key).then((torndata) => {
			if (!torndata.ok) return resolve({ success: false, message: torndata.error });

			torndata = torndata.result;
			let itemlist = { items: { ...torndata.items }, date: (new Date).toString() };
			delete torndata.items;

			torndata.date = (new Date()).toString();

			torndata.stocks = oldTorndata.stocks;

			ttStorage.set({ "torndata": torndata, "itemlist": itemlist }, function () {
				console.log("	Torndata info updated.");
				console.log("	Itemlist info updated.");
				return resolve({ success: true, message: "Torndata fetched" });
			});
		});
	});
}

/*
 * Various Functions
 */

// Check if new version is installed
chrome.runtime.onInstalled.addListener(function () {
	ttStorage.set({ "updated": true, "new_version": { "available": false } }, function () {
		console.log("Extension updated:", chrome.runtime.getManifest().version);
	});
});

// Messaging
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	// console.log(sender.tab ? "from a content script:"+sender.tab.url : "from the extension");

	switch (request.action) {
		case "initialize":
			console.log("Initializing app.")

			initiateTasks();

			// Update info about installed extensions
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			// Clear API history
			clearAPIhistory();
			break;
		case "fetch":
			if (request.type === "torndata") {
				console.log("Setting up torndata.");
				updateTorndata().then(sendResponse);
			}
			break;
		default:
			sendResponse({ success: false, message: "Unknown command." });
			break;
	}
	return true;
});

// Update available
chrome.runtime.onUpdateAvailable.addListener(function (details) {
	console.log("Details", details);

	setBadge("update_available");

	ttStorage.set({
		"new_version": {
			"available": true,
			"version": details.version,
		},
	});
});

// Notification links
chrome.notifications.onClicked.addListener(function (notification_id) {
	ttStorage.get("settings", function (settings) {
		if (settings.notifications_link) {
			chrome.tabs.create({ url: notificationLinkRelations[notification_id] });
		}
	});
});

chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "local") return;

	if (changes.api_key) {
		console.log("New API Key", api_key, changes.api_key.newValue);
		api_key = changes.api_key.newValue;
	} else if (changes.cache) {
		cache = changes.cache.newValue;
	}
});

async function checkStockAlerts() {
	console.group("Checking stock prices");

	await new Promise(function (resolve) {
		let notified = false;

		ttStorage.get(["stock_alerts", "torndata"], function ([stock_alerts, torndata]) {
			for (let stock_id in stock_alerts) {
				if (parseFloat(torndata.stocks[stock_id].current_price) >= parseFloat(stock_alerts[stock_id].reach)) {
					console.log("	Notifiying of reaching price point.");
					notified = true;

					notifyUser(
						"TornTools - Stock alerts",
						`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has reached $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].reach})`,
						links.stocks
					);

					ttStorage.change({
						"stock_alerts": {
							[stock_id]: {
								"reach": undefined
							}
						}
					});
				} else if (parseFloat(torndata.stocks[stock_id].current_price) <= parseFloat(stock_alerts[stock_id].fall)) {
					console.log("	Notifiying of reaching price point.");
					notified = true;

					notifyUser(
						"TornTools - Stock alerts",
						`(${torndata.stocks[stock_id].acronym}) ${torndata.stocks[stock_id].name} has fallen to $${torndata.stocks[stock_id].current_price} (alert: $${stock_alerts[stock_id].fall})`,
						links.stocks
					);

					ttStorage.change({
						"stock_alerts": {
							[stock_id]: {
								"fall": undefined
							}
						}
					});
				}
			}

			if (!notified) {
				console.log("	No new stock notifications.");
			}
			return resolve(true);
		});
	});

	console.groupEnd();
}

async function checkLootAlerts() {
	console.group("Checking NPC loot times.");

	await new Promise(function (resolve) {
		let notified = false;

		ttStorage.get(["loot_alerts", "loot_times"], function ([loot_alerts, loot_times]) {
			let current_time = parseInt(((new Date().getTime()) / 1000).toFixed(0));

			for (let npc_id in loot_alerts) {
				let alert_level = loot_alerts[npc_id].level;
				if (!alert_level) {
					continue;
				}

				let alert_loot_time = loot_times[npc_id].timings[alert_level].ts;

				if (!loot_alerts[npc_id].time) {
					continue;
				}

				if (loot_times[npc_id].levels.next <= alert_level && alert_loot_time - current_time <= parseFloat(loot_alerts[npc_id].time) * 60) {
					if (timeUntil((alert_loot_time - current_time) * 1000) === -1) {
						continue;
					}

					let checkpoint = loot_alerts[npc_id].time.toString();
					if (!notifications.loot[checkpoint + "_" + npc_id]) {
						notifications.loot[checkpoint + "_" + npc_id] = {
							title: "TornTools - NPC Loot",
							text: `${loot_times[npc_id].name} is reaching loot level ${arabicToRoman(alert_level)} in ${timeUntil((alert_loot_time - current_time) * 1000).replace("m", "min")}`,
							url: `https://www.torn.com/profiles.php?XID=${npc_id}`,
							seen: 0,
							date: new Date()
						}
						console.log("	Added Loot time to notifications.");
						notified = true;
					}
				}
			}
			if (!notified) {
				console.log("	No new loot notifications.");
			}
			return resolve(true);
		});
	});

	console.groupEnd();
}

async function clearCache() {
	console.group("Clearing cache");

	await new Promise((resolve) => {
		const timestamp = new Date().getTime();

		for (let type in cache) {
			for (let key in cache[type]) {
				let t = cache[type][key];

				if (!t.timestamp || timestamp > (t.timestamp + t.ttl)) {
					delete cache[type][key];
				}
			}
		}

		ttStorage.set({ "cache": cache }, function () {
			console.log("	Cleared cache.");
			return resolve(true);
		});
	});

	console.groupEnd();
}

async function detectExtension(browserName, ext) {
	const ids = {
		"doctorn": {
			"chrome": { "id": "kfdghhdnlfeencnfpbpddbceglaamobk" },
			"firefox": { "name": "DoctorN for Torn" }
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
		return new Promise(function (resolve) {
			chrome.management.get(information.id, function (result) {
				if (result && result.enabled === true) {
					resolve(true);
				} else {
					resolve(false)
				}
			});
		});
	} else if (information.name) {
		const getAll = chrome.management.getAll;
		if (!getAll) return Promise.reject(`Detection for '${ext}' with ${browserName} is not supported!`);

		return new Promise(async function (resolve) {
			const addons = await getAll();

			resolve(addons && !!addons
				.filter((addon) => addon.type === "extension")
				.filter((addon) => addon.name === information.name)
				.filter((addon) => addon.enabled === true)
				.length);
		});
	}
}

function clearAPIhistory() {
	return new Promise(function (resolve) {
		ttStorage.get("api_history", function (api_history) {
			let time_limit = 10 * 60 * 60 * 1000;

			for (let type in api_history) {
				let data = [...api_history[type]].reverse();

				for (let fetch of data) {
					if (new Date() - new Date(fetch.date) > time_limit) {
						data.splice(data.indexOf(fetch), 1);
					}
				}

				data.reverse();
				api_history[type] = data;
			}

			ttStorage.set({ "api_history": api_history }, function () {
				console.log("	API history cleared");
				return resolve(true);
			});
		});
	});
}
