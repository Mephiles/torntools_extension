"use strict";

const notificationPlayer = getAudioPlayer();
const notificationTestPlayer = getAudioPlayer();

let notificationSound, notificationWorker;
const notificationRelations = {};

const notifications = {
	events: {},
	messages: {},
	newDay: {},
	energy: {},
	happy: {},
	nerve: {},
	life: {},
	travel: {},
	drugs: {},
	boosters: {},
	medical: {},
	hospital: {},
	chain: {},
	chainCount: {},
	stakeouts: {},
	npcs: {},
};

let npcUpdater;

(async () => {
	await convertDatabase();
	await loadDatabase();

	notificationHistory = [];
	ttStorage.set({ notificationHistory: [] }).then(() => {});

	await checkUpdate();

	registerUpdaters();

	await showIconBars();
	storageListeners.settings.push(async () => {
		await showIconBars();
	});
})();

async function convertDatabase() {
	const storage = await ttStorage.get();

	if (!storage || !Object.keys(storage).length) {
		console.log("Setting new storage.");
		await ttStorage.reset();
	} else {
		console.log("Old storage.", storage);

		const newStorage = convertGeneral(storage, DEFAULT_STORAGE);
		convertSpecific(storage, newStorage);

		await ttStorage.set(newStorage);

		const keys = Object.keys(newStorage);
		const outdatedKeys = Object.keys(storage).filter((key) => !keys.includes(key));
		if (outdatedKeys.length) await ttStorage.remove(outdatedKeys);

		console.log("New storage.", newStorage);
	}

	function convertGeneral(oldStorage, defaultStorage) {
		const newStorage = {};

		for (const key in defaultStorage) {
			if (!oldStorage) oldStorage = {};
			if (!(key in oldStorage)) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				if (defaultStorage[key] instanceof DefaultSetting) {
					let useCurrent = true;

					if (defaultStorage[key].type === "array") {
						if (!Array.isArray(oldStorage[key])) {
							useDefault();
							useCurrent = false;
						}
					} else if (
						!defaultStorage[key].type.split("|").some((value) => value === typeof oldStorage[key] || (value === "empty" && oldStorage[key] === ""))
					) {
						useDefault();
						useCurrent = false;
					}

					if (useCurrent) newStorage[key] = oldStorage[key];
				} else {
					newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
				}
			}

			function useDefault() {
				if (!defaultStorage[key].hasOwnProperty("defaultValue")) return;

				switch (typeof defaultStorage[key].defaultValue) {
					case "function":
						newStorage[key] = defaultStorage[key].defaultValue();
						break;
					case "boolean":
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
					default:
						newStorage[key] = defaultStorage[key].defaultValue;
						break;
				}
			}
		}

		return newStorage;
	}

	function convertSpecific(storage, newStorage) {
		const versionString = storage?.version?.current || "5.0.0";
		const version = toNumericVersion(versionString);

		let updated = false;
		if (version <= toNumericVersion("5")) {
			if (storage?.notes?.text || storage?.notes?.height) {
				newStorage.notes.sidebar.text = storage.notes.text || "";
				newStorage.notes.sidebar.height = storage.notes.height || "22px";
			}
			if (storage?.profile_notes?.profiles) {
				for (const [id, { height, notes }] of Object.entries(storage.profile_notes.profiles)) {
					newStorage.notes.profile[id] = { height: height || "17px", text: notes };
				}
			}
			newStorage.quick.items = storage?.quick?.items?.map((id) => ({ id: parseInt(id) })) || [];
			if (storage?.stakeouts)
				newStorage.stakeouts = Object.entries(storage.stakeouts)
					.filter(([id]) => !isNaN(id) && !!parseInt(id))
					.map(([id, stakeout]) => ({
						[id]: {
							alerts: {
								okay: stakeout.notifications.okay,
								hospital: stakeout.notifications.hospital,
								landing: stakeout.notifications.lands,
								online: stakeout.notifications.online,
								life: false,
								offline: false,
							},
						},
					}))
					.filter((result) => Object.values(result)[0] !== undefined)
					.reduce((prev, current) => ({ ...prev, ...current }), {});
			if (storage?.stock_alerts)
				newStorage.settings.notifications.types.stocks = Object.entries(storage.stock_alerts)
					.filter(([id]) => !isNaN(id) && !!parseInt(id))
					.map(([id, alert]) => ({
						[id]: {
							priceFalls: parseInt(alert.fall) || "",
							priceReaches: parseInt(alert.reach) || "",
						},
					}))
					.reduce((prev, current) => ({ ...prev, ...current }), {});

			// Reset
			newStorage.quick.crimes = [];
			newStorage.userdata = {};
			newStorage.torndata = {};
			newStorage.cache = {};
			updated = true;
		} else if (version === toNumericVersion("6.0.0")) {
			newStorage.settings.apiUsage.comment = storage?.settings?.apiUsage?.comment || "TornTools";
			updated = true;
		} else if (version <= toNumericVersion("6.3.0")) {
			newStorage.localdata.vault = undefined;
			updated = true;
		}

		const newVersion = chrome.runtime.getManifest().version;
		if (updated) {
			console.log(`Upgraded database from ${versionString} to ${newVersion}`);
		}

		newStorage.version.current = newVersion;

		function toNumericVersion(version) {
			return parseInt(
				version
					.split(".")
					.map((part) => part.padStart(3, "0"))
					.join("")
					.padEnd(9, "9")
			);
		}
	}
}

async function checkUpdate() {
	const oldVersion = version.oldVersion;
	const newVersion = chrome.runtime.getManifest().version;

	const change = { version: { oldVersion: newVersion } };
	if (oldVersion !== newVersion) {
		console.log("New version detected!", newVersion);
		change.version.showNotice = true;
	}

	await ttStorage.change(change);
}

function registerUpdaters() {
	clearCache();
	clearUsage();
	timedUpdates();

	setInterval(sendNotifications, 5 * TO_MILLIS.SECONDS);
	setInterval(clearCache, 5 * TO_MILLIS.SECONDS);
	setInterval(clearUsage, 1 * TO_MILLIS.HOURS);
	setInterval(timedUpdates, 30 * TO_MILLIS.SECONDS);
}

async function sendNotifications() {
	for (const type in notifications) {
		for (const key in notifications[type]) {
			const { skip, seen, date, title, message, url } = notifications[type][key];

			if (!skip && !seen) {
				await notifyUser(title, message, url);

				notifications[type][key].seen = true;
				storeNotification({ title, message, url, type, key, date });
			}

			if (seen && Date.now() - date > 3 * TO_MILLIS.DAYS) {
				delete notifications[type][key];
			}
		}
	}
	await ttStorage.set({ notificationHistory });
}

function timedUpdates() {
	if (api.torn.key) {
		updateUserdata()
			.then(({ updated, types, selections }) => {
				if (updated) console.log(`Updated ${types.join("+")} userdata.`, selections);
				else console.log("Skipped this userdata update.");
			})
			.catch((error) => logError("updating userdata", error));

		updateStakeouts()
			.then(({ updated, success, failed }) => {
				if (updated) {
					if (success || failed) console.log("Updated stakeouts.", { success, failed });
					else console.log("No stakeouts to update.");
				} else console.log("Skipped this stakeout update.");
			})
			.catch((error) => logError("updating stakeouts", error));
		updateFactionStakeouts()
			.then(({ updated, success, failed }) => {
				if (updated) {
					if (success || failed) console.log("Updated faction stakeouts.", { success, failed });
					else console.log("No faction stakeouts to update.");
				} else console.log("Skipped this faction stakeout update.");
			})
			.catch((error) => logError("updating faction stakeouts", error));

		if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
			// Update once every torn day.
			updateTorndata()
				.then(() => console.log("Updated torndata."))
				.catch((error) => logError("updating torndata", error));
		}

		if (!stockdata || !stockdata.date || hasTimePassed(stockdata.date, TO_MILLIS.MINUTES * 5)) {
			updateStocks()
				.then(() => console.log("Updated stocks."))
				.catch((error) => logError("updating stocks", error));
		}

		if (!factiondata || !factiondata.date || hasTimePassed(factiondata.date, TO_MILLIS.MINUTES * 15))
			updateFactiondata()
				.then(() => console.log("Updated factiondata."))
				.catch((error) => logError("updating factiondata", error));
	}

	updateNPCs()
		.then(({ updated, alerts }) => {
			if (updated) console.log("Updated npcs.");
			if (alerts) console.log(`Sent out ${alerts} npc alerts.`);
		})
		.catch((error) => logError("updating npcs", error));

	function logError(message, error) {
		if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
			console.warn(`You disabled our permission to call the API!`);
		} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK) {
			console.warn(`Error due to no internet while ${message}.`);
		} else {
			console.error(`Error while ${message}.`, error);
		}
	}
}

function hasTimePassed(timestamp, time) {
	const difference = Date.now() - timestamp;

	return Math.abs(difference) >= time;
}

function clearCache() {
	ttCache.refresh().catch((error) => console.error("Error while clearing cache.", error));
}

function clearUsage() {
	ttUsage.refresh().catch((error) => console.error("Error while clearing API usage data.", error));
}

async function updateUserdata() {
	const now = Date.now();

	const updatedTypes = [];
	const updateEssential =
		!userdata || !Object.keys(userdata).length || hasTimePassed((userdata.date ?? 0) - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayEssential);
	const updateBasic =
		updateEssential &&
		(!userdata.dateBasic ||
			(hasTimePassed(userdata.dateBasic - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayBasic) &&
				!hasTimePassed(userdata.last_action?.timestamp * 1000, TO_MILLIS.MINUTES * 5)));

	const selections = [];
	if (updateEssential) {
		selections.push("profile", "timestamp");

		for (const selection of ["bars", "cooldowns", "travel", "newmessages", "money", "refills"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}

		// Notifications have a 100K count limit from being fetched via the Torn API
		// Use "newevents" selection only when the old events count > new events count
		// Fetch the notifications count always, to avoid additional API calls
		selections.push("notifications");

		updatedTypes.push("essential");
	}
	if (updateBasic) {
		for (const selection of [
			"personalstats",
			"stocks",
			"inventory",
			"merits",
			"perks",
			"networth",
			"icons",
			"ammo",
			"honors",
			"medals",
			"battlestats",
			"crimes",
			"workstats",
			"skills",
			"weaponexp",
			"properties",
		]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}

		if (settings.apiUsage.user.education && !hasFinishedEducation()) selections.push("education");

		updatedTypes.push("basic");
	}
	if (attackHistory.fetchData && settings.apiUsage.user.attacks && settings.pages.global.keepAttackHistory) {
		selections.push("attacks");

		updatedTypes.push("attack history");
	}
	if (!selections.length) return { updated: false };

	const oldUserdata = { ...userdata };
	userdata = await fetchData("torn", { section: "user", selections });
	if (!userdata || !Object.keys(userdata).length) throw new Error("Aborted updating due to an unexpected response.");
	userdata.date = now;
	userdata.dateBasic = updateBasic ? now : oldUserdata.dateBasic;

	// Notifications have a 100K count limit from being fetched via the Torn API
	// Use "newevents" selection only when the old events count > new events count
	// Fetch only when new events arrived
	if (oldUserdata?.notifications?.events !== userdata?.notifications?.events) {
		let newEventsCount = (userdata?.notifications?.events ?? 0) - (oldUserdata?.notifications?.events ?? 0);

		// When old notifications are read and user has new notifications
		// but with lesser count than old notifications, we
		// have negative value. TT then fetches all the new notifications.
		if (newEventsCount < 0) newEventsCount = userdata?.notifications?.events ?? 0;
		else if (newEventsCount > 0) {
			const category = newEventsCount <= 25 ? "newevents" : "events";
			userdata.events = (await fetchData("torn", { section: "user", selections: [category], params: { limit: newEventsCount } })).events;
			selections.push(category);
		} else if (newEventsCount === 0) userdata.events = {}; // No new events. So reset events.
	}
	if (!userdata.events || userdata?.notifications?.events === 0) userdata.events = {};

	await processUserdata().catch((error) => console.error("Error while processing userdata.", error));
	await checkAttacks().catch((error) => console.error("Error while checking personal stats for attack changes.", error));

	await ttStorage.set({ userdata: { ...oldUserdata, ...userdata } });

	await showIconBars().catch((error) => console.error("Error while updating the icon bars.", error));
	await notifyEventMessages().catch((error) => console.error("Error while sending event and message notifications.", error));
	await notifyStatusChange().catch((error) => console.error("Error while sending status change notifications.", error));
	await notifyCooldownOver().catch((error) => console.error("Error while sending cooldown notifications.", error));
	await notifyTravelLanding().catch((error) => console.error("Error while sending travel landing notifications.", error));
	await notifyEducation().catch((error) => console.error("Error while sending education notifications.", error));
	await notifyNewDay().catch((error) => console.error("Error while sending new day notification.", error));
	await notifyBars().catch((error) => console.error("Error while sending bar notification.", error));
	await notifyChain().catch((error) => console.error("Error while sending chain notifications.", error));
	await notifyHospital().catch((error) => console.error("Error while sending hospital notifications.", error));
	await notifyTraveling().catch((error) => console.error("Error while sending traveling notifications.", error));
	await notifySpecificCooldowns().catch((error) => console.error("Error while sending specific cooldown notifications.", error));

	return { updated: true, types: updatedTypes, selections };

	async function checkAttacks() {
		if (!settings.pages.global.keepAttackHistory) return;

		if (userdata.attacks) {
			await updateAttackHistory();

			delete userdata.attacks;
		}

		if (oldUserdata.personalstats && userdata.personalstats) {
			const fetchData = ["killstreak", "defendsstalemated", "attacksdraw", "defendslost"].some(
				(stat) => oldUserdata.personalstats[stat] !== userdata.personalstats[stat]
			);

			await ttStorage.change({ attackHistory: { fetchData } });
		}

		async function updateAttackHistory() {
			let lastAttack = attackHistory.lastAttack;
			for (const attackId in userdata.attacks) {
				if (parseInt(attackId) <= attackHistory.lastAttack) continue;
				if (parseInt(attackId) > lastAttack) lastAttack = parseInt(attackId);

				const attack = userdata.attacks[attackId];

				const enemyId = attack.attacker_id === userdata.player_id ? attack.defender_id : attack.attacker_id;
				if (!enemyId) continue;

				// Setup the data so there are no missing keys.
				if (!attackHistory.history[enemyId]) attackHistory.history[enemyId] = {};
				attackHistory.history[enemyId] = {
					name: "",
					defend: 0,
					defend_lost: 0,
					lose: 0,
					stalemate: 0,
					win: 0,
					stealth: 0,
					mug: 0,
					hospitalise: 0,
					leave: 0,
					arrest: 0,
					assist: 0,
					special: 0,
					escapes: 0,
					respect: [],
					respect_base: [],
					...attackHistory.history[enemyId],
				};

				// Manipulate the data to be correct.
				attackHistory.history[enemyId].lastAttack = attack.timestamp_ended * 1000;
				attackHistory.history[enemyId].lastAttackCode = attack.code;

				if (attack.defender_id === userdata.player_id) {
					if (attack.attacker_name) attackHistory.history[enemyId].name = attack.attacker_name;

					if (attack.result === "Assist") {
						// Ignore group attacks that isn't the finishing hit
					} else if (["Lost", "Timeout", "Escape", "Stalemate"].includes(attack.result)) {
						attackHistory.history[enemyId].defend++;
					} else {
						attackHistory.history[enemyId].defend_lost++;
					}
				} else if (attack.attacker_id === userdata.player_id) {
					if (attack.defender_name) attackHistory.history[enemyId].name = attack.defender_name;

					if (attack.result === "Lost" || attack.result === "Timeout") attackHistory.history[enemyId].lose++;
					else if (attack.result === "Stalemate") attackHistory.history[enemyId].stalemate++;
					else if (attack.result === "Assist") attackHistory.history[enemyId].assist++;
					else if (attack.result === "Escape") attackHistory.history[enemyId].escapes++;
					else {
						attackHistory.history[enemyId].win++;
						if (attack.stealthed) attackHistory.history[enemyId].stealth++;

						let respect = attack.respect_gain;
						if (respect !== 0) {
							let hasAccurateModifiers = attack.modifiers;

							if (hasAccurateModifiers) {
								if (respect === attack.modifiers.chain_bonus) {
									respect = 1;
									hasAccurateModifiers = false;
								} else {
									if (attack.result === "Mugged") respect /= 0.75;

									respect =
										respect /
										attack.modifiers.war /
										attack.modifiers.retaliation /
										attack.modifiers.group_attack /
										attack.modifiers.overseas /
										attack.modifiers.chain_bonus /
										(attack.modifiers.warlord_bonus || 1);
								}
								attackHistory.history[enemyId].latestFairFightModifier = attack.modifiers.fair_fight;
							}

							attackHistory.history[enemyId][hasAccurateModifiers ? "respect_base" : "respect"].push(respect);
						}

						switch (attack.result) {
							case "Mugged":
								attackHistory.history[enemyId].mug++;
								break;
							case "Hospitalized":
								attackHistory.history[enemyId].hospitalise++;
								break;
							case "Attacked":
								attackHistory.history[enemyId].leave++;
								break;
							case "Arrested":
								attackHistory.history[enemyId].arrest++;
								break;
							case "Special":
								attackHistory.history[enemyId].special++;
								break;
						}
					}
				}
			}

			await ttStorage.change({
				attackHistory: {
					lastAttack,
					fetchData: false,
					history: { ...attackHistory.history },
				},
			});
		}
	}

	async function processUserdata() {
		if ("icons" in userdata) {
			userdata.userCrime = userdata.icons.icon85
				? userdata.timestamp * TO_MILLIS.SECONDS + textToTime(userdata.icons.icon85.split("-").last().trim())
				: userdata.icons.icon86
				? userdata.timestamp * TO_MILLIS.SECONDS
				: -1;
		}
	}

	async function notifyEventMessages() {
		let eventCount = 0;
		if (settings.apiUsage.user.newevents) {
			const events = [];
			for (const key of Object.keys(userdata.events).reverse()) {
				const event = userdata.events[key];
				if (event.seen) break;

				if (settings.notifications.types.global && settings.notifications.types.events && !notifications.events[key]) {
					events.push({ id: key, event: event.event });
					notifications.events[key] = { skip: true };
				}

				eventCount++;
			}
			if (events.length) {
				// Remove profile links from event message
				let message = events.last().event.replace(/<\/?[^>]+(>|$)/g, "");
				if (events.length > 1) message += `\n(and ${events.length - 1} more event${events.length > 2 ? "s" : ""})`;

				notifications.events.combined = newNotification(`New Event${applyPlural(events.length)}`, message, LINKS.events);
			}
		}

		let messageCount = 0;
		if (settings.apiUsage.user.newmessages) {
			const messages = [];
			for (const key of Object.keys(userdata.messages).reverse()) {
				const message = userdata.messages[key];
				if (message.seen) break;

				if (settings.notifications.types.global && settings.notifications.types.messages && !notifications.messages[key]) {
					messages.push({ id: key, title: message.title, name: message.name });
					notifications.messages[key] = { skip: true };
				}

				messageCount++;
			}
			if (messages.length) {
				let message = `${messages.last().title} - by ${messages.last().name}`;
				if (messages.length > 1) message += `\n(and ${messages.length - 1} more message${messages.length > 2 ? "s" : ""})`;

				notifications.events.combined = newNotification(`New Message${applyPlural(messages.length)}`, message, LINKS.messages);
			}
		}

		await setBadge("count", { events: userdata.notifications.events, messages: userdata.notifications.messages });
	}

	async function notifyStatusChange() {
		if (!settings.notifications.types.global || !settings.notifications.types.status || !oldUserdata.status) return;

		const previous = oldUserdata.status.state;
		const current = userdata.status.state;

		if (current === previous || current === "Traveling" || current === "Abroad") return;

		if (current === "Okay") {
			if (previous === "Hospital") {
				await notifyUser("TornTools - Status", "You are out of the hospital.", LINKS.home);
				storeNotification({
					title: "TornTools - Status",
					message: "You are out of the hospital.",
					url: LINKS.home,
					type: "status",
					key: Date.now(),
					date: Date.now(),
				});
			} else if (previous === "Jail") {
				await notifyUser("TornTools - Status", "You are out of the jail.", LINKS.home);
				storeNotification({
					title: "TornTools - Status",
					message: "You are out of the jail.",
					url: LINKS.home,
					date: Date.now(),
				});
			}
		} else {
			await notifyUser("TornTools - Status", userdata.status.description, LINKS.home);
			storeNotification({
				title: "TornTools - Status",
				message: userdata.status.description,
				url: LINKS.home,
				date: Date.now(),
			});
		}
		await ttStorage.set({ notificationHistory });
	}

	async function notifyCooldownOver() {
		if (!settings.apiUsage.user.cooldowns || !settings.notifications.types.global || !settings.notifications.types.cooldowns || !oldUserdata.cooldowns)
			return;

		for (const type in userdata.cooldowns) {
			if (userdata.cooldowns[type] || !oldUserdata.cooldowns[type]) continue;

			await notifyUser("TornTools - Cooldown", `Your ${type} cooldown has ended.`, LINKS.items);
			storeNotification({
				title: "TornTools - Cooldown",
				message: `Your ${type} cooldown has ended.`,
				url: LINKS.items,
				date: Date.now(),
			});
		}
		await ttStorage.set({ notificationHistory });
	}

	async function notifyTravelLanding() {
		if (!settings.apiUsage.user.travel || !settings.notifications.types.global || !settings.notifications.types.traveling || !oldUserdata.travel) return;
		if (userdata.travel.time_left !== 0 || oldUserdata.travel.time_left === 0) return;

		await notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}.`, LINKS.home);
		storeNotification({
			title: "TornTools - Traveling",
			message: `You have landed in ${userdata.travel.destination}.`,
			url: LINKS.home,
			date: Date.now(),
		});
		await ttStorage.set({ notificationHistory });
	}

	async function notifyEducation() {
		if (
			!settings.apiUsage.user.education ||
			!settings.notifications.types.global ||
			!settings.notifications.types.education ||
			!oldUserdata.education_timeleft
		)
			return;
		if (userdata.education_timeleft !== 0 || oldUserdata.education_timeleft === 0) return;

		await notifyUser("TornTools - Education", "You have finished your education course.", LINKS.education);
		storeNotification({
			title: "TornTools - Education",
			message: "You have finished your education course.",
			url: LINKS.education,
			date: Date.now(),
		});
		await ttStorage.set({ notificationHistory });
	}

	async function notifyNewDay() {
		if (!settings.notifications.types.global || !settings.notifications.types.newDay) return;

		const date = new Date();
		const utc = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
		if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || utc in notifications.newDay) return;

		notifications.newDay[utc] = newNotification("New Day", "It's a new day! Hopefully a sunny one.", LINKS.home);
	}

	async function notifyBars() {
		if (!settings.apiUsage.user.bars || !settings.notifications.types.global) return;

		for (const bar of ["energy", "happy", "nerve", "life"]) {
			if (!settings.notifications.types[bar].length || !oldUserdata[bar]) continue;

			const checkpoints = settings.notifications.types[bar]
				.map((checkpoint) =>
					typeof checkpoint === "string" && checkpoint.includes("%") ? (parseInt(checkpoint) / 100) * userdata[bar].maximum : parseInt(checkpoint)
				)
				.sort((a, b) => b - a);

			for (const checkpoint of checkpoints) {
				if (oldUserdata[bar].current < userdata[bar].current && userdata[bar].current >= checkpoint && !notifications[bar][checkpoint]) {
					const url = (() => {
						switch (bar) {
							case "energy":
								return LINKS.gym;
							case "happy":
								return LINKS.items_candy;
							case "nerve":
								return LINKS.crimes;
							case "life":
								return LINKS.items_medical;
							default:
								return LINKS.home;
						}
					})();

					notifications[bar][checkpoint] = newNotification(
						"Bars",
						`Your ${capitalizeText(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}.`,
						url
					);
					break;
				} else if (userdata[bar].current < checkpoint && notifications[bar][checkpoint]) {
					delete notifications[bar][checkpoint];
				}
			}
		}
	}

	async function notifyChain() {
		if (!settings.apiUsage.user.bars || !settings.notifications.types.global) return;

		if (
			settings.notifications.types.chainTimerEnabled &&
			settings.notifications.types.chainTimer.length > 0 &&
			userdata.chain.timeout !== 0 &&
			userdata.chain.current >= 10
		) {
			const timeout = userdata.chain.timeout * 1000 - (now - userdata.timestamp * 1000); // ms
			const count = userdata.chain.current;

			for (const checkpoint of settings.notifications.types.chainTimer.sort((a, b) => a - b)) {
				const key = `${count}_${checkpoint}`;
				if (timeout > parseInt(checkpoint) * TO_MILLIS.SECONDS || notifications.chain[key]) continue;

				notifications.chain[key] = newNotification(
					"Chain",
					`Chain timer will run out in ${formatTime({ milliseconds: timeout }, { type: "wordTimer" })}.`,
					LINKS.chain
				);
				break;
			}
		} else {
			notifications.chain = {};
		}

		if (
			settings.notifications.types.chainBonusEnabled &&
			settings.notifications.types.chainBonus.length > 0 &&
			userdata.chain.timeout !== 0 &&
			userdata.chain.current >= 10
		) {
			const count = userdata.chain.current;
			const nextBonus = getNextChainBonus(count);

			for (const checkpoint of settings.notifications.types.chainBonus.sort((a, b) => b - a)) {
				const key = `${nextBonus}_${checkpoint}`;

				if (nextBonus - count > parseInt(checkpoint) || notifications.chainCount[key]) continue;

				notifications.chainCount[key] = newNotification(
					"Chain",
					`Chain will reach the next bonus hit in ${nextBonus - count} hit${applyPlural(nextBonus - count)}.`,
					LINKS.chain
				);
				break;
			}
		} else {
			notifications.chainCount = {};
		}
	}

	async function notifyHospital() {
		if (!settings.notifications.types.global) return;

		if (
			settings.notifications.types.leavingHospitalEnabled &&
			settings.notifications.types.leavingHospital.length &&
			userdata.status.state === "Hospital"
		) {
			for (const checkpoint of settings.notifications.types.leavingHospital.sort((a, b) => a - b)) {
				const timeLeft = userdata.status.until * 1000 - now;

				if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications.hospital[checkpoint]) continue;

				notifications.hospital[checkpoint] = newNotification(
					"Hospital",
					`You will be out of the hospital in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
					LINKS.hospital
				);
				break;
			}
		} else {
			notifications.hospital = {};
		}
	}

	async function notifyTraveling() {
		if (!settings.apiUsage.user.travel || !settings.notifications.types.global) return;

		if (settings.notifications.types.landingEnabled && settings.notifications.types.landing.length && userdata.travel.time_left) {
			for (const checkpoint of settings.notifications.types.landing.sort((a, b) => a - b)) {
				const timeLeft = userdata.travel.timestamp * 1000 - now;

				if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications.travel[checkpoint]) continue;

				notifications.travel[checkpoint] = newNotification(
					"Travel",
					`You will be landing in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
					LINKS.home
				);
				break;
			}
		} else {
			notifications.travel = {};
		}
	}

	async function notifySpecificCooldowns() {
		if (!settings.apiUsage.user.cooldowns || !settings.notifications.types.global) return;

		const COOLDOWNS = [
			{ name: "drug", title: "Drugs", setting: "cooldownDrug", memory: "drugs", enabled: "cooldownDrugEnabled" },
			{
				name: "booster",
				title: "Boosters",
				setting: "cooldownBooster",
				memory: "boosters",
				enabled: "cooldownBoosterEnabled",
			},
			{
				name: "medical",
				title: "Medical",
				setting: "cooldownMedical",
				memory: "medical",
				enabled: "cooldownMedicalEnabled",
			},
		];

		for (const cooldown of COOLDOWNS) {
			if (
				settings.notifications.types[cooldown.enabled] &&
				settings.notifications.types[cooldown.setting].length &&
				userdata.cooldowns[cooldown.name] > 0
			) {
				for (const checkpoint of settings.notifications.types[cooldown.setting].sort((a, b) => a - b)) {
					const timeLeft = userdata.cooldowns[cooldown.name] * 1000;

					if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications[cooldown.memory][checkpoint]) continue;

					notifications[cooldown.memory][checkpoint] = newNotification(
						cooldown.title,
						`Your ${cooldown.name} cooldown will end in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
						LINKS.items
					);
				}
			} else {
				notifications[cooldown.memory] = {};
			}
		}
	}
}

async function showIconBars() {
	if (!settings.apiUsage.user.bars || !hasAPIData() || !settings || !settings.pages.icon.global) {
		chrome.browserAction.setIcon({ path: "resources/images/icon_128.png" });
	} else {
		let barCount = 0;
		if (settings.pages.icon.energy) barCount++;
		if (settings.pages.icon.nerve) barCount++;
		if (settings.pages.icon.happy) barCount++;
		if (settings.pages.icon.life) barCount++;
		if (settings.pages.icon.chain && userdata.chain && userdata.chain.current > 0) barCount++;
		if (settings.pages.icon.travel && userdata.travel && userdata.travel.time_left > 0) barCount++;

		const canvas = document.newElement({ type: "canvas", attributes: { width: 128, height: 128 } });

		const canvasContext = canvas.getContext("2d");
		canvasContext.fillStyle = "#fff";
		canvasContext.fillRect(0, 0, canvas.width, canvas.height);

		const padding = 10;
		const barHeight = (canvas.height - (barCount + 1) * 10) / barCount;
		const barWidth = canvas.width - padding * 2;

		const BAR_COLORS = {
			energy: "#7cc833",
			nerve: "#b3382c",
			happy: "#e3e338",
			life: "#7b98ee",
			chain: "#333",
			travel: "#d961ee",
		};

		let y = padding;

		Object.keys(BAR_COLORS).forEach((key) => {
			if (!settings.pages.icon[key] || !userdata[key]) return;
			if (key === "chain" && userdata.chain.current === 0) return;

			let current, maximum;
			if (key === "travel") {
				const totalTrip = userdata[key].timestamp - userdata[key].departed;

				current = totalTrip - userdata[key].time_left;
				maximum = totalTrip;
			} else if (key === "chain") {
				current = userdata[key].current;
				maximum = userdata[key].maximum;

				if (current !== maximum) maximum = getNextChainBonus(current);
			} else {
				current = userdata[key].current;
				maximum = userdata[key].maximum;
			}

			let width = barWidth * (current / maximum);
			width = Math.min(width, barWidth);

			canvasContext.fillStyle = BAR_COLORS[key];
			canvasContext.fillRect(padding, y, width, barHeight);

			y += barHeight + padding;
		});

		chrome.browserAction.setIcon({ imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height) });
	}
}

async function updateStakeouts() {
	const now = Date.now();

	if (stakeouts.date && !hasTimePassed(stakeouts.date - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) return { updated: false };

	let success = 0;
	let failed = 0;
	for (const id in stakeouts) {
		if (isNaN(parseInt(id))) continue;

		const oldData = stakeouts[id]?.info ?? false;
		let data;
		try {
			data = await fetchData("torn", { section: "user", selections: ["profile"], id, silent: true });
			if (!data) {
				console.log("Unexpected result during stakeout updating.");
				failed++;
				continue;
			}

			success++;
		} catch (e) {
			console.log("STAKEOUT error", e);
			failed++;
			continue;
		}

		if (stakeouts[id].alerts) {
			const { okay, hospital, landing, online, life, offline, revivable } = stakeouts[id].alerts;

			if (okay) {
				const key = `${id}_okay`;
				if (data.status.state === "Okay" && (!oldData || oldData.status.state !== data.status.state) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification("Stakeouts", `${data.name} is now okay.`, `https://www.torn.com/profiles.php?XID=${id}`);
				} else if (data.status.state !== "Okay") {
					delete notifications.stakeouts[key];
				}
			}
			if (hospital) {
				const key = `${id}_hospital`;
				if (data.status.state === "Hospital" && (!oldData || oldData.status.state !== data.status.state) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name} is now in the hospital.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.status.state !== "Hospital") {
					delete notifications.stakeouts[key];
				}
			}
			if (landing) {
				const key = `${id}_landing`;
				if (data.status.state !== "Traveling" && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name} is now ${data.status.state === "Abroad" ? data.status.description : "in Torn"}.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.last_action.status === "Traveling") {
					delete notifications.stakeouts[key];
				}
			}
			if (online) {
				const key = `${id}_online`;
				if (
					data.last_action.status === "Online" &&
					(!oldData || oldData.last_action.status !== data.last_action.status) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name} is now online.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.last_action.status !== "Online") {
					delete notifications.stakeouts[key];
				}
			}
			if (life) {
				const key = `${id}_life`;
				if (data.life.current <= data.life.maximum * (life / 100) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name}'${data.name.endsWith("s") ? "" : "s"} life has dropped below ${life}%.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.life.current > data.life.maximum * (life / 100)) {
					delete notifications.stakeouts[key];
				}
			}
			if (offline) {
				const oldOfflineHours = oldData ? ((now - oldData.last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals() : false;
				const offlineHours = ((now - data.last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals();

				const key = `${id}_offline`;
				if (offlineHours >= offline && (!oldOfflineHours || oldOfflineHours < offlineHours) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name} has been offline for ${offlineHours} hours.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (offlineHours < offline) {
					delete notifications.stakeouts[key];
				}
			}
			if (revivable) {
				const oldIsRevivable = oldData?.isRevivable ?? false;
				const isRevivable = data.revivable === 1;

				const key = `${id}_revivable`;
				if (!oldIsRevivable && isRevivable && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.name} is now revivable.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (!oldIsRevivable) {
					delete notifications.stakeouts[key];
				}
			}
		}

		stakeouts[id].info = {
			name: data.name,
			last_action: {
				status: data.last_action.status,
				relative: data.last_action.relative,
				timestamp: data.last_action.timestamp * 1000,
			},
			life: {
				current: data.life.current,
				maximum: data.life.maximum,
			},
			status: {
				state: data.status.state,
				color: data.status.color,
				until: data.status.until * 1000,
				description: data.status.description,
			},
			isRevivable: data.revivable === 1,
		};
	}
	stakeouts.date = now;

	await ttStorage.change({ stakeouts });
	return { updated: true, success, failed };
}

async function updateFactionStakeouts() {
	const now = Date.now();

	if (factionStakeouts.date && !hasTimePassed(factionStakeouts.date - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) return { updated: false };

	let success = 0;
	let failed = 0;
	for (const factionId in factionStakeouts) {
		if (isNaN(parseInt(factionId))) continue;

		const oldData = factionStakeouts[factionId]?.info ?? false;
		let data;
		try {
			data = await fetchData("torn", { section: "faction", selections: ["basic", "chain"], id: factionId, silent: true });
			if (!data) {
				console.log("Unexpected result during faction stakeout updating.");
				failed++;
				continue;
			}

			success++;
		} catch (e) {
			console.log("FACTION STAKEOUT error", e);
			failed++;
			continue;
		}

		if (factionStakeouts[factionId].alerts) {
			const { chainReaches, memberCountDrops, rankedWarStarts, inRaid, inTerritoryWar } = factionStakeouts[factionId].alerts;

			if (chainReaches !== false) {
				const oldChainCount = oldData ? oldData.chain : false;
				const chainCount = data.chain.current;

				if (chainReaches === 0) {
					const key = `faction_${factionId}_chainDrops`;
					if (chainCount < oldChainCount && oldChainCount >= 10 && !notifications.stakeouts[key]) {
						if (settings.notifications.types.global)
							notifications.stakeouts[key] = newNotification(
								"Faction Stakeouts",
								`${data.name} has dropped their ${oldChainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
							);
					} else if (chainCount > 10) {
						delete notifications.stakeouts[key];
					}
				} else {
					const key = `faction_${factionId}_chainReaches`;
					if (chainCount >= chainReaches && (!oldChainCount || oldChainCount < chainCount) && !notifications.stakeouts[key]) {
						if (settings.notifications.types.global)
							notifications.stakeouts[key] = newNotification(
								"Faction Stakeouts",
								`${data.name} has reached a ${chainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
							);
					} else if (chainCount < oldChainCount) {
						delete notifications.stakeouts[key];
					}
				}
			}
			if (memberCountDrops) {
				const oldMemberCount = oldData ? oldData.members.current : false;
				const memberCount = Object.keys(data.members).length;

				const key = `faction_${factionId}_memberCountDrops`;
				if (memberCount >= oldMemberCount && (!oldMemberCount || oldMemberCount > memberCount) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Faction Stakeouts",
							`${data.name} now has less than ${memberCount} members.`,
							`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
						);
				} else if (data.status.state !== "Okay") {
					delete notifications.stakeouts[key];
				}
			}

			const handleWarStakeout = (type, wasValue, isValue, createMessage) => {
				const key = `faction_${factionId}_${type}`;
				if (isValue && (!oldData || !wasValue) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Faction Stakeouts",
							createMessage(),
							`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
						);
				} else if (!isValue) {
					delete notifications.stakeouts[key];
				}
			};
			if (rankedWarStarts) {
				handleWarStakeout("rankedWarStarts", oldData.rankedWar, Object.keys(data.ranked_wars).length > 0, () => `${data.name} is now in a ranked war.`);
			}
			if (inRaid) {
				handleWarStakeout("inRaid", oldData.raid, Array.isArray(data.raid_wars), () => `${data.name} is now in a raid.`);
			}
			if (inTerritoryWar) {
				handleWarStakeout("inTerritoryWar", oldData.territoryWar, Array.isArray(data.territory_wars), () => `${data.name} is now in a territory war.`);
			}
		}

		factionStakeouts[factionId].info = {
			name: data.name,
			chain: data.chain.current,
			members: {
				current: Object.keys(data.members).length,
				maximum: data.capacity,
			},
			rankedWar: Object.keys(data.ranked_wars).length > 0,
			raid: Array.isArray(data.raid_wars),
			territoryWar: Array.isArray(data.territory_wars),
		};
	}
	factionStakeouts.date = now;

	await ttStorage.change({ factionStakeouts });
	return { updated: true, success, failed };
}

async function updateTorndata() {
	const data = await fetchData("torn", {
		section: "torn",
		selections: ["education", "honors", "items", "medals", "pawnshop", "properties", "stats"],
	});
	if (!isValidTorndata(data)) throw new Error("Aborted updating due to an unexpected response.");
	data.date = Date.now();

	torndata = data;
	await ttStorage.set({ torndata: data });

	function isValidTorndata(data) {
		return !!data && !data.error;
	}
}

async function updateStocks() {
	const oldStocks = { ...stockdata };
	const stocks = (await fetchData("torn", { section: "torn", selections: ["stocks"] })).stocks;
	if (!stocks || !Object.keys(stocks).length) throw new Error("Aborted updating due to an unexpected response.");
	stocks.date = Date.now();

	await ttStorage.change({ stockdata: stocks });

	if (oldStocks && settings.notifications.types.global) {
		for (const id in settings.notifications.types.stocks) {
			const alerts = settings.notifications.types.stocks[id];

			if (alerts.priceFalls && oldStocks[id].current_price > alerts.priceFalls && stocks[id].current_price <= alerts.priceFalls) {
				const message = `(${stocks[id].acronym}) ${stocks[id].name} has fallen to ${formatNumber(stocks[id].current_price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceFalls, { currency: true })})!`;

				await notifyUser("TornTools - Stock Alerts", message, LINKS.stocks);
				storeNotification({ title: "TornTools -  Stock Alerts", message, url: LINKS.stocks, date: Date.now() });
			} else if (alerts.priceReaches && oldStocks[id].current_price < alerts.priceReaches && stocks[id].current_price >= alerts.priceReaches) {
				const message = `(${stocks[id].acronym}) ${stocks[id].name} has reached ${formatNumber(stocks[id].current_price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceReaches, { currency: true })})!`;

				await notifyUser("TornTools - Stock Alerts", message, LINKS.stocks);
				storeNotification({ title: "TornTools -  Stock Alerts", message, url: LINKS.stocks, date: Date.now() });
			}
		}
		await ttStorage.set({ notificationHistory });
	}
}

async function updateFactiondata() {
	if (!userdata?.faction?.faction_id) {
		factiondata = { access: FACTION_ACCESS.none };
	} else {
		const hasFactiondata = !factiondata || typeof factiondata !== "object" || factiondata.access !== FACTION_ACCESS.none;

		if (!hasFactiondata || hasFactionAPIAccess()) {
			factiondata = await updateAccess();
		} else {
			const retry = !factiondata.retry || hasTimePassed(factiondata.date, TO_MILLIS.HOURS * 6);

			if (retry) factiondata = await updateAccess();
			else factiondata = await updateBasic();
		}
	}

	await ttStorage.set({ factiondata });

	async function updateAccess() {
		try {
			const data = await fetchData("torn", { section: "faction", selections: ["crimes", "basic"], silent: true });
			data.access = FACTION_ACCESS.full_access;
			data.date = Date.now();

			data.userCrime = calculateOC(data.crimes);
			return data;
		} catch (error) {
			if (error?.code === 7) {
				const data = await updateBasic();
				data.retry = Date.now();

				return data;
			}

			return { error, access: FACTION_ACCESS.none };
		}

		function calculateOC(crimes) {
			let oc = -1;

			for (const id of Object.keys(crimes).reverse()) {
				const crime = crimes[id];

				if (crime.initiated || !crime.participants.map((value) => parseInt(Object.keys(value)[0])).includes(userdata.player_id)) continue;

				oc = crime.time_ready * 1000;
			}

			return oc;
		}
	}

	async function updateBasic() {
		try {
			const data = await fetchData("torn", { section: "faction", selections: ["basic"], silent: true });
			data.access = FACTION_ACCESS.basic;
			data.date = Date.now();

			return data;
		} catch (error) {
			return { error, access: FACTION_ACCESS.none };
		}
	}
}

async function updateNPCs() {
	const { yata: useYata, tornstats: useTornstats, lzpt: useLzpt } = settings.external;
	if (!useYata && !useTornstats && !useLzpt) {
		await ttStorage.set({ npcs: {} });
		return { updated: false };
	}

	const NPCS = {
		4: "DUKE",
		7: "Amanda",
		9: "Anonymous",
		10: "Scrooge",
		15: "Leslie",
		17: "Easter Bunny",
		19: "Jimmy",
		20: "Fernando",
		21: "Tiny",
	};

	const now = Date.now();
	let updated;

	if (npcs && npcs.next_update && npcs.next_update > now) {
		updated = await updateLevels();
	} else {
		const services = [
			{ service: "loot-rangers", method: fetchLootRangers, check: useLzpt },
			{ service: "yata", method: fetchYata, check: useYata },
			{ service: "tornstats", method: fetchTornStats, check: useTornstats && hasAPIData() },
		].filter((s) => s.check);
		const service = services.find((s) => s.service === settings.pages.sidebar.npcLootTimesService) || services[0];

		updated = await service.method();
	}

	if (updated || !npcUpdater) triggerUpdate();

	const alerts = checkNPCAlerts();

	return { updated, alerts };

	async function fetchYata() {
		const data = await fetchData("yata", { section: "loot" });

		if (npcs && npcs.timestamp === data.timestamp) return await updateLevels();

		npcs = {
			next_update: data.next_update * 1000,
			service: "YATA",
			targets: {},
		};

		for (let [id, hospital] of Object.entries(data.hosp_out)) {
			hospital = hospital * 1000;

			npcs.targets[id] = {
				levels: {
					1: hospital,
					2: hospital + TO_MILLIS.MINUTES * 30,
					3: hospital + TO_MILLIS.MINUTES * 90,
					4: hospital + TO_MILLIS.MINUTES * 210,
					5: hospital + TO_MILLIS.MINUTES * 450,
				},
				name: NPCS[id] ?? "Unknown",
				order: id,
			};

			npcs.targets[id].current = getCurrentLevel(npcs.targets[id]);
		}

		await ttStorage.set({ npcs });
		return true;
	}

	async function fetchTornStats() {
		const data = await fetchData(FETCH_PLATFORMS.tornstats, { section: "loot" });

		if (data && !data.status) return await updateLevels();

		npcs = {
			next_update: now + TO_MILLIS.MINUTES * 15,
			service: "TornStats",
			targets: {},
		};

		for (const npc of Object.values(data)
			.filter((x) => typeof x === "object")
			.filter((npc) => npc.torn_id)) {
			npcs.targets[npc.torn_id] = {
				levels: {
					1: npc.hosp_out * 1000,
					2: npc.loot_2 * 1000,
					3: npc.loot_3 * 1000,
					4: npc.loot_4 * 1000,
					5: npc.loot_5 * 1000,
				},
				name: npc.name,
				order: npc.torn_id,
			};

			npcs.targets[npc.torn_id].current = getCurrentLevel(npcs.targets[npc.torn_id]);
		}

		await ttStorage.set({ npcs });
		return true;
	}

	async function fetchLootRangers() {
		const data = await fetchData("lzpt", { section: "loot" });
		const planned = data.time.clear;

		npcs = {
			next_update: now + TO_MILLIS.MINUTES * (planned === 0 ? 1 : 15),
			service: "Loot Rangers",
			targets: {},
		};

		for (let [id, npc] of Object.entries(data.npcs)) {
			id = parseInt(id);
			const hospital = npc.hosp_out * 1000;

			npcs.targets[id] = {
				levels: {
					1: hospital,
					2: hospital + TO_MILLIS.MINUTES * 30,
					3: hospital + TO_MILLIS.MINUTES * 90,
					4: hospital + TO_MILLIS.MINUTES * 210,
					5: hospital + TO_MILLIS.MINUTES * 450,
				},
				name: npc.name || (NPCS[id] ?? "Unknown"),
				order: data.order.findIndex((o) => o === id),
			};

			npcs.targets[id].current = getCurrentLevel(npcs.targets[id]);
		}

		npcs.planned = planned === 0 ? false : planned * 1000;

		await ttStorage.set({ npcs });
		return true;
	}

	async function updateLevels() {
		const targets = {};

		for (const [id, npc] of Object.entries(npcs.targets)) {
			const current = getCurrentLevel(npc);

			if (npc.current !== current) targets[id] = { current };
		}

		if (Object.keys(targets).length) {
			await ttStorage.change({ npcs: { targets } });
			return true;
		}
		return false;
	}

	function getCurrentLevel(npc) {
		return (
			Object.entries(npc.levels)
				.filter(([, time]) => time <= now)
				.map(([level, time]) => ({ level: parseInt(level), time }))
				?.last()?.level ?? 0
		);
	}

	function checkNPCAlerts() {
		if (!settings.notifications.types.global || !settings.notifications.types.npcsGlobal) return 0;

		let alerts = 0;

		for (const { id, level, minutes } of settings.notifications.types.npcs.filter(({ level, minutes }) => level !== "" && minutes !== "")) {
			const npc = npcs.targets[id];
			if (!npc) {
				delete notifications.npcs[id];
				continue;
			}

			const time = npc.levels[level];
			if (!time) {
				delete notifications.npcs[id];
				continue;
			}

			const left = time - now;
			const _minutes = Math.ceil(left / TO_MILLIS.MINUTES);
			if (_minutes > minutes || _minutes < 0) {
				delete notifications.npcs[id];
				continue;
			}

			if (notifications.npcs[id]) continue;

			notifications.npcs[id] = newNotification(
				"NPC Loot",
				`${npc.name} is reaching loot level ${formatNumber(level, { roman: true })} in ${formatTime(left, { type: "wordTimer" })}.`,
				`https://www.torn.com/profiles.php?XID=${id}`
			);
			alerts++;
		}
		if (settings.notifications.types.npcPlannedEnabled && npcs.planned) {
			for (const minutes of settings.notifications.types.npcPlanned.sort()) {
				const key = `npc_planned_${minutes}`;

				const time = npcs.planned;
				if (!time) {
					delete notifications.npcs[key];
					continue;
				}

				const left = time - now;
				const _minutes = Math.ceil(left / TO_MILLIS.MINUTES);
				if (_minutes > minutes || _minutes < 0) {
					delete notifications.npcs[key];
					continue;
				}

				if (notifications.npcs[key]) continue;

				notifications.npcs[key] = newNotification("NPC Loot", `There is a planned attack in ${formatTime(left, { type: "wordTimer" })}.`);
				alerts++;
			}
		}

		return alerts;
	}

	function triggerUpdate() {
		const shortest = Object.values(npcs.targets)
			.flatMap((npc) => Object.values(npc.levels))
			.filter((time) => time > now)
			.sort()[0];
		if (!shortest) return false;

		if (npcUpdater) clearTimeout(npcUpdater);
		npcUpdater = setTimeout(() => {
			updateLevels();

			npcUpdater = undefined;
		}, shortest - Date.now());
	}
}

function newNotification(title, message, link) {
	return {
		title: `TornTools - ${title}`,
		message,
		url: link,
		date: Date.now(),
	};
}

async function notifyUser(title, message, url) {
	await setupSoundPlayer();

	const icon = "resources/images/icon_128.png";
	const requireInteraction = hasInteractionSupport() && settings.notifications.requireInteraction;
	const silent = hasSilentSupport() && notificationSound !== "default";

	if (settings.notifications.tts) {
		readMessage(title);
		readMessage(message);
	}

	try {
		await notifyNative();
	} catch (errorNative) {
		try {
			await notifyService();
		} catch (errorService) {
			console.error("Failed to send notification.", { native: errorNative, service: errorService });
		}
	}

	async function setupSoundPlayer() {
		if (notificationSound !== settings.notifications.sound) {
			const sound = await getNotificationSound(settings.notifications.sound);

			if (sound && sound !== "mute") {
				notificationPlayer.src = sound;
			}

			notificationSound = settings.notifications.sound;
		}
		notificationPlayer.volume = settings.notifications.volume / 100;
	}

	async function notifyNative() {
		const id = await new Promise((resolve) => {
			const options = { type: "basic", iconUrl: icon, title, message };
			if (silent) options.silent = true;
			if (requireInteraction) options.requireInteraction = true;

			chrome.notifications.create(options, (id) => resolve(id));
		});

		if (notificationSound !== "default" && notificationSound !== "mute") notificationPlayer.play().then(() => {});

		if (settings.notifications.link) notificationRelations[id] = url;
	}

	async function notifyService() {
		const options = {
			icon,
			body: message,
			requireInteraction,
			data: { settings: {} },
		};
		if (silent) options.silent;

		if (settings.notifications.link) {
			options.data.link = url;
		}

		if (!notificationWorker) {
			// Setup the service worker.
			await new Promise((resolve, reject) => {
				navigator.serviceWorker
					.register("scripts/service-worker.js")
					.then((registration) => {
						notificationWorker = registration;
						registration.update().then(() => resolve());
					})
					.catch((error) => reject(error));
			});
		}

		// Send the actual notification.
		await new Promise((resolve, reject) => {
			notificationWorker
				.showNotification(title, options)
				.then(() => {
					if (notificationSound !== "default" && notificationSound !== "mute") notificationPlayer.play();

					resolve();
				})
				.catch((error) => reject(error));
		});
	}

	function readMessage(text) {
		const ttsMessage = new SpeechSynthesisUtterance(text);
		ttsMessage.volume = settings.notifications.volume / 100;
		window.speechSynthesis.speak(ttsMessage);
	}
}

chrome.runtime.onConnect.addListener(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.action) {
		case "initialize":
			timedUpdates();

			sendResponse({ success: true });
			break;
		case "play-notification-sound":
			getNotificationSound(message.sound).then((sound) => {
				if (!sound) return;

				notificationTestPlayer.volume = message.volume / 100;
				notificationTestPlayer.src = sound;
				// noinspection JSIgnoredPromiseFromCall
				notificationTestPlayer.play();
			});
			sendResponse({ success: true });
			break;
		case "stop-notification-sound":
			notificationTestPlayer.pause();
			break;
		case "notification":
			notifyUser(message.title, message.message, message.url)
				.then(() => sendResponse({ success: true }))
				.catch((error) => sendResponse({ success: false, error }));
			return true;
		case "fetchRelay":
			fetchData(message.location, message.options)
				.then((result) => sendResponse(result))
				.catch((error) => sendResponse(error));
			return true;
		case "forceUpdate":
			let updateFunction;

			if (message.update === "torndata") updateFunction = updateTorndata;
			else if (message.update === "stocks") updateFunction = updateStocks;
			else if (message.update === "factiondata") updateFunction = updateFactiondata;
			else break;

			updateFunction()
				.then((result) => sendResponse(result))
				.catch((error) => sendResponse(error));
			return true;
		default:
			sendResponse({ success: false, message: "Unknown action." });
			break;
	}
});

chrome.notifications.onClicked.addListener((id) => {
	if (id in notificationRelations) {
		chrome.tabs.create({ url: notificationRelations[id] });
	}
});

function getNotificationSound(type) {
	return new Promise((resolve) => {
		switch (type) {
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
				return resolve(`resources/audio/notification${type}.wav`);
			case "custom":
				return resolve(settings.notifications.soundCustom);
			default:
				return resolve(false);
		}
	});
}

function getAudioPlayer() {
	const audioPlayer = new Audio();
	audioPlayer.autoplay = false;
	audioPlayer.preload = true;

	return audioPlayer;
}

function storeNotification(notification) {
	notificationHistory.insertAt(0, notification);
	notificationHistory = notificationHistory.slice(0, 100);
}
