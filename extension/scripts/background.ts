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
} as const;

class AudioPlayer {
	private _src: string;
	private _volume: number;
	private _audio: HTMLAudioElement | undefined;

	set src(src: string) {
		this._src = src;
	}

	set volume(volume: number) {
		this._volume = volume;
	}

	async play() {
		if (typeof Audio !== "undefined") {
			const audio = new Audio(this._src);
			audio.volume = this._volume;
			void audio.play();

			this._audio = audio;

			return;
		}

		await setupAudioPlayerDocument();

		if (!this._src) throw Error("No sound src set.");

		await chrome.runtime.sendMessage({
			offscreen: "audio",
			src: this._src,
			volume: this._volume,
		} satisfies OffscreenMessage);
	}

	async pause() {
		if (this._audio) {
			this._audio.pause();

			return;
		}
	}
}

const notificationPlayer = new AudioPlayer();
const notificationTestPlayer = new AudioPlayer();

let notificationSound: string | undefined, notificationWorker: ServiceWorkerRegistration | undefined;
const notificationRelations: { [id: string]: string } = {};

let npcUpdater: number | undefined;

// On browser update, extension update or extension (re)install
chrome.runtime.onInstalled.addListener(async () => {
	await migrateDatabase(true);
	void checkUpdate();

	void resetAlarms();

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

		void resetAlarms();
	});
})();

async function resetAlarms() {
	await chrome.alarms.clearAll();

	void chrome.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
	void chrome.alarms.create(ALARM_NAMES.CLEAR_USAGE, { periodInMinutes: 60 * 24 });
	void chrome.alarms.create(ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS, { periodInMinutes: 0.52 });
	void chrome.alarms.create(ALARM_NAMES.NOTIFICATIONS, { periodInMinutes: 0.08 });
}

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

	const change: RecursivePartial<Writable<Database>> = { version: { oldVersion: newVersion } };
	if (oldVersion !== newVersion) {
		console.log("New version detected!", newVersion);
		change.version.showNotice = true;
	}

	await ttStorage.change(change);
}

async function sendNotifications() {
	for (const type in notifications) {
		for (const key in notifications[type]) {
			const notification: TTNotification = notifications[type][key];
			if ("combined" in notification) continue;

			const { seen, date, title, message, url } = notification;

			if (!seen) {
				await notifyUser(title, message, url);

				notification.seen = true;
				await storeNotification({ title, message, url, type, key, date });
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

		if (!factiondata || !("date" in factiondata) || hasTimePassed(factiondata.date, TO_MILLIS.MINUTES * 15))
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

	function logError(message: any, error: any) {
		if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
			console.warn(`You disabled our permission to call the API!`);
		} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK) {
			console.warn(`Error due to no internet while ${message}.`);
		} else {
			console.error(`Error while ${message}.`, error);
		}
	}
}

function hasTimePassed(timestamp: number, time: number) {
	const difference = Date.now() - timestamp;

	return Math.abs(difference) >= time;
}

function clearCache() {
	ttCache.refresh().catch((error) => console.error("Error while clearing cache.", error));
}

function clearUsage() {
	ttUsage.refresh().catch((error) => console.error("Error while clearing API usage data.", error));
}

type FetchedUserdata = UserProfileResponse &
	UserFactionResponse &
	UserJobResponse &
	TimestampResponse &
	UserNotificationsResponse &
	UserV1BarsResponse &
	UserCooldownsResponse &
	UserTravelResponse &
	UserNewMessagesResponse &
	UserV1RefillsResponse & { icons: UserIconPrivate[] } & UserMoneyResponse &
	UserV1StocksResponse &
	UserMeritsResponse &
	UserV1PerksResponse &
	UserV1NetworthResponse &
	UserV1AmmoResponse &
	UserBattleStatsResponse &
	UserWorkStatsResponse &
	UserSkillsResponse &
	UserWeaponExpResponse &
	UserV1PropertiesResponse &
	UserCalendarResponse &
	UserOrganizedCrimeResponse &
	UserPersonalStatsFull &
	UserHonorsResponse &
	UserMedalsResponse &
	UserMissionsResponse &
	UserV1EducationResponse &
	FactionAttacksResponse &
	(UserEventsResponse | UserNewEventsResponse) &
	UserVirusResponse;

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
		selectionsV2.push("profile", "faction", "job", "timestamp", "notifications");
		// Notifications have a 100K count limit from being fetched via the Torn API
		// Use "newevents" selection only when the old events count > new events count
		// Fetch the notifications count always, to avoid additional API calls

		// TODO - Migrate to V2 (user/bars).
		// TODO - Migrate to V2 (user/refills).
		for (const selection of ["bars", "refills"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}
		for (const selection of ["cooldowns", "icons", "newmessages", "money", "travel"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		updatedTypes.push("essential");
	}
	if (updateBasic) {
		// TODO - Migrate to V2 (user/stocks).
		// TODO - Migrate to V2 (user/perks).
		// TODO - Migrate to V2 (user/networth).
		// TODO - Migrate to V2 (user/ammo).
		// FIXME - Migrate to V2 (user/properties).
		for (const selection of [
			"stocks",
			// "inventory",
			"perks",
			"networth",
			"ammo",
			"properties",
		]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}
		for (const selection of [
			"battlestats",
			"skills",
			"calendar",
			"organizedcrime",
			"personalstats",
			"honors",
			"weaponexp",
			"medals",
			"missions",
			"workstats",
			"virus",
			"merits",
		]) {
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

	// @ts-expect-error System from before the migration. We are setting these parameters later on.
	userdata = await fetchData<FetchedUserdata>("tornv2", {
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
					await fetchData<UserEventsResponse | UserNewEventsResponse>("tornv2", {
						section: "user",
						selections: [category],
						legacySelections: [category],
						params: { limit: newEventsCount },
					})
				).events;
			selections.push(category);
		}
	}
	if (!("events" in userdata) || userdata?.notifications?.events === 0) {
		// @ts-expect-error pre-migration shit
		userdata.events = {};
	}

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
				(data: DatabaseUserdata) => data.personalstats.attacking.attacks.lost,
				(data: DatabaseUserdata) => data.personalstats.attacking.attacks.stalemate,
				(data: DatabaseUserdata) => data.personalstats.attacking.defends.lost,
				(data: DatabaseUserdata) => data.personalstats.attacking.defends.stalemate,
				(data: DatabaseUserdata) => data.personalstats.attacking.killstreak.current,
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

					// Set up the data so there are no missing keys.
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
						...(enemyId in attackHistory.history ? attackHistory.history[enemyId] : {}),
						lastAttack: attack.ended * 1000,
						lastAttackCode: attack.code,
					};

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
								let hasAccurateModifiers = "modifiers" in attack;

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
			const icon85 = userdata.icons.find(({ id }) => id === 85);
			if (icon85) {
				userdata.userCrime = userdata.timestamp * TO_MILLIS.SECONDS + textToTime(icon85.description.split("-").at(-1)!.trim());
			} else if (userdata.icons.some(({ id }) => id === 86)) {
				userdata.userCrime = userdata.timestamp * TO_MILLIS.SECONDS;
			} else {
				userdata.userCrime = -1;
			}
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
					notifications.events[key] = { combined: true };
				}

				eventCount++;
			}
			if (events.length) {
				// Remove profile links from event message
				let message = events.at(-1)!.event.replace(/<\/?[^>]+(>|$)/g, "");
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
					notifications.messages[key] = { combined: true };
				}

				messageCount++;
			}
			if (messages.length) {
				let message = `${messages.at(-1)!.title} - by ${messages.at(-1)!.name}`;
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
				await storeNotification({
					title: "TornTools - Status",
					message: "You are out of the hospital.",
					url: LINKS.home,
					type: "status",
					key: Date.now(),
					date: Date.now(),
				});
			} else if (previous === "Jail") {
				await notifyUser("TornTools - Status", "You are out of the jail.", LINKS.home);
				await storeNotification({
					title: "TornTools - Status",
					message: "You are out of the jail.",
					url: LINKS.home,
					date: Date.now(),
				});
			}
		} else {
			await notifyUser("TornTools - Status", userdata.profile.status.description, LINKS.home);
			await storeNotification({
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
			await storeNotification({
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
		await storeNotification({
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
		await storeNotification({
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

			const checkpoints = (settings.notifications.types[bar] as any[])
				.map<number>((checkpoint: string | number) =>
					typeof checkpoint === "string" && checkpoint.includes("%")
						? (parseInt(checkpoint) / 100) * userdata[bar].maximum
						: parseInt(checkpoint.toString())
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
				if (timeout > checkpoint * TO_MILLIS.SECONDS || notifications.chain[key]) continue;

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

				if (nextBonus - count > checkpoint || notifications.chainCount[key]) continue;

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

				if (timeLeft > checkpoint * TO_MILLIS.MINUTES || notifications.hospital[checkpoint]) continue;

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
				const timeLeft = userdata.travel.arrival_at * 1000 - now;

				if (timeLeft > checkpoint * TO_MILLIS.MINUTES || notifications.travel[checkpoint]) continue;

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
				for (const checkpoint of settings.notifications.types[cooldown.setting].sort((a: number, b: number) => a - b)) {
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

						if (timeLeft > checkpoint * TO_MILLIS.HOURS || notifications.missionsExpire[key]) continue;

						notifications.missionsExpire[key] = newNotification(
							"Missions",
							`'${mission.title}' by ${name} will expire in ${formatTime(
								{ milliseconds: timeLeft },
								{
									type: "wordTimer",
									showDays: true,
									truncateSeconds: true,
								}
							)}.`,
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
		await chrome.action.setIcon({ path: chrome.runtime.getURL("resources/images/icon_128.png") });
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

			let current: number, maximum: number;
			if (key === "travel") {
				const totalTrip = userdata[key].arrival_at - userdata[key].departed_at;

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

		await chrome.action.setIcon({ imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height) });
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
		const stakeout = stakeouts[id];
		if (typeof stakeout !== "object" || Array.isArray(stakeout)) continue;

		const oldData = stakeout?.info ?? null;
		let data: UserProfileResponse;
		try {
			data = await fetchData<UserProfileResponse>("tornv2", {
				section: "user",
				selections: ["profile"],
				id,
				silent: true,
			});
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

		if (stakeout.alerts) {
			const { okay, hospital, landing, online, life, offline, revivable } = stakeout.alerts;

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
				} else if (data.profile.status.state === "Traveling") {
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
				const oldOfflineHours = oldData ? dropDecimals((now - oldData.last_action.timestamp * 1000) / TO_MILLIS.HOURS) : null;
				const offlineHours = dropDecimals((now - data.profile.last_action.timestamp * 1000) / TO_MILLIS.HOURS);

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

		stakeouts[id] = {
			...stakeout,
			info: {
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
			},
		};
	}
	stakeouts.date = now;

	await ttStorage.change({ stakeouts, notifications });
	return { updated: true, success, failed };
}

type FetchedFactionStakeout = FactionBasicResponse & FactionOngoingChainResponse & FactionWarsResponse;

async function updateFactionStakeouts(forceUpdate = false) {
	const now = Date.now();

	if (!forceUpdate && "date" in factionStakeouts && !hasTimePassed(factionStakeouts.date - 100, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) {
		return { updated: false };
	}

	let success = 0;
	let failed = 0;
	for (const factionId in factionStakeouts) {
		if (isNaN(parseInt(factionId))) continue;

		const oldData = typeof factionStakeouts[factionId] === "object" && factionStakeouts[factionId] !== null ? factionStakeouts[factionId].info : null;
		let data: FetchedFactionStakeout;
		try {
			data = await fetchData<FetchedFactionStakeout>("tornv2", {
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

		if (typeof factionStakeouts[factionId] === "object" && factionStakeouts[factionId] !== null && factionStakeouts[factionId].alerts) {
			const { chainReaches, memberCountDrops, rankedWarStarts, inRaid, inTerritoryWar } = factionStakeouts[factionId].alerts;

			if (chainReaches !== null) {
				const oldChainCount = oldData ? oldData.chain : false;
				const chainCount = data.chain.current;

				if (chainReaches === 0) {
					const key = `faction_${factionId}_chainDrops`;
					if (typeof oldChainCount === "number" && chainCount < oldChainCount && oldChainCount >= 10 && !notifications.stakeouts[key]) {
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
					if (
						chainReaches !== false &&
						chainCount >= chainReaches &&
						(!oldChainCount || oldChainCount < chainCount) &&
						!notifications.stakeouts[key]
					) {
						if (settings.notifications.types.global)
							notifications.stakeouts[key] = newNotification(
								"Faction Stakeouts",
								`${data.basic.name} has reached a ${chainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`
							);
					} else if (typeof oldChainCount === "number" && chainCount < oldChainCount) {
						delete notifications.stakeouts[key];
					}
				}
			}
			if (memberCountDrops) {
				const oldMemberCount = oldData ? oldData.members.current : false;
				const memberCount = data.basic.members;

				const key = `faction_${factionId}_memberCountDrops`;
				if (
					typeof oldMemberCount === "number" &&
					memberCount >= oldMemberCount &&
					(!oldMemberCount || oldMemberCount > memberCount) &&
					!notifications.stakeouts[key]
				) {
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

			const handleWarStakeout = (type: string, wasValue: boolean, isValue: boolean, createMessage: () => string) => {
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

		if (typeof factionStakeouts[factionId] === "object" && factionStakeouts[factionId] !== null) {
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
	}
	factionStakeouts = { ...factionStakeouts, date: now };

	await ttStorage.change({ factionStakeouts, notifications });
	return { updated: true, success, failed };
}

type FetchedTorndata = TornEducationResponse &
	TornCalendarResponse &
	TornProperties &
	TornHonorsResponse &
	TornMedalsResponse &
	TornV1ItemsResponse &
	TornV1PawnshopResponse &
	TornV1StatsResponse;

async function updateTorndata() {
	// FIXME - Migrate to V2 (torn/items).
	// TODO - Migrate to V2 (torn/pawnshop).
	// TODO - Migrate to V2 (torn/stats).
	const data = await fetchData<FetchedTorndata>("tornv2", {
		section: "torn",
		selections: ["education", "calendar", "properties", "honors", "medals", "items", "pawnshop", "stats"],
		legacySelections: ["items", "pawnshop", "stats"],
	});

	const newData = {
		...data,
		date: Date.now(),
	};

	torndata = newData;
	await ttStorage.set({ torndata: newData });
}

type FetchedStockdata = TornV1StocksResponse;

async function updateStocks() {
	const oldStocks = { ...stockdata };
	// TODO - Migrate to V2 (torn/stocks).
	const stocks = (
		await fetchData<FetchedStockdata>("tornv2", {
			section: "torn",
			selections: ["stocks"],
			legacySelections: ["stocks"],
		})
	).stocks;
	if (!stocks || !Object.keys(stocks).length) throw new Error("Aborted updating due to an unexpected response.");

	await ttStorage.change({ stockdata: { ...stocks, date: Date.now() } });

	if (oldStocks && settings.notifications.types.global) {
		for (const id in settings.notifications.types.stocks) {
			if (typeof oldStocks[id] === "number") continue;

			const alerts = settings.notifications.types.stocks[id];

			if (alerts.priceFalls && oldStocks[id].current_price > alerts.priceFalls && stocks[id].current_price <= alerts.priceFalls) {
				const message = `(${stocks[id].acronym}) ${stocks[id].name} has fallen to ${formatNumber(stocks[id].current_price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceFalls, { currency: true })})!`;

				await notifyUser("TornTools - Stock Alerts", message, LINKS.stocks);
				await storeNotification({
					title: "TornTools -  Stock Alerts",
					message,
					url: LINKS.stocks,
					date: Date.now(),
				});
			} else if (alerts.priceReaches && oldStocks[id].current_price < alerts.priceReaches && stocks[id].current_price >= alerts.priceReaches) {
				const message = `(${stocks[id].acronym}) ${stocks[id].name} has reached ${formatNumber(stocks[id].current_price, {
					currency: true,
				})} (alert: ${formatNumber(alerts.priceReaches, { currency: true })})!`;

				await notifyUser("TornTools - Stock Alerts", message, LINKS.stocks);
				await storeNotification({
					title: "TornTools -  Stock Alerts",
					message,
					url: LINKS.stocks,
					date: Date.now(),
				});
			}
		}
	}
}

type FetchedFactiondataBasic = FactionBasicResponse & FactionRankedWarResponse;
type FetchedFactiondataWithAccess = FetchedFactiondataBasic & FactionV1CrimesResponse;

async function updateFactiondata() {
	if (!userdata?.faction) {
		factiondata = { access: FACTION_ACCESS.none };
	} else {
		const hasFactiondata = !factiondata || typeof factiondata !== "object" || factiondata.access !== FACTION_ACCESS.none;

		if (!hasFactiondata || hasFactionAPIAccess()) {
			factiondata = await updateAccess();
		} else {
			const retry = ("retry" in factiondata && !!factiondata.retry) || ("date" in factiondata && hasTimePassed(factiondata.date, TO_MILLIS.HOURS * 6));

			if (retry) factiondata = await updateAccess();
			else factiondata = await updateBasic();
		}
	}

	await ttStorage.set({ factiondata });

	async function updateAccess(): Promise<StoredFactiondata> {
		try {
			// FIXME - Migrate to V2 (faction/crimes).
			const data = await fetchData<FetchedFactiondataWithAccess>("tornv2", {
				section: "faction",
				selections: ["crimes", "basic", "rankedwars"],
				legacySelections: ["crimes"],
				silent: true,
			});

			return {
				...data,
				access: FACTION_ACCESS.full_access,
				date: Date.now(),
				userCrime: calculateOC(data.crimes), // FIXME - Look into OC2 not breaking this.
			};
		} catch (error) {
			if (error?.code === 7) {
				const data = await updateBasic();

				return { ...data, retry: Date.now() };
			}

			return { error, access: FACTION_ACCESS.none };
		}

		function calculateOC(crimes: FactionV1Crimes) {
			let oc = -1;

			for (const id of Object.keys(crimes).reverse()) {
				const crime = crimes[id];

				if (crime.initiated || !crime.participants.map((value) => parseInt(Object.keys(value)[0])).includes(userdata.profile.id)) continue;

				oc = crime.time_ready * 1000;
			}

			return oc;
		}
	}

	async function updateBasic(): Promise<StoredFactiondataBasic | StoredFactiondataNoAccess> {
		try {
			const data = await fetchData<FetchedFactiondataBasic>("tornv2", {
				section: "faction",
				selections: ["basic", "rankedwars"],
				silent: true,
			});

			return {
				...data,
				access: FACTION_ACCESS.basic,
				date: Date.now(),
			};
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
	let updated: boolean;

	if (npcs && "next_update" in npcs && npcs.next_update > now) {
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
		const data = await fetchData<YATALoot>("yata", { section: "loot" });

		if (npcs && "timestamp" in npcs && npcs.timestamp === data.timestamp) return await updateLevels();

		const newNpcs: StoredNpcs = {
			next_update: data.next_update * 1000,
			service: "YATA",
			targets: {},
		};

		for (let [id, hospital] of Object.entries(data.hosp_out)) {
			hospital = hospital * 1000;

			newNpcs.targets[id] = {
				levels: {
					1: hospital,
					2: hospital + TO_MILLIS.MINUTES * 30,
					3: hospital + TO_MILLIS.MINUTES * 90,
					4: hospital + TO_MILLIS.MINUTES * 210,
					5: hospital + TO_MILLIS.MINUTES * 450,
				},
				name: NPCS[id] ?? "Unknown",
				order: parseInt(id),
			};

			newNpcs.targets[id].current = getCurrentLevel(newNpcs.targets[id]);
		}

		await ttStorage.set({ npcs });
		return true;
	}

	async function fetchTornStats() {
		const data = await fetchData<TornstatsLoot>("tornstats", { section: "loot" });

		if (data && !data.status) return await updateLevels();

		const newNpcs: StoredNpcs = {
			next_update: now + TO_MILLIS.MINUTES * 15,
			service: "TornStats",
			targets: {},
		};

		for (const npc of Object.values(data)
			.filter((x) => typeof x === "object")
			.filter((npc) => npc.torn_id)) {
			newNpcs.targets[npc.torn_id] = {
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

			newNpcs.targets[npc.torn_id].current = getCurrentLevel(newNpcs.targets[npc.torn_id]);
		}

		await ttStorage.set({ npcs: newNpcs });
		return true;
	}

	async function fetchLootRangers() {
		const {
			time: { clear: planned, reason, attack: ongoing },
			...data
		} = await fetchData<LootRangersLoot>("lzpt", { section: "loot" });

		const newNpcs: StoredNpcs = {
			next_update: now + TO_MILLIS.MINUTES * (ongoing || (planned === 0 && !reason) ? 1 : 15),
			service: "Loot Rangers",
			targets: {},
		};

		for (const [_id, npc] of Object.entries(data.npcs)) {
			const id = parseInt(_id);
			const hospital = npc.hosp_out * 1000;

			newNpcs.targets[id] = {
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

			newNpcs.targets[id].current = getCurrentLevel(newNpcs.targets[id]);
		}

		newNpcs.planned = planned === 0 ? false : planned * 1000;
		newNpcs.reason = reason;

		await ttStorage.set({ npcs: newNpcs });
		return true;
	}

	async function updateLevels() {
		if (!("targets" in npcs)) return false;

		const targets: { [id: string]: Partial<StoredNpc> } = {};

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

	function getCurrentLevel(npc: StoredNpc) {
		return (
			Object.entries(npc.levels)
				.filter(([, time]) => time <= now)
				.map(([level, time]) => ({ level: parseInt(level), time }))
				?.at(-1)?.level ?? 0
		);
	}

	function checkNPCAlerts() {
		if (!settings.notifications.types.global || !settings.notifications.types.npcsGlobal) return 0;
		if (!("targets" in npcs)) return 0;

		let alerts = 0;

		for (const { id, level, minutes } of settings.notifications.types.npcs.filter(
			(npc): npc is { id: number; level: number; minutes: number } => npc.level !== "" && npc.minutes !== ""
		)) {
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
		const shortest =
			"targets" in npcs
				? Object.values(npcs.targets)
						.flatMap((npc) => Object.values(npc.levels))
						.filter((time) => time > now)
						.sort()[0]
				: null;
		if (!shortest) return;

		if (npcUpdater) clearTimeout(npcUpdater);
		npcUpdater = setTimeout(() => {
			updateLevels();

			npcUpdater = undefined;
		}, shortest - Date.now());
	}
}

type TTNotification =
	| {
			title: string;
			message: string;
			url?: string;
			date: number;
			type?: string;
			key?: string | number;
			seen?: boolean;
	  }
	| { combined: true };

function newNotification(title: string, message: string, link?: string): TTNotification {
	return {
		title: `TornTools - ${title}`,
		message,
		url: link,
		date: Date.now(),
	};
}

async function notifyUser(title: string, message: string, url?: string) {
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
		const options: any = { type: "basic", iconUrl: icon, title, message };
		if (silent) options.silent = true;
		if (requireInteraction) options.requireInteraction = true;
		const id = await chrome.notifications.create(options);

		if (notificationSound !== "default" && notificationSound !== "mute") notificationPlayer.play().then(() => {});

		if (settings.notifications.link) notificationRelations[id] = url;
	}

	async function notifyService() {
		const options: any = {
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
			// Set up the service worker.
			await navigator.serviceWorker.register("scripts/service-worker.js").then(async (registration) => {
				notificationWorker = registration;
				await registration.update();
			});
		}

		// Send the actual notification.
		await new Promise<void>((resolve, reject) => {
			notificationWorker
				.showNotification(title, options)
				.then(() => {
					if (notificationSound !== "default" && notificationSound !== "mute") notificationPlayer.play();

					resolve();
				})
				.catch((error) => reject(error));
		});
	}

	async function readMessage(text: string) {
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
			} satisfies OffscreenMessage);
		}
	}
}

// chrome.runtime.onConnect.addListener(() => {});

type BackgroundMessage =
	| { action: "initialize" }
	| { action: "play-notification-sound"; sound: string; volume: number; allowDefault?: boolean }
	| { action: "stop-notification-sound" }
	| { action: "notification"; title: string; message: string; url?: string }
	| { action: "fetchRelay"; location: FetchLocation; options: Partial<FetchOptions> }
	| { action: "forceUpdate"; update: "torndata" | "stocks" | "factiondata" | "userdata" }
	| { action: "reinitialize-timers" }
	| { action: "clear-cache" };

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse: (response?: any) => void) => {
	switch (message.action) {
		case "initialize":
			timedUpdates();

			sendResponse({ success: true });
			break;
		case "play-notification-sound":
			const sound = getNotificationSound(message.sound, message.allowDefault ?? true);
			if (sound) {
				notificationTestPlayer.volume = message.volume / 100;
				notificationTestPlayer.src = sound;
				void notificationTestPlayer.play();
			}
			sendResponse({ success: true });
			break;
		case "stop-notification-sound":
			void notificationTestPlayer.pause();
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
			let updateFunction: (forceUpdate?: boolean) => Promise<void> | ReturnType<typeof updateUserdata>;

			if (message.update === "torndata") updateFunction = updateTorndata;
			else if (message.update === "stocks") updateFunction = updateStocks;
			else if (message.update === "factiondata") updateFunction = updateFactiondata;
			else if (message.update === "userdata") updateFunction = updateUserdata;
			else break;

			updateFunction(true)
				.then((result: any) => sendResponse(result))
				.catch((error: any) => sendResponse(error));
			return true;
		case "reinitialize-timers":
			(async () => {
				await resetAlarms();

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
	return undefined;
});

chrome.notifications.onClicked.addListener((id) => {
	if (id in notificationRelations) {
		void chrome.tabs.create({ url: notificationRelations[id] });
	}
});

function getNotificationSound(type: string, allowDefault = false) {
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
			return allowDefault ? getNotificationSound("1") : false;
	}
}

let creatingOffscreen: Promise<void> | null = null;

async function setupAudioPlayerDocument() {
	const existingContexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
	if (existingContexts.length > 0) return;

	if (!creatingOffscreen) {
		creatingOffscreen = chrome.offscreen.createDocument({
			url: "/scripts/offscreen/offscreen.html",
			reasons: ["AUDIO_PLAYBACK"],
			justification: "To play notification alert sound and TTS.",
		});

		await creatingOffscreen;
		creatingOffscreen = null;
	} else {
		await creatingOffscreen;
	}
}

async function storeNotification(notification: TTNotification) {
	if ("combined" in notification) {
		console.warn("Trying to save a combined notification.", notification);
		return;
	}
	if (!notification.title || !notification.message || !notification.date) {
		console.warn("Trying to save a notification without title, message or date.", notification);
		return;
	}

	notificationHistory.splice(0, 0, notification);
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
