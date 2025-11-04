"use strict";

if (typeof importScripts !== "undefined")
	importScripts(
		...[
			"global/globalClasses.js",
			"global/globalData.js",
			"global/functions/browser.js",
			"global/functions/database.js",
			"global/functions/extension.js",
			"global/functions/formatting.js",
			"global/functions/utilities.js",
			"global/functions/api.js",
			"global/functions/api-external.js",
			"global/functions/torn.js",
		]
	);

const ALARM_NAMES = {
	CLEAR_CACHE: "clear-cache-alarm",
	CLEAR_USAGE: "clear-usage-alarm",
	DATA_UPDATE_AND_NOTIFICATIONS: "data-update-and-notifications-alarm",
	NOTIFICATIONS: "notifications-alarm",
};

class AudioPlayer {
	set src(src) {
		this._src = src;
	}

	set volume(volume) {
		this._volume = volume;
	}

	async play() {
		if (typeof Audio !== "undefined") {
			const audio = new Audio(this._src);
			audio.volume = this._volume;
			void audio.play();

			return;
		}

		await setupAudioPlayerDocument();

		if (!this._src) throw Error("No sound src set.");

		await chrome.runtime.sendMessage({
			offscreen: "notification",
			src: this._src,
			volume: this._volume,
		});
	}
}

const notificationPlayer = new AudioPlayer();
const notificationTestPlayer = new AudioPlayer();

let notificationSound, notificationWorker;
const notificationRelations = {};

let npcUpdater;

// On browser update, extension update or extension (re)install
chrome.runtime.onInstalled.addListener(async () => {
	await migrateDatabase(true);
	void checkUpdate();

	chrome.alarms.clearAll().then(() => {
		void chrome.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
		void chrome.alarms.create(ALARM_NAMES.CLEAR_USAGE, { periodInMinutes: 60 * 24 });
		void chrome.alarms.create(ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS, { periodInMinutes: 0.52 });
		void chrome.alarms.create(ALARM_NAMES.NOTIFICATIONS, { periodInMinutes: 0.08 });
	});

	// These are refresh tasks, not clearing.
	clearUsage();
	clearCache();

	// Initial call
	timedUpdates();

	void showIconBars();
	storageListeners.settings.push(showIconBars);
});

// When SW (re)starts
chrome.runtime.onStartup.addListener(async () => {
	await migrateDatabase(false);
	void checkUpdate();

	// These are refresh tasks, not clearing.
	clearUsage();
	clearCache();

	// Initial call
	timedUpdates();

	void showIconBars();
	storageListeners.settings.push(showIconBars);
});

// Register updaters, if not registered.
(async () => {
	chrome.alarms.getAll().then((currentAlarms) => {
		if (currentAlarms.length === 4) return;

		chrome.alarms.clearAll().then(() => {
			void chrome.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
			void chrome.alarms.create(ALARM_NAMES.CLEAR_USAGE, { periodInMinutes: 60 * 24 });
			void chrome.alarms.create(ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS, { periodInMinutes: 0.52 });
			void chrome.alarms.create(ALARM_NAMES.NOTIFICATIONS, { periodInMinutes: 0.08 });
		});
	});
})();

// On alarm triggered
chrome.alarms.onAlarm.addListener(async (alarm) => {
	await loadDatabase();

	switch (alarm.name) {
		case ALARM_NAMES.CLEAR_CACHE:
			clearCache();
			break;
		case ALARM_NAMES.CLEAR_USAGE:
			clearUsage();
			break;
		case ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS:
			await Promise.allSettled(timedUpdates());
			await sendNotifications();
			break;
		case ALARM_NAMES.NOTIFICATIONS:
			await sendNotifications();
			break;
		default:
			throw new Error("Undefined alarm name: " + alarm.name);
	}
});

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
	await ttStorage.set({ notifications, notificationHistory });
}

function timedUpdates() {
	const updatePromises = [];
	if (api.torn.key) {
		updatePromises.push(
			updateUserdata()
				.then(({ updated, types, selections }) => {
					if (updated) console.log(`Updated ${types.join("+")} userdata.`, selections);
					else console.log("Skipped this userdata update.");
				})
				.catch((error) => logError("updating userdata", error))
		);

		updatePromises.push(
			updateStakeouts()
				.then(({ updated, success, failed }) => {
					if (updated) {
						if (success || failed) console.log("Updated stakeouts.", { success, failed });
						else console.log("No stakeouts to update.");
					} else console.log("Skipped this stakeout update.");
				})
				.catch((error) => logError("updating stakeouts", error))
		);

		updatePromises.push(
			updateFactionStakeouts()
				.then(({ updated, success, failed }) => {
					if (updated) {
						if (success || failed) console.log("Updated faction stakeouts.", { success, failed });
						else console.log("No faction stakeouts to update.");
					} else console.log("Skipped this faction stakeout update.");
				})
				.catch((error) => logError("updating faction stakeouts", error))
		);

		if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
			// Update once every torn day.
			updatePromises.push(
				updateTorndata()
					.then(() => console.log("Updated torndata."))
					.catch((error) => logError("updating torndata", error))
			);
		}

		if (!stockdata || !stockdata.date || hasTimePassed(stockdata.date, TO_MILLIS.MINUTES * 5)) {
			updatePromises.push(
				updateStocks()
					.then(() => console.log("Updated stocks."))
					.catch((error) => logError("updating stocks", error))
			);
		}

		if (!factiondata || !factiondata.date || hasTimePassed(factiondata.date, TO_MILLIS.MINUTES * 15))
			updatePromises.push(
				updateFactiondata()
					.then(() => console.log("Updated factiondata."))
					.catch((error) => logError("updating factiondata", error))
			);
	}

	updatePromises.push(
		updateNPCs()
			.then(({ updated, alerts }) => {
				if (updated) console.log("Updated npcs.");
				if (alerts) console.log(`Sent out ${alerts} npc alerts.`);
			})
			.catch((error) => logError("updating npcs", error))
	);

	updatePromises.push(verifyTime().catch((error) => logError("Failed to verify your time to be synced.", error)));

	return updatePromises;

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

async function updateUserdata(forceUpdate = false) {
	const now = Date.now();

	const updatedTypes = [];
	const updateEssential =
		forceUpdate ||
		!userdata ||
		!Object.keys(userdata).length ||
		hasTimePassed((userdata.date ?? 0) - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayEssential);
	const updateBasic =
		updateEssential &&
		(forceUpdate ||
			!userdata?.dateBasic ||
			(hasTimePassed(userdata?.dateBasic - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayBasic) &&
				!hasTimePassed(userdata?.profile?.last_action?.timestamp * 1000, TO_MILLIS.MINUTES * 5)));

	const selections = [];
	const selectionsV2 = [];
	if (updateEssential) {
		// TODO - Move some of those behind a setting.
		selectionsV2.push("profile", "faction", "job", "timestamp");
		// Notifications have a 100K count limit from being fetched via the Torn API
		// Use "newevents" selection only when the old events count > new events count
		// Fetch the notifications count always, to avoid additional API calls
		selections.push("notifications");

		// TODO - Migrate to V2 (user/bars).
		// TODO - Migrate to V2 (user/cooldowns).
		// TODO - Migrate to V2 (user/travel).
		// TODO - Migrate to V2 (user/newmessages).
		// TODO - Migrate to V2 (user/refills).
		// FIXME - Migrate to V2 (user/icons).
		for (const selection of ["bars", "cooldowns", "travel", "newmessages", "refills", "icons"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}
		for (const selection of ["money"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		updatedTypes.push("essential");
	}
	if (updateBasic) {
		// TODO - Migrate to V2 (user/stocks).
		// FIXME - Migrate to V2 (user/merits).
		// TODO - Migrate to V2 (user/perks).
		// TODO - Migrate to V2 (user/networth).
		// TODO - Migrate to V2 (user/ammo).
		// FIXME - Migrate to V2 (user/battlestats).
		// FIXME - Migrate to V2 (user/crimes).
		// TODO - Migrate to V2 (user/workstats).
		// FIXME - Migrate to V2 (user/skills).
		// TODO - Migrate to V2 (user/weaponexp).
		// FIXME - Migrate to V2 (user/properties).
		for (const selection of [
			"stocks",
			// "inventory",
			"merits",
			"perks",
			"networth",
			"ammo",
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
		for (const selection of ["calendar", "organizedcrime", "personalstats", "honors", "medals", "missions"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		// FIXME - Migrate to V2 (user/education).
		if (settings.apiUsage.user.education && !hasFinishedEducation()) selections.push("education");

		updatedTypes.push("basic");
	}
	if (attackHistory.fetchData && settings.apiUsage.user.attacks && settings.pages.global.keepAttackHistory) {
		selectionsV2.push("attacks");

		updatedTypes.push("attack history");
	}
	console.log("Time elapsed:", Date.now() - userdata.date);
	if (!selections.length && !selectionsV2.length) return { updated: false };

	const oldUserdata = { ...userdata };

	userdata = await fetchData("tornv2", {
		section: "user",
		legacySelections: selections,
		selections: selectionsV2,
		params: { cat: "all", timestamp: Math.floor(Date.now() / 1000) },
	});
	if (!userdata || !Object.keys(userdata).length) throw new Error("Aborted updating due to an unexpected response.");
	userdata.date = now;
	userdata.dateBasic = updateBasic ? now : (oldUserdata?.dateBasic ?? now);

	// Notifications have a 100K count limit from being fetched via the Torn API
	// Use "newevents" selection only when the old events count > new events count
	// Fetch only when new events arrived
	if (oldUserdata?.notifications?.events !== userdata?.notifications?.events) {
		const newEventsCount = (userdata?.notifications?.events ?? 0) - (oldUserdata?.notifications?.events ?? 0);

		if (newEventsCount > 0) {
			const category = newEventsCount <= 25 ? "newevents" : "events";
			userdata.events =
				// TODO - Migrate to V2 (user/events).
				// TODO - Migrate to V2 (user/newevents).
				(
					await fetchData("tornv2", {
						section: "user",
						selections: [category],
						legacySelections: [category],
						params: { limit: newEventsCount },
					})
				).events;
			selections.push(category);
		}
	}
	if (!userdata.events || userdata?.notifications?.events === 0) userdata.events = {};

	await processUserdata().catch((error) => console.error("Error while processing userdata.", error));
	await checkAttacks().catch((error) => console.error("Error while checking personal stats for attack changes.", error));

	await ttStorage.set({ userdata: { ...oldUserdata, ...userdata } });

	await showIconBars().catch((error) => console.error("Error while updating the icon bars.", error));
	if (updateEssential) {
		await notifyEventMessages().catch((error) => console.error("Error while sending event and message notifications.", error));
		await notifyTravelLanding().catch((error) => console.error("Error while sending travel landing notifications.", error));
		await notifyBars().catch((error) => console.error("Error while sending bar notification.", error));
		await notifyOffline().catch((error) => console.error("Error while sending offline notification.", error));
		await notifyChain().catch((error) => console.error("Error while sending chain notifications.", error));
		await notifyTraveling().catch((error) => console.error("Error while sending traveling notifications.", error));
		await notifyMissions().catch((error) => console.error("Error while sending mission notifications.", error));
	}
	await notifyStatusChange().catch((error) => console.error("Error while sending status change notifications.", error));
	await notifyCooldownOver().catch((error) => console.error("Error while sending cooldown notifications.", error));
	await notifyEducation().catch((error) => console.error("Error while sending education notifications.", error));
	await notifyNewDay().catch((error) => console.error("Error while sending new day notification.", error));
	await notifyHospital().catch((error) => console.error("Error while sending hospital notifications.", error));
	await notifySpecificCooldowns().catch((error) => console.error("Error while sending specific cooldown notifications.", error));

	await ttStorage.set({ notifications });

	return { updated: true, types: updatedTypes, selections: [...selections, ...selectionsV2] };

	async function checkAttacks() {
		if (!settings.pages.global.keepAttackHistory) return;

		if (userdata.attacks) {
			await updateAttackHistory();

			delete userdata.attacks;
		}

		if (oldUserdata.personalstats && userdata.personalstats) {
			const fetchData = [
				(data) => data.personalstats.attacking.attacks.lost,
				(data) => data.personalstats.attacking.attacks.stalemate,
				(data) => data.personalstats.attacking.defends.lost,
				(data) => data.personalstats.attacking.defends.stalemate,
				(data) => data.personalstats.attacking.killstreak.current,
			].some((getter) => getter(oldUserdata) !== getter(userdata));

			await ttStorage.change({ attackHistory: { fetchData } });
		}

		async function updateAttackHistory() {
			let lastAttack = attackHistory.lastAttack;
			userdata.attacks
				.filter(({ id }) => id > attackHistory.lastAttack)
				.forEach((attack) => {
					if (attack.id > lastAttack) lastAttack = attack.id;

					const enemyId = attack.attacker?.id === userdata.profile.id ? attack.defender.id : attack.attacker?.id;
					if (!enemyId) return;

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
					attackHistory.history[enemyId].lastAttack = attack.ended * 1000;
					attackHistory.history[enemyId].lastAttackCode = attack.code;

					if (attack.defender.id === userdata.profile.id) {
						if (attack.attacker.name) attackHistory.history[enemyId].name = attack.attacker.name;

						if (attack.result === "Assist") {
							// Ignore group attacks that isn't the finishing hit
						} else if (["Lost", "Timeout", "Escape", "Stalemate"].includes(attack.result)) {
							attackHistory.history[enemyId].defend++;
						} else {
							attackHistory.history[enemyId].defend_lost++;
						}
					} else if (attack.attacker?.id === userdata.profile.id) {
						if (attack.defender.name) attackHistory.history[enemyId].name = attack.defender.name;

						if (attack.result === "Lost" || attack.result === "Timeout") attackHistory.history[enemyId].lose++;
						else if (attack.result === "Stalemate") attackHistory.history[enemyId].stalemate++;
						else if (attack.result === "Assist") attackHistory.history[enemyId].assist++;
						else if (attack.result === "Escape") attackHistory.history[enemyId].escapes++;
						else {
							attackHistory.history[enemyId].win++;
							if (attack.is_stealthed) attackHistory.history[enemyId].stealth++;

							let respect = attack.respect_gain;
							if (respect !== 0) {
								let hasAccurateModifiers = attack.modifiers;

								if (hasAccurateModifiers) {
									if (respect === attack.modifiers.chain) {
										respect = 1;
										hasAccurateModifiers = false;
									} else {
										if (attack.result === "Mugged") respect /= 0.75;

										respect =
											respect /
											attack.modifiers.war /
											attack.modifiers.retaliation /
											attack.modifiers.group /
											attack.modifiers.overseas /
											attack.modifiers.chain /
											attack.modifiers.warlord;
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
				});

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

				notifications.messages.combined = newNotification(`New Message${applyPlural(messages.length)}`, message, LINKS.messages);
			}
		}

		await setBadge("count", { events: userdata.notifications.events, messages: userdata.notifications.messages });
	}

	async function notifyStatusChange() {
		if (!settings.notifications.types.global || !settings.notifications.types.status || !oldUserdata.profile.status) return;

		const previous = oldUserdata.profile.status.state;
		const current = userdata.profile.status.state;

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
			await notifyUser("TornTools - Status", userdata.profile.status.description, LINKS.home);
			storeNotification({
				title: "TornTools - Status",
				message: userdata.profile.status.description,
				url: LINKS.home,
				date: Date.now(),
			});
		}
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

	async function notifyOffline() {
		if (!settings.notifications.types.global || !settings.notifications.types.offline.length || !oldUserdata?.profile?.last_action?.timestamp) return;

		const checkpoints = settings.notifications.types.offline.sort((a, b) => b - a);

		const oldHoursOffline = Math.floor(((oldUserdata.timestamp - oldUserdata.profile.last_action.timestamp) * TO_MILLIS.SECONDS) / TO_MILLIS.HOURS);
		const hoursOffline = Math.floor(((userdata.timestamp - userdata.profile.last_action.timestamp) * TO_MILLIS.SECONDS) / TO_MILLIS.HOURS);

		for (const checkpoint of checkpoints) {
			if (oldHoursOffline < hoursOffline && hoursOffline >= checkpoint && !notifications.offline[checkpoint]) {
				notifications.offline[checkpoint] = newNotification(
					"Offline",
					`You've been offline for over ${checkpoint} hour${applyPlural(checkpoint)}.`,
					LINKS.home
				);
				break;
			} else if (hoursOffline < checkpoint && notifications.offline[checkpoint]) {
				delete notifications.offline[checkpoint];
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
			userdata.profile.status.state === "Hospital"
		) {
			for (const checkpoint of settings.notifications.types.leavingHospital.sort((a, b) => a - b)) {
				const timeLeft = userdata.profile.status.until * 1000 - now;

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

	async function notifyMissions() {
		if (!settings.apiUsage.user.missions || !settings.notifications.types.global) return;

		if (settings.notifications.types.missionsLimitEnabled && settings.notifications.types.missionsLimit) {
			const limitParts = settings.notifications.types.missionsLimit.split(":").map((part) => parseInt(part, 10));
			const cutoff = getUTCTodayAtTime(limitParts[0], limitParts[1]);

			if (new Date() >= cutoff) {
				for (const { name, contracts } of userdata.missions.givers) {
					const activeContracts = contracts.filter((contract) => contract.completed_at === null);
					const maxMissions = name in MAX_MISSIONS ? MAX_MISSIONS[name] : MAX_MISSIONS.DEFAULT;

					if (activeContracts.length >= maxMissions) {
						const now = new Date();
						const key = `${name}_${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

						if (!(key in notifications.missionsLimit)) {
							notifications.missionsLimit[key] = newNotification(
								"Missions",
								`You are currently at the maximum amount of contracts (${maxMissions}) for ${name}.`,
								LINKS.missions
							);
						}
					}
				}
			}
		} else {
			notifications.missionsLimit = {};
		}

		if (settings.notifications.types.missionsExpireEnabled && settings.notifications.types.missionsExpire.length) {
			for (const { name, contracts } of userdata.missions.givers) {
				const ongoingMissions = contracts.filter((contract) => contract.status === "Accepted");

				for (const mission of ongoingMissions) {
					for (const checkpoint of settings.notifications.types.missionsExpire.sort((a, b) => a - b)) {
						const timeLeft = mission.expires_at * 1000 - now;
						const key = `${name}_${mission.title}_${mission.created_at}_${checkpoint}`;

						if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.HOURS || notifications.missionsExpire[key]) continue;

						notifications.missionsExpire[key] = newNotification(
							"Missions",
							`'${mission.title}' by ${name} will expire in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer", showDays: true, truncateSeconds: true })}.`,
							LINKS.missions
						);
						break;
					}
				}
			}
		} else {
			notifications.missionsExpire = {};
		}
	}
}

async function showIconBars() {
	if (!settings.apiUsage.user.bars || !hasAPIData() || !settings || !settings.pages.icon.global) {
		chrome.action.setIcon({ path: chrome.runtime.getURL("resources/images/icon_128.png") });
	} else {
		let barCount = 0;
		if (settings.pages.icon.energy) barCount++;
		if (settings.pages.icon.nerve) barCount++;
		if (settings.pages.icon.happy) barCount++;
		if (settings.pages.icon.life) barCount++;
		if (settings.pages.icon.chain && userdata.chain && userdata.chain.current > 0) barCount++;
		if (settings.pages.icon.travel && userdata.travel && userdata.travel.time_left > 0) barCount++;

		const canvas = new OffscreenCanvas(128, 128);

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

		chrome.action.setIcon({ imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height) });
	}
}

async function updateStakeouts(forceUpdate = false) {
	const now = Date.now();

	if (!forceUpdate && stakeouts.date && !hasTimePassed(stakeouts.date - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) {
		return { updated: false };
	}

	let success = 0;
	let failed = 0;
	for (const id in stakeouts) {
		if (isNaN(parseInt(id))) continue;

		const oldData = stakeouts[id]?.info ?? false;
		let data;
		try {
			data = await fetchData("tornv2", { section: "user", selections: ["profile"], id, silent: true });
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
				if (data.profile.status.state === "Okay" && (!oldData || oldData.status.state !== data.profile.status.state) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} is now okay.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.profile.status.state !== "Okay") {
					delete notifications.stakeouts[key];
				}
			}
			if (hospital) {
				const key = `${id}_hospital`;
				if (data.profile.status.state === "Hospital" && (!oldData || oldData.status.state !== data.profile.status.state)) {
					if (settings.notifications.types.global) {
						let reasonText = "";
						const reason = getHospitalizationReason(data.profile.status.details);
						if (reason && reason.important) {
							reasonText = reason.display_sentence ?? reason.display ?? reason.name;
							reasonText = " " + reasonText;
						}
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} is now in the hospital${reasonText}.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
					}
				} else if (data.profile.status.state !== "Hospital") {
					delete notifications.stakeouts[key];
				}
			}
			if (landing) {
				const key = `${id}_landing`;
				if (data.profile.status.state !== "Traveling" && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} is now ${data.profile.status.state === "Abroad" ? data.profile.status.description : "in Torn"}.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.profile.last_action.status === "Traveling") {
					delete notifications.stakeouts[key];
				}
			}
			if (online) {
				const key = `${id}_online`;
				if (
					data.profile.last_action.status === "Online" &&
					(!oldData || oldData.last_action.status !== data.profile.last_action.status) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} is now online.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.profile.last_action.status !== "Online") {
					delete notifications.stakeouts[key];
				}
			}
			if (life) {
				const key = `${id}_life`;
				if (data.profile.life.current <= data.profile.life.maximum * (life / 100) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name}'${data.profile.name.endsWith("s") ? "" : "s"} life has dropped below ${life}%.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (data.profile.life.current > data.profile.life.maximum * (life / 100)) {
					delete notifications.stakeouts[key];
				}
			}
			if (offline) {
				const oldOfflineHours = oldData ? ((now - oldData.last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals() : false;
				const offlineHours = ((now - data.profile.last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals();

				const key = `${id}_offline`;
				if (offlineHours >= offline && (!oldOfflineHours || oldOfflineHours < offlineHours) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} has been offline for ${offlineHours} hours.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (offlineHours < offline) {
					delete notifications.stakeouts[key];
				}
			}
			if (revivable) {
				const oldIsRevivable = oldData?.isRevivable ?? false;
				const isRevivable = data.profile.revivable;

				const key = `${id}_revivable`;
				if (!oldIsRevivable && isRevivable && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Stakeouts",
							`${data.profile.name} is now revivable.`,
							`https://www.torn.com/profiles.php?XID=${id}`
						);
				} else if (!oldIsRevivable) {
					delete notifications.stakeouts[key];
				}
			}
		}

		stakeouts[id].info = {
			name: data.profile.name,
			last_action: {
				status: data.profile.last_action.status,
				relative: data.profile.last_action.relative,
				timestamp: data.profile.last_action.timestamp * 1000,
			},
			life: {
				current: data.profile.life.current,
				maximum: data.profile.life.maximum,
			},
			status: {
				state: data.profile.status.state,
				color: data.profile.status.color,
				until: data.profile.status.until ? data.profile.status.until * 1000 : null,
				description: data.profile.status.description,
			},
			isRevivable: data.profile.revivable,
		};
	}
	stakeouts.date = now;

	await ttStorage.change({ stakeouts, notifications });
	return { updated: true, success, failed };
}

async function updateFactionStakeouts(forceUpdate = false) {
	const now = Date.now();

	if (!forceUpdate && factionStakeouts.date && !hasTimePassed(factionStakeouts.date - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) {
		return { updated: false };
	}

	let success = 0;
	let failed = 0;
	for (const factionId in factionStakeouts) {
		if (isNaN(parseInt(factionId))) continue;

		const oldData = factionStakeouts[factionId]?.info ?? false;
		let data;
		try {
			data = await fetchData("tornv2", {
				section: "faction",
				selections: ["basic", "chain", "wars"],
				id: factionId,
				silent: true,
			});
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
								`${data.basic.name} has dropped their ${oldChainCount} chain.`,
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
								`${data.basic.name} has reached a ${chainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
							);
					} else if (chainCount < oldChainCount) {
						delete notifications.stakeouts[key];
					}
				}
			}
			if (memberCountDrops) {
				const oldMemberCount = oldData ? oldData.members.current : false;
				const memberCount = data.basic.members;

				const key = `faction_${factionId}_memberCountDrops`;
				if (memberCount >= oldMemberCount && (!oldMemberCount || oldMemberCount > memberCount) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global)
						notifications.stakeouts[key] = newNotification(
							"Faction Stakeouts",
							`${data.basic.name} now has less than ${memberCount} members.`,
							`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
						);
				} else {
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
				handleWarStakeout("rankedWarStarts", oldData.rankedWar, data.wars.ranked !== null, () => `${data.basic.name} is now in a ranked war.`);
			}
			if (inRaid) {
				handleWarStakeout("inRaid", oldData.raid, data.wars.raids.length > 0, () => `${data.basic.name} is now in a raid.`);
			}
			if (inTerritoryWar) {
				handleWarStakeout(
					"inTerritoryWar",
					oldData.territoryWar,
					data.wars.territory.length > 0,
					() => `${data.basic.name} is now in a territory war.`
				);
			}
		}

		factionStakeouts[factionId].info = {
			name: data.basic.name,
			chain: data.chain.current,
			members: {
				current: data.basic.members,
				maximum: data.basic.capacity,
			},
			rankedWar: data.wars.ranked !== null,
			raid: data.wars.raids.length > 0,
			territoryWar: data.wars.territory.length > 0,
		};
	}
	factionStakeouts.date = now;

	await ttStorage.change({ factionStakeouts, notifications });
	return { updated: true, success, failed };
}

async function updateTorndata() {
	// FIXME - Migrate to V2 (torn/items).
	// TODO - Migrate to V2 (torn/pawnshop).
	// TODO - Migrate to V2 (torn/stats).
	const data = await fetchData("tornv2", {
		section: "torn",
		selections: ["education", "calendar", "properties", "honors", "medals", "items", "pawnshop", "stats"],
		legacySelections: ["items", "pawnshop", "stats"],
	});
	if (!isValidTorndata(data)) throw new Error("Aborted updating due to an unexpected response in V2.");

	const newData = {
		...data,
		date: Date.now(),
	};

	torndata = newData;
	await ttStorage.set({ torndata: newData });

	function isValidTorndata(data) {
		return !!data && !data.error;
	}
}

async function updateStocks() {
	const oldStocks = { ...stockdata };
	// TODO - Migrate to V2 (torn/stocks).
	const stocks = (
		await fetchData("tornv2", {
			section: "torn",
			selections: ["stocks"],
			legacySelections: ["stocks"],
		})
	).stocks;
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
	}
}

async function updateFactiondata() {
	if (!userdata?.faction) {
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
			// FIXME - Migrate to V2 (faction/basic).
			// FIXME - Migrate to V2 (faction/crimes).
			const data = await fetchData("tornv2", {
				section: "faction",
				selections: ["crimes", "basic"],
				legacySelections: ["crimes", "basic"],
				silent: true,
			});
			data.access = FACTION_ACCESS.full_access;
			data.date = Date.now();

			// FIXME - Look into OC2 not breaking this.
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

				if (crime.initiated || !crime.participants.map((value) => parseInt(Object.keys(value)[0])).includes(userdata.profile.id)) continue;

				oc = crime.time_ready * 1000;
			}

			return oc;
		}
	}

	async function updateBasic() {
		try {
			// FIXME - Migrate to V2 (faction/basic).
			const data = await fetchData("tornv2", {
				section: "faction",
				selections: ["basic"],
				legacySelections: ["basic"],
				silent: true,
			});
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

	await ttStorage.set({ notifications });

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
		const {
			time: { clear: planned, reason, attack: ongoing },
			...data
		} = await fetchData("lzpt", { section: "loot" });

		npcs = {
			next_update: now + TO_MILLIS.MINUTES * (ongoing || (planned === 0 && !reason) ? 1 : 15),
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
				scheduled: npc.next ?? true,
				order: data.order.findIndex((o) => o === id) + (npc.next ? 0 : 10),
			};

			npcs.targets[id].current = getCurrentLevel(npcs.targets[id]);
		}

		npcs.planned = planned === 0 ? false : planned * 1000;
		npcs.reason = reason;

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

	const icon = chrome.runtime.getURL("resources/images/icon_128.png");
	const requireInteraction = hasInteractionSupport() && settings.notifications.requireInteraction;
	const silent = hasSilentSupport() && notificationSound !== "default";

	if (settings.notifications.tts) {
		readMessage(title + message)
			.then(() => {})
			.catch((err) => console.error(err));
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
			const sound = getNotificationSound(settings.notifications.sound);

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

	async function readMessage(text) {
		// Has TTS
		if (typeof SpeechSynthesisUtterance !== "undefined") {
			const ttsMessage = new SpeechSynthesisUtterance(text);
			ttsMessage.volume = settings.notifications.volume / 100;
			window.speechSynthesis.speak(ttsMessage);
		} else {
			// Offscreen documents
			await setupAudioPlayerDocument();

			await chrome.runtime.sendMessage({
				offscreen: "tts",
				text: text,
				volume: settings.notifications.volume / 100,
			});
		}
	}
}

// chrome.runtime.onConnect.addListener(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.action) {
		case "initialize":
			timedUpdates();

			sendResponse({ success: true });
			break;
		case "play-notification-sound":
			const sound = getNotificationSound(message.sound);
			if (sound) {
				notificationTestPlayer.volume = message.volume / 100;
				notificationTestPlayer.src = sound;
				void notificationTestPlayer.play();
			}
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
			else if (message.update === "userdata") updateFunction = updateUserdata;
			else break;

			updateFunction(true)
				.then((result) => sendResponse(result))
				.catch((error) => sendResponse(error));
			return true;
		case "reinitialize-timers":
			(async () => {
				await chrome.alarms.clearAll();
				await chrome.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
				await chrome.alarms.create(ALARM_NAMES.CLEAR_USAGE, { periodInMinutes: 60 * 24 });
				await chrome.alarms.create(ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS, { periodInMinutes: 0.52 });
				await chrome.alarms.create(ALARM_NAMES.NOTIFICATIONS, { periodInMinutes: 0.08 });

				sendResponse(await chrome.alarms.getAll());
			})();

			return true;
		case "clear-cache":
			ttCache.clear();

			sendResponse({ success: true });
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
	switch (type) {
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
			return chrome.runtime.getURL(`resources/audio/notification${type}.wav`);
		case "custom":
			return settings.notifications.soundCustom;
		default:
			return false;
	}
}

async function setupAudioPlayerDocument() {
	// Setup of offscreen document for playing audio.
	const offscreenURL = chrome.runtime.getURL("/scripts/offscreen/offscreen.html");
	const existingContexts = await chrome.runtime.getContexts({
		contextTypes: ["OFFSCREEN_DOCUMENT"],
	});
	if (existingContexts.length > 0) return;

	try {
		await chrome.offscreen.createDocument({
			url: offscreenURL,
			reasons: ["AUDIO_PLAYBACK"],
			justification: "To play notification alert sound.",
		});
	} catch (err) {
		console.log(
			"Race condition.",
			existingContexts,
			await chrome.runtime.getContexts({
				contextTypes: ["OFFSCREEN_DOCUMENT"],
			})
		);
	}
}

async function storeNotification(notification) {
	notificationHistory.insertAt(0, notification);
	notificationHistory = notificationHistory.slice(0, 100);

	await ttStorage.set({ notificationHistory });
}

async function verifyTime() {
	const savedTime = await ttStorage.get("time");

	const now = Date.now();
	if (savedTime != null && savedTime > Date.now()) {
		console.warn("Detected a desynchronized time! Resetting timed data.");
		ttCache.clear();
		await Promise.all([updateUserdata(true), updateFactiondata(), updateTorndata(), updateStocks(), updateStakeouts(true), updateFactionStakeouts(true)]);
	}

	await ttStorage.set({ time: now });
}
