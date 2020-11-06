console.log("START - Background Script");

// noinspection JSUnusedLocalSymbols
let [seconds, minutes, hours, days] = [1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];

let notifications = {
	travel: {},
	hospital: {},
	chain: {},
	chain_count: {},
	loot: {},
	events: {},
	messages: {},
	stakeouts: {},
	nerve: {},
	energy: {},
	happy: {},
	life: {},
	new_day: {},
	drugs: {},
};

const links = {
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	education: "https://www.torn.com/education.php#/step=main",
	messages: "https://www.torn.com/messages.php",
	events: "https://www.torn.com/events.php#/step=all",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain",
};

let userdata,
	torndata,
	settings,
	api_key,
	proxy_key,
	chat_highlight,
	itemlist,
	travel_market,
	oc,
	allies,
	loot_times,
	yata,
	target_list,
	vault,
	mass_messages,
	custom_links,
	loot_alerts,
	extensions,
	new_version,
	hide_icons,
	quick,
	notes,
	profile_notes,
	stakeouts,
	updated,
	networth,
	filters,
	cache,
	watchlist;

// First - set storage
console.log("Checking Storage.");
let setup_storage = new Promise((resolve) => {
	ttStorage.get(null, (old_storage) => {
		if (!old_storage || Object.keys(old_storage).length === 0) {
			// fresh install
			console.log("	Setting new storage.");
			ttStorage.set(STORAGE, () => {
				console.log("	Storage set");
				return resolve(true);
			});
		} else {
			// existing storage
			console.log("Converting old storage.");
			console.log("	Old storage", old_storage);
			let new_storage = convertStorage(old_storage, STORAGE);
			specificMigration({ ...new_storage });

			console.log("	New storage", new_storage);

			ttStorage.clear(() => {
				ttStorage.set(new_storage, () => {
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
				if (typeof STORAGE[key] != "undefined" && typeof STORAGE[key] !== typeof old_storage[key] && key !== "market_value") {
					new_local_storage[key] = STORAGE[key];
					continue;
				}

				if (typeof STORAGE[key] == "object" && !Array.isArray(STORAGE[key])) {
					if (Object.keys(STORAGE[key]).length === 0 || key === "chat_highlight") new_local_storage[key] = old_storage[key];
					else new_local_storage[key] = convertStorage(old_storage[key], STORAGE[key]);
				} else {
					if (STORAGE[key] === "force_false") new_local_storage[key] = false;
					else if (STORAGE[key] === "force_true") new_local_storage[key] = true;
					else if (typeof STORAGE[key] == "string" && STORAGE[key].indexOf("force_") > -1) new_local_storage[key] = STORAGE[key].split(/_(.+)/)[1];
					else new_local_storage[key] = old_storage[key];
				}
			}

			return new_local_storage;
		}

		function specificMigration(storage) {
			/*
			 * 5.0.1 --> 5.1
			 */
			// Change chain notifications to seconds instead of minutes.
			for (let i in storage.settings.notifications.chain) {
				if (parseFloat(storage.settings.notifications.chain[i]) > 5) continue;

				storage.settings.notifications.chain[i] = parseFloat(storage.settings.notifications.chain[i]) * 60;
			}

			return storage;
		}
	});
});

setup_storage.then(async (success) => {
	if (!success) {
		return;
	}

	ttStorage.get(null, async (db) => {
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
		mass_messages = db.mass_messages;
		custom_links = db.custom_links;
		loot_alerts = db.loot_alerts;
		extensions = db.extensions;
		new_version = db.new_version;
		hide_icons = db.hide_icons;
		quick = db.quick;
		notes = db.notes;
		profile_notes = db.profile_notes;
		stakeouts = db.stakeouts;
		updated = db.updated;
		networth = db.networth;
		filters = db.filters;
		cache = db.cache;
		watchlist = db.watchlist;
		yata = db.yata;

		if (api_key) {
			initiateTasks();

			// Update info about installed extensions
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			// Clear API history
			await clearAPIhistory();
		}
	});
});

function initiateTasks() {
	console.log("Setting up intervals.");
	setInterval(Main_5_seconds, 5 * seconds); // 5 seconds
	setInterval(Main_30_seconds, 30 * seconds); // 30 seconds
	setInterval(Main_1_minute, minutes); // 1 minute

	Main_30_seconds();
	Main_1_minute();
}

function Main_5_seconds() {
	if (!settings.notifications.global) return;

	console.group("Notifications");

	// Notifications
	console.log(notifications);
	for (let notification_type in notifications) {
		for (let notification_key in notifications[notification_type]) {
			const notification = notifications[notification_type][notification_key];
			if (notification.seen === 0 && !notification.skip) {
				notifyUser(notification.title, notification.text, notification.url);

				notifications[notification_type][notification_key].seen = 1;
			}

			if (notification.seen === 1 && new Date() - notification.date > 7 * 24 * 60 * 60 * 1000) {
				// notifications[notification_type][notification_key] = undefined;
				delete notifications[notification_type][notification_key];
			}
		}
	}

	console.groupEnd();
}

function Main_30_seconds() {
	console.log("Start Main");

	ttStorage.get(
		["api_key", "proxy_key", "settings", "loot_times", "target_list", "stakeouts", "torndata", "networth", "oc", "userdata", "yata"],
		async ([api_key, proxy_key, settings, oldLootTimes, oldTargetList, oldStakeouts, oldTorndata, oldNetworth, oldOC, oldUserdata, oldYata]) => {
			let apiKey;
			let usingProxy = false;

			if (proxy_key !== undefined && proxy_key !== "") {
				apiKey = proxy_key;
				usingProxy = true;
			} else if (api_key !== undefined && api_key !== "") {
				apiKey = api_key;
			} else {
				console.log("NO API/PROXY KEY");
				return;
			}

			console.log(`Using Proxy: (${usingProxy}). KEY: (${apiKey})`);

			// Userdata - essential
			console.log("Fetching userdata - essential");
			oldUserdata = await updateUserdata_essential(oldUserdata, oldTargetList, settings);

			// Userdata - basic
			console.log("Fetching userdata - basic");
			if (
				!oldUserdata ||
				((!oldUserdata.personalstats || !oldUserdata.personalstats.date || new Date() - new Date(oldUserdata.personalstats.date) >= 2 * minutes) &&
					(!oldUserdata.last_action || oldUserdata.last_action.status !== "Offline"))
			) {
				await updateUserdata_basic(oldUserdata, oldTorndata);
			}

			// Loot Times
			// console.log("NPC FETCH TIME", NPC_FETCH_TIME);
			// oldLootTimes = undefined
			// oldYata = { error: true
			if ((!oldLootTimes && (!oldYata || !oldYata.error)) || new Date(oldYata.next_loot_update).getTime() <= Date.now()) {
				updateLootTimes()
					.then(() => console.log("NPC loot times are set up."))
					.catch((error) => console.error("Error while updating loot times.", error));
			}

			// Networth data
			if (!oldNetworth || !oldNetworth.current.date || new Date() - new Date(oldNetworth.current.date) >= 5 * minutes) {
				console.log("Setting up Networth data");
				await updateNetworthData();
			}

			// Stocks data
			if (!oldTorndata || !oldTorndata.stocks || !oldTorndata.stocks.date || new Date() - new Date(!oldTorndata.stocks.date) >= 15 * minutes) {
				console.log("Setting up Stocks data");
				await updateStocksData();
			}

			// Faction data
			if (settings.pages.faction.oc_time && (!oldOC || !oldOC.date || new Date() - new Date(oldOC.date) >= 15 * minutes)) {
				console.log("Setting up OC info");
				await updateOCinfo();
			}

			// Torndata
			if (!oldTorndata || !oldTorndata.date || new Date() - new Date(oldTorndata.date) >= days) {
				console.log("Setting up torndata.");
				await updateTorndata(oldTorndata);
			}

			// Stakeouts
			console.log("Fetching stakeouts");
			await updateStakeouts(oldStakeouts);

			// Doctorn
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			console.log("End Main");
		}
	);
}

async function Main_1_minute() {
	await clearCache();

	// Clear API history
	await clearAPIhistory();
}

/*
 * Updating Functions
 */

function updateTargetList(player_id, target_list, attackHistory, first_time) {
	return new Promise((resolve) => {
		fetchApi_v2("torn", { section: "user", selections: attackHistory })
			.then((response) => {
				const { attacks } = response;
				console.log("Updating Target list", { target_list, attacks_data: attacks });

				for (let fight_id in attacks) {
					if (parseInt(fight_id) <= parseInt(target_list.last_target)) {
						continue;
					}

					target_list.last_target = fight_id;
					let fight = attacks[fight_id];
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
								special: [],
							},
							respect_base: {
								leave: [],
								mug: [],
								hosp: [],
								arrest: [],
								special: [],
							},
						};
					}

					target_list.targets[opponent_id].last_attack = fight.timestamp_ended * 1000;

					if (fight.defender_id === player_id) {
						// user defended
						if (fight.result === "Lost") {
							target_list.targets[opponent_id].defend++;
						} else {
							target_list.targets[opponent_id].defend_lose++;
						}
					} else if (fight.attacker_id === player_id) {
						// user attacked
						if (fight.result === "Lost") target_list.targets[opponent_id].lose++;
						else if (fight.result === "Stalemate") target_list.targets[opponent_id].stalemate++;
						else {
							target_list.targets[opponent_id].win++;
							let respect = parseFloat(fight.respect_gain);

							if (!first_time)
								respect = respect / fight.modifiers.war / fight.modifiers.groupAttack / fight.modifiers.overseas / fight.modifiers.chainBonus; // get base respect

							if (fight.stealthed === "1") target_list.targets[opponent_id].stealth++;

							switch (fight.result) {
								case "Mugged":
									target_list.targets[opponent_id].mug++;

									first_time
										? target_list.targets[opponent_id].respect.mug.push(respect)
										: target_list.targets[opponent_id].respect_base.mug.push(respect);
									break;
								case "Hospitalized":
									target_list.targets[opponent_id].hosp++;

									first_time
										? target_list.targets[opponent_id].respect.hosp.push(respect)
										: target_list.targets[opponent_id].respect_base.hosp.push(respect);
									break;
								case "Attacked":
									target_list.targets[opponent_id].leave++;

									first_time
										? target_list.targets[opponent_id].respect.leave.push(respect)
										: target_list.targets[opponent_id].respect_base.leave.push(respect);
									break;
								case "Arrested":
									target_list.targets[opponent_id].arrest++;

									first_time
										? target_list.targets[opponent_id].respect.arrest.push(respect)
										: target_list.targets[opponent_id].respect_base.arrest.push(respect);
									break;
								case "Special":
									target_list.targets[opponent_id].special++;

									first_time
										? target_list.targets[opponent_id].respect.special.push(respect)
										: target_list.targets[opponent_id].respect_base.special.push(respect);
									break;
								case "Assist":
									target_list.targets[opponent_id].assist++;
									break;
							}
						}
					}
				}

				target_list.targets.date = new Date().toString();
				ttStorage.set({ target_list: target_list }, () => {
					console.log("	Target list set");
					return resolve();
				});
			})
			.catch((error) => {
				console.log("ERROR", error);
				return resolve();
			});
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
				doctorn: false,
			};

			if (settings.check_extensions) {
				for (let extension in extensions) {
					extensions[extension] = await detectExtension(browser, extension);
				}
			}

			ttStorage.change({ extensions }, () => resolve(extensions));
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
		fetchApi_v2("torn", { section: "torn", selections: "honors,medals,items,pawnshop,education" })
			.then((torndata) => {
				let itemlist = { items: { ...torndata.items }, date: new Date().toString() };
				delete torndata.items;

				torndata.date = new Date().toString();

				torndata.stocks = oldTorndata.stocks;

				ttStorage.set({ torndata: torndata, itemlist: itemlist }, () => {
					console.log("	Torndata info updated.");
					console.log("	Itemlist info updated.");
					return resolve({ success: true, message: "Torndata fetched" });
				});
			})
			.catch((err) => {
				console.log("ERROR", err);
				return resolve({ success: false, message: err });
			});
	});
}

function updateLootTimes() {
	return new Promise((resolve, reject) => {
		fetchApi_v2("yata__v1", { section: "loot" })
			.then((result) => {
				const ALL_NPCS = {
					4: { name: "Duke" },
					10: { name: "Scrooge" },
					15: { name: "Leslie" },
					19: { name: "Jimmy" },
				};

				const time = Date.now();

				let npcs = {};
				for (let id in result.hosp_out) {
					const hosp_out = result.hosp_out[id];
					const time_out = hosp_out * 1000 - time;

					let levelCurrent;
					if (time_out < 0) {
						levelCurrent = 0;
					} else if (time_out < 60 * 30) {
						levelCurrent = 1;
					} else if (time_out < 60 * 90) {
						levelCurrent = 2;
					} else if (time_out < 60 * 210) {
						levelCurrent = 3;
					} else if (time_out < 60 * 450) {
						levelCurrent = 4;
					} else {
						levelCurrent = 5;
					}

					npcs[id] = {
						hospout: result.hosp_out[id],
						levels: {
							next: levelCurrent === 5 ? 5 : levelCurrent + 1,
						},
						name: ALL_NPCS[id] ? ALL_NPCS[id].name : "Unknown",
						timings: {
							1: { ts: hosp_out },
							2: { ts: hosp_out + 60 * 30 },
							3: { ts: hosp_out + 60 * 90 },
							4: { ts: hosp_out + 60 * 210 },
							5: { ts: hosp_out + 60 * 450 },
						},
					};
				}

				ttStorage.set({ loot_times: npcs, yata: { next_loot_update: result.next_update * 1000, error: false } }, async () => {
					console.log("	Loot times set.", { loot_times: npcs, yata: { next_loot_update: result.next_update * 1000 } });
					await checkLootAlerts();
					return resolve();
				});
			})
			.catch((error) => {
				ttStorage.set({ yata: { next_loot_update: Date.now() + TO_MILLIS.HOURS, error: true } }, () => resolve());

				console.log(`Error while pulling YATA's loot timings. Attempting again at ${new Date(Date.now() + TO_MILLIS.HOURS).toString()}`);
				return reject(error.error);
			});
	});
}

function updateNetworthData() {
	return new Promise((resolve) => {
		fetchApi_v2("torn", { section: "user", selections: "personalstats,networth" })
			.then((data) => {
				let ps = data.personalstats;
				let new_networth = data.networth;
				let networth = {
					current: {
						date: new Date().toString(),
						value: new_networth,
					},
					previous: {
						value: {
							pending: ps.networthpending,
							wallet: ps.networthwallet,
							bank: ps.networthbank,
							points: ps.networthpoints,
							cayman: ps.networthcayman,
							vault: ps.networthvault,
							piggybank: ps.networthpiggybank,
							items: ps.networthitems,
							displaycase: ps.networthdisplaycase,
							bazaar: ps.networthbazaar,
							properties: ps.networthproperties,
							stockmarket: ps.networthstockmarket,
							auctionhouse: ps.networthauctionhouse,
							company: ps.networthcompany,
							bookie: ps.networthbookie,
							loan: ps.networthloan,
							unpaidfees: ps.networthunpaidfees,
							total: ps.networth,
						},
					},
				};

				// Set Userdata & Networth
				ttStorage.set({ networth: networth }, () => {
					console.log("Networth info updated.");
					return resolve();
				});
			})
			.catch((err) => {
				console.log("ERROR", err);
				return resolve();
			});
	});
}

function updateStocksData() {
	return new Promise((resolve) => {
		fetchApi_v2("torn", { section: "torn", selections: "stocks" })
			.then((result) => {
				const stocks = result.stocks;

				stocks.date = new Date().toString();

				ttStorage.change({ torndata: { stocks: stocks } }, async () => {
					console.log("Stocks info updated.");
					await checkStockAlerts();
					return resolve(true);
				});
			})
			.catch((err) => {
				console.log("ERROR", err);
				return resolve();
			});
	});
}

function updateOCinfo() {
	return new Promise((resolve) => {
		fetchApi_v2("torn", { section: "faction", selections: "crimes" })
			.then((factiondata) => {
				factiondata.crimes.date = new Date().toString();

				ttStorage.set({ oc: factiondata.crimes }, () => {
					console.log("	Faction data set.");
					return resolve(true);
				});
			})
			.catch((err) => {
				console.log("ERROR", err);
				return resolve();
			});
	});
}

function updateUserdata_essential(oldUserdata, oldTargetList, settings) {
	return new Promise((resolve) => {
		const selections = `profile,travel,bars,cooldowns,money,events,messages,timestamp`;

		fetchApi_v2("torn", { section: "user", selections: selections })
			.then(async (userdata) => {
				let shouldFetchAttackData = true;

				// Generate icon with bars
				if (!settings.icon_bars.show) {
					chrome.browserAction.setIcon({ path: "images/icon128.png" });
				} else {
					let numBars = 0;
					if (settings.icon_bars.energy) numBars++;
					if (settings.icon_bars.nerve) numBars++;
					if (settings.icon_bars.happy) numBars++;
					if (settings.icon_bars.life) numBars++;
					if (settings.icon_bars.chain && userdata.chain && userdata.chain.current > 0) numBars++;
					if (settings.icon_bars.travel && userdata.travel && userdata.travel.time_left > 0) numBars++;

					let canvas = document.createElement("canvas");
					canvas.width = 128;
					canvas.height = 128;

					let canvasContext = canvas.getContext("2d");
					canvasContext.fillStyle = "#fff";
					canvasContext.fillRect(0, 0, canvas.width, canvas.height);

					let padding = 10;

					let barHeight = (canvas.height - (numBars + 1) * 10) / numBars;
					let barWidth = canvas.width - padding * 2;

					let barColors = {
						energy: "#0ac20a",
						nerve: "#c20a0a",
						happy: "#c2b60a",
						life: "#0060ff",
						chain: "#0ac2b2",
						travel: "#8b0ac2",
					};

					let y = padding;

					Object.keys(barColors).forEach((key) => {
						if (!settings.icon_bars[key] || !userdata[key]) return;
						if (key === "chain" && userdata.chain.current === 0) return;

						let width = 0;
						if (key === "travel") {
							let totalTrip = userdata[key].timestamp - userdata[key].departed;
							width = barWidth * ((totalTrip - userdata[key].time_left) / totalTrip);
						} else {
							width = barWidth * (userdata[key].current / userdata[key].maximum);
						}

						width = Math.min(width, barWidth);

						canvasContext.fillStyle = barColors[key];
						canvasContext.fillRect(padding, y, width, barHeight);

						y += barHeight + padding;
					});

					chrome.browserAction.setIcon({ imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height) });
				}

				// Check for new messages
				let message_count = 0;
				let messages = [];
				for (let message_key of Object.keys(userdata.messages).reverse()) {
					let message = userdata.messages[message_key];

					if (message.seen === 0) {
						if (settings.notifications.global && settings.notifications.messages && !notifications.messages[message_key]) {
							messages.push({
								id: message_key,
								title: message.title,
								name: message.name,
							});
							notifications.messages[message_key] = { skip: true };
						}
						message_count++;
					} else {
						break;
					}
				}

				if (messages.length) {
					let text = `${messages[0].title} - by ${messages[0].name}`;
					if (messages.length > 1) text += `\n(and ${messages.length - 1} more messages)`;

					notifications.messages["combined"] = {
						title: `TornTools - New Messages${messages.length > 1 ? "s" : ""}`,
						text,
						url: links.messages,
						seen: 0,
						date: new Date(),
					};
				}

				// Check for new events
				let event_count = 0;
				let events = [];
				for (let event_key of Object.keys(userdata.events).reverse()) {
					let event = userdata.events[event_key];

					if (event.seen === 0) {
						if (
							(event.event.includes("attacked") ||
								event.event.includes("mugged") ||
								event.event.includes("arrested") ||
								event.event.includes("hospitalized")) &&
							!event.event.includes("Someone")
						) {
							shouldFetchAttackData = true;
						}

						if (settings.notifications.global && settings.notifications.events && !notifications.events[event_key]) {
							events.push({
								id: event_key,
								event: event.event,
							});
							notifications.events[event_key] = { skip: true };
						}

						event_count++;
					} else {
						break;
					}
				}

				if (events.length) {
					let text = events[0].event.replace(/<\/?[^>]+(>|$)/g, "");
					if (events.length > 1) text += `\n(and ${events.length - 1} more events)`;

					notifications.events["combined"] = {
						title: `TornTools - New Event${events.length > 1 ? "s" : ""}`,
						text,
						url: links.events,
						seen: 0,
						date: new Date(),
					};
				}

				// Messages & Events badge
				if (event_count > 0 && message_count > 0) {
					setBadge(`${message_count}/${events.length}`, { color: "#1ed2ac" });
				} else if (event_count > 0) {
					setBadge("new_event", { count: event_count });
				} else if (message_count > 0) {
					setBadge("new_message", { count: message_count });
				} else if (!isNaN(await getBadgeText())) {
					setBadge("");
				}

				// Energy decrease check
				if (!oldUserdata || !oldUserdata.energy || oldUserdata.energy.current - userdata.energy.current >= 25) {
					shouldFetchAttackData = true;
				}

				if (settings.notifications.global) {
					// Check for Status change
					if (oldUserdata.status && settings.notifications.status) {
						let current_status = userdata.status.state;
						let previous_status = oldUserdata.status.state;

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
					if (oldUserdata.cooldowns && settings.notifications.cooldowns) {
						for (let cd_type in userdata.cooldowns) {
							if (userdata.cooldowns[cd_type] === 0 && oldUserdata.cooldowns[cd_type] !== 0) {
								notifyUser("TornTools - Cooldowns", `Your ${cd_type} cooldown has ended`, links.items);
							}
						}
					}

					// Check for education
					if (oldUserdata.education_timeleft && settings.notifications.education) {
						if (userdata.education_timeleft === 0 && oldUserdata.education_timeleft !== 0) {
							notifyUser("TornTools - Education", `You have finished your education course`, links.education);
						}
					}

					// Check for travelling
					if (oldUserdata.travel && settings.notifications.traveling) {
						if (userdata.travel.time_left === 0 && oldUserdata.travel.time_left !== 0) {
							notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}`, links.home);
						}
					}

					// Check for bars
					for (let bar of ["energy", "happy", "nerve", "life"]) {
						if (oldUserdata[bar] && settings.notifications[bar].length > 0) {
							let checkpoints = settings.notifications[bar]
								.map((x) => (typeof x === "string" && x.includes("%") ? (parseInt(x) / 100) * userdata[bar].maximum : parseInt(x)))
								.sort((a, b) => b - a);
							// console.log(`${bar} checkpoints previous:`, settings.notifications[bar]);
							// console.log(`${bar} checkpoints modified:`, checkpoints);
							for (let checkpoint of checkpoints) {
								if (
									oldUserdata[bar].current < userdata[bar].current &&
									userdata[bar].current >= checkpoint &&
									!notifications[bar][checkpoint]
								) {
									notifications[bar][checkpoint] = {
										title: "TornTools - Bars",
										text: `Your ${capitalize(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}`,
										url: links.home,
										seen: 0,
										date: new Date(),
									};
									break;
									// notifyUser("TornTools - Bars", `Your ${capitalize(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}`, links.home);
									// break;
								} else if (userdata[bar].current < checkpoint && notifications[bar][checkpoint]) {
									delete notifications[bar][checkpoint];
								}
							}
						}
					}

					// Check for hospital notification
					if (settings.notifications.hospital.length > 0 && userdata.status.state === "Hospital") {
						for (let checkpoint of settings.notifications.hospital.sort((a, b) => a - b)) {
							let time_left = new Date(userdata.status.until * 1000) - new Date(); // ms

							if (time_left <= parseInt(checkpoint) * 60 * 1000 && !notifications.hospital[checkpoint]) {
								notifications.hospital[checkpoint] = {
									title: "TornTools - Hospital",
									text: `You will be out of the Hospital in ${Math.floor(time_left / 1000 / 60)} minutes ${((time_left / 1000) % 60).toFixed(
										0
									)} seconds`,
									url: links.hospital,
									seen: 0,
									date: new Date(),
								};
								break;
							}
						}
					} else {
						notifications.hospital = {};
					}

					// Check for travel notification
					if (settings.notifications.landing.length > 0 && userdata.travel.time_left > 0) {
						for (let checkpoint of settings.notifications.landing.sort((a, b) => a - b)) {
							let time_left = new Date(userdata.travel.timestamp * 1000) - new Date(); // ms

							if (time_left <= parseInt(checkpoint) * 60 * 1000 && !notifications.travel[checkpoint]) {
								notifications.travel[checkpoint] = {
									checkpoint: checkpoint,
									title: "TornTools - Travel",
									text: `You will be Landing in ${Math.floor(time_left / 1000 / 60)} minutes ${((time_left / 1000) % 60).toFixed(0)} seconds`,
									url: links.home,
									seen: 0,
									date: new Date(),
								};
								break;
							}
						}
					} else {
						notifications.travel = {};
					}

					// Check for drug notification
					if (settings.notifications.drugs.length && userdata.cooldowns.drug > 0) {
						for (let checkpoint of settings.notifications.drugs.sort((a, b) => a - b)) {
							let time_left = userdata.cooldowns.drug * 1000; // ms

							if (time_left <= parseInt(checkpoint) * 1000 && !notifications.drugs[checkpoint]) {
								notifications.drugs[checkpoint] = {
									checkpoint: checkpoint,
									title: "TornTools - Drugs",
									text: `Your drug cooldown will end in ${Math.floor(time_left / 1000 / 60)} minutes ${((time_left / 1000) % 60).toFixed(
										0
									)} seconds`,
									url: links.items,
									seen: 0,
									date: new Date(),
								};
								break;
							}
						}
					} else {
						notifications.drugs = {};
					}

					// Check for chain notification
					if (settings.notifications.chain.length > 0 && userdata.chain.timeout !== 0 && userdata.chain.current >= 10) {
						for (let checkpoint of settings.notifications.chain.sort((a, b) => a - b)) {
							let real_timeout = userdata.chain.timeout * 1000 - (new Date() - new Date(userdata.timestamp * 1000)); // ms
							const chain_count = userdata.chain.current;

							if (real_timeout <= parseFloat(checkpoint) * 1000 && !notifications.chain[`${chain_count}_${checkpoint}`]) {
								notifications.chain[`${chain_count}_${checkpoint}`] = {
									checkpoint: checkpoint,
									title: "TornTools - Chain",
									text: `Chain timer will run out in ${Math.floor(real_timeout / 1000 / 60)} minutes ${((real_timeout / 1000) % 60).toFixed(
										0
									)} seconds`,
									url: links.chain,
									seen: 0,
									date: new Date(),
								};
								break;
							}
						}
					} else {
						notifications.chain = {};
					}

					// Check for chain count notification
					if (settings.notifications.chain_count.length > 0 && userdata.chain.timeout !== 0 && userdata.chain.current >= 10) {
						const chain_count = userdata.chain.current;
						const next_bonus = nextBonus(chain_count);
						console.log("count", chain_count);
						console.log("next bonus", next_bonus);

						for (let checkpoint of settings.notifications.chain_count.sort((a, b) => b - a)) {
							console.log("checkpoint", checkpoint);

							if (next_bonus - chain_count <= parseInt(checkpoint) && !notifications.chain_count[`${next_bonus}_${checkpoint}`]) {
								notifications.chain_count[`${next_bonus}_${checkpoint}`] = {
									checkpoint: checkpoint,
									title: "TornTools - Chain",
									text: `Chain will reach next Bonus Hit in ${nextBonus(chain_count) - chain_count} hits`,
									url: links.chain,
									seen: 0,
									date: new Date(),
								};
								break;
							}
						}

						function nextBonus(current) {
							let bonus;

							for (let BONUS of CHAIN_BONUSES) {
								if (BONUS > current) {
									bonus = BONUS;
									break;
								}
							}

							return bonus;
						}
					}

					// Check for New Day notification
					let torn_time = new Date(new Date(userdata.timestamp).toUTCString().replace(" GMT", ""));
					// noinspection EqualityComparisonWithCoercionJS
					if (
						settings.notifications.new_day &&
						torn_time.getHours() == "00" &&
						torn_time.getMinutes() == "00" &&
						!(torn_time.getDate().toString() in notifications.new_day)
					) {
						notifications.new_day[torn_time.getDate().toString()] = {
							title: "TornTools - New Day",
							text: "It's a new day! Hopefully a sunny one.",
							url: links.home,
							seen: 0,
							date: new Date(),
						};
					}
				}

				oldUserdata.date = new Date().toString();
				for (let key in userdata) {
					oldUserdata[key] = userdata[key];
				}

				// Set Userdata
				ttStorage.set({ userdata: oldUserdata }, async () => {
					console.log("	Userdata essential set.");

					if (shouldFetchAttackData) {
						let attackHistory;
						if (oldTargetList.show) {
							if (oldTargetList.last_target === -1) {
								attackHistory = "attacksfull";
							} else {
								attackHistory = "attacks";
							}
						}

						// Target list
						await updateTargetList(userdata.player_id, oldTargetList, attackHistory, attackHistory === "attacksfull");
					}

					return resolve(oldUserdata);
				});
			})
			.catch((err) => {
				console.error("ERROR", err);
				return resolve(oldUserdata);
			});
	});
}

function updateUserdata_basic(oldUserdata, oldTorndata) {
	return new Promise((resolve) => {
		let fetchEducation = true;
		if (oldTorndata.education && oldUserdata.education_completed && oldUserdata.education_completed.length === Object.keys(oldTorndata.education).length) {
			fetchEducation = false;
		}

		const selections = `personalstats,crimes,battlestats,perks,workstats,stocks,ammo,inventory${fetchEducation ? `,education` : ""},refills,honors,medals`;

		fetchApi_v2("torn", { section: "user", selections: selections })
			.then(async (userdata) => {
				userdata.personalstats.date = new Date().toString();
				for (let key in userdata) {
					oldUserdata[key] = userdata[key];
				}

				// Set Userdata
				ttStorage.set({ userdata: oldUserdata }, () => {
					console.log("	Userdata basic set.");
					return resolve(true);
				});
			})
			.catch((err) => {
				console.error("ERROR", err);
				return resolve();
			});
	});
}

function updateStakeouts(oldStakeouts) {
	return new Promise(async () => {
		if (Object.keys(oldStakeouts).length > 0) {
			console.log("Checking stakeouts.");
			for (let user_id of Object.keys(oldStakeouts)) {
				await new Promise((resolve) => {
					fetchApi_v2("torn", { section: "user", objectid: user_id })
						.then(async (stakeout_info) => {
							console.log(`	Checking ${stakeout_info.name} [${user_id}]`);

							// Set info
							oldStakeouts[user_id].info.last_action = stakeout_info.last_action;
							oldStakeouts[user_id].info.username = stakeout_info.name;

							await new Promise((resolve, reject) => {
								ttStorage.set({ stakeouts: oldStakeouts }, () => {
									return resolve();
								});
							});

							if (oldStakeouts[user_id].notifications.online) {
								if (stakeout_info.last_action.status === "Online" && !notifications.stakeouts[user_id + "_online"]) {
									console.log("	Adding [online] notification to notifications.");
									notifications.stakeouts[user_id + "_online"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Online`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date(),
									};
								} else if (stakeout_info.last_action.status !== "Online") {
									delete notifications.stakeouts[user_id + "_online"];
								}
							}
							if (oldStakeouts[user_id].notifications.okay) {
								if (stakeout_info.status.state === "Okay" && !notifications.stakeouts[user_id + "_okay"]) {
									console.log("	Adding [okay] notification to notifications.");
									notifications.stakeouts[user_id + "_okay"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now Okay`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date(),
									};
								} else if (stakeout_info.status.state !== "Okay") {
									delete notifications.stakeouts[user_id + "_okay"];
								}
							}
							if (oldStakeouts[user_id].notifications.lands) {
								if (stakeout_info.status.state !== "Traveling" && !notifications.stakeouts[user_id + "_lands"]) {
									console.log("	Adding [lands] notification to notifications.");
									notifications.stakeouts[user_id + "_lands"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now ${
											stakeout_info.status.state === "Abroad" ? stakeout_info.status.description : "in Torn"
										}`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date(),
									};
								} else if (stakeout_info.status.state === "Traveling") {
									delete notifications.stakeouts[user_id + "_lands"];
								}
							}
							if (oldStakeouts[user_id].notifications.hospital) {
								if (stakeout_info.status.state === "Hospital" && !notifications.stakeouts[user_id + "_hospital"]) {
									console.log("	Adding [hospital] notification to notifications.");
									notifications.stakeouts[user_id + "_hospital"] = {
										title: `TornTools - Stakeouts`,
										text: `${stakeout_info.name} is now in Hospital`,
										url: `https://www.torn.com/profiles.php?XID=${user_id}`,
										seen: 0,
										date: new Date(),
									};
								} else if (stakeout_info.status.state !== "Hospital") {
									delete notifications.stakeouts[user_id + "_hospital"];
								}
							}

							return resolve(true);
						})
						.catch((err) => {
							console.log("ERROR", err);
							return resolve();
						});
				});
			}
		} else {
			console.log("No stakeouts");
		}
	});
}

/*
 * Various Functions
 */

// Check if new version is installed
// noinspection JSDeprecatedSymbols
chrome.runtime.onInstalled.addListener(() => {
	ttStorage.set({ updated: true, new_version: { available: false } }, () => {
		console.log("Extension updated:", chrome.runtime.getManifest().version);
	});
});

const notificationTestPlayer = new Audio();
notificationTestPlayer.autoplay = false;
notificationTestPlayer.preload = true;

// Messaging
// noinspection JSDeprecatedSymbols
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// console.log(sender.tab ? "from a content script:"+sender.tab.url : "from the extension");

	switch (request.action) {
		case "initialize":
			console.log("Initializing app.");

			initiateTasks();
			sendResponse({ success: true, message: "App initialized." });

			// Update info about installed extensions
			updateExtensions().then((extensions) => console.log("Updated extension information!", extensions));

			// Clear API history
			clearAPIhistory().then(() => console.log("Cleared API history!"));
			break;
		case "fetch":
			if (request.type === "torndata") {
				console.log("Setting up torndata.");
				updateTorndata().then(sendResponse);
			}
			break;
		case "fetch-relay":
			fetchApi_v2(request.location, request.options)
				.then((result) => {
					sendResponse(result);
				})
				.catch((err) => {
					sendResponse(err);
				});
			break;
		case "play-notification-sound":
			getNotificationSound(request.type).then((sound) => {
				if (!sound || Number.isInteger(sound)) {
					return;
				}
				notificationTestPlayer.volume = Number.parseInt(request.volume) / 100;
				notificationTestPlayer.src = sound;
				notificationTestPlayer.play();
			});
			break;
		case "stop-notification-sound":
			notificationTestPlayer.pause();
			break;
		default:
			sendResponse({ success: false, message: "Unknown command." });
			break;
	}
	return true;
});

// Update available
// noinspection JSDeprecatedSymbols
chrome.runtime.onUpdateAvailable.addListener((details) => {
	console.log("Details", details);

	setBadge("update_available");

	ttStorage.set({
		new_version: {
			available: true,
			version: details.version,
		},
	});
});

// Notification links
// noinspection JSDeprecatedSymbols
chrome.notifications.onClicked.addListener((notification_id) => {
	ttStorage.get("settings", (settings) => {
		if (settings.notifications_link) {
			chrome.tabs.create({ url: notificationLinkRelations[notification_id] });
		}
	});
});

// noinspection JSDeprecatedSymbols
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "local") return;

	if (changes.api_key) {
		console.log("New API Key", api_key, changes.api_key.newValue);
		api_key = changes.api_key.newValue;
	} else if (changes.cache) {
		cache = changes.cache.newValue;
	}
	if (changes.proxy_key) {
		console.log("New Proxy Key", proxy_key, changes.proxy_key.newValue);
		proxy_key = changes.proxy_key.newValue;
	}
});

async function checkStockAlerts() {
	console.group("Checking stock prices");

	await new Promise((resolve) => {
		let notified = false;

		ttStorage.get(["stock_alerts", "torndata"], ([stock_alerts, torndata]) => {
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
						stock_alerts: {
							[stock_id]: {
								reach: undefined,
							},
						},
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
						stock_alerts: {
							[stock_id]: {
								fall: undefined,
							},
						},
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

	await new Promise((resolve) => {
		let notified = false;

		ttStorage.get(["loot_alerts", "loot_times"], ([loot_alerts, loot_times]) => {
			let current_time = parseInt((new Date().getTime() / 1000).toFixed(0));

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
							text: `${loot_times[npc_id].name} is reaching loot level ${arabicToRoman(alert_level)} in ${timeUntil(
								(alert_loot_time - current_time) * 1000
							).replace("m", "min")}`,
							url: `https://www.torn.com/profiles.php?XID=${npc_id}`,
							seen: 0,
							date: new Date(),
						};
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

				if (!t.timestamp || timestamp > t.timestamp + t.ttl) {
					delete cache[type][key];
				}
			}
		}

		ttStorage.set({ cache: cache }, () => {
			console.log("	Cleared cache.");
			return resolve(true);
		});
	});

	console.groupEnd();
}

async function detectExtension(browserName, ext) {
	const ids = {
		doctorn: {
			chrome: { id: "kfdghhdnlfeencnfpbpddbceglaamobk" },
			firefox: { name: "DoctorN for Torn" },
		},
		/* as example
		"torntools": {
			"firefox": {"id": "torntools@mephiles.github.com"}
		}
		 */
	};

	if (!(ext in ids)) return Promise.reject(`Detection for '${ext}' is not supported!`);
	else if (!(browserName in ids[ext])) return Promise.reject(`Detection for '${ext}' with ${browserName} is not supported!`);

	const information = ids[ext][browserName];

	if (information.id) {
		return new Promise((resolve) => {
			chrome.management.get(information.id, (result) => {
				if (result && result.enabled === true) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	} else if (information.name) {
		const getAll = chrome.management.getAll;
		if (!getAll) return Promise.reject(`Detection for '${ext}' with ${browserName} is not supported!`);

		return new Promise(async (resolve) => {
			const addons = await getAll();

			resolve(
				addons &&
					!!addons
						.filter((addon) => addon.type === "extension")
						.filter((addon) => addon.name === information.name)
						.filter((addon) => addon.enabled === true).length
			);
		});
	}
}

function clearAPIhistory() {
	return new Promise((resolve) => {
		ttStorage.get("api_history", (api_history) => {
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

			ttStorage.set({ api_history: api_history }, () => {
				console.log("	API history cleared");
				return resolve(true);
			});
		});
	});
}
