"use strict";

const notificationPlayer = getAudioPlayer();
const notificationTestPlayer = getAudioPlayer();

let notificationSound = null;
let notificationRelations = {};

let notifications = {
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
};

(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();

	registerUpdaters();

	await showIconBars();
	storageListeners.settings.push(async () => {
		await showIconBars();
	});
})();

async function convertDatabase() {
	let storage = await ttStorage.get();

	if (!storage || !Object.keys(storage).length) {
		console.log("Setting new storage.");
		await ttStorage.reset();
	} else {
		console.log("Old storage.", storage);

		let newStorage = convertGeneral(storage, DEFAULT_STORAGE);

		await ttStorage.clear();
		await ttStorage.set(newStorage);

		console.log("New storage.", newStorage);
	}

	function convertGeneral(oldStorage, defaultStorage) {
		let newStorage = {};

		for (let key in defaultStorage) {
			if (!oldStorage) oldStorage = {};
			if (!key in oldStorage) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				if (defaultStorage[key] instanceof DefaultSetting) {
					let useCurrent = true;

					if (defaultStorage[key].type === "array") {
						if (!Array.isArray(oldStorage[key])) {
							useDefault();
							useCurrent = false;
						}
					} else if (!defaultStorage[key].type.split("|").some((value) => value === typeof oldStorage[key])) {
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
	timedUpdates();

	setInterval(sendNotifications, 5 * TO_MILLIS.SECONDS);
	setInterval(timedUpdates, 30 * TO_MILLIS.SECONDS);
}

async function sendNotifications() {
	for (let type in notifications) {
		for (let key in notifications[type]) {
			const { skip, seen, date, title, message, url } = notifications[type][key];

			if (!skip && !seen) {
				await notifyUser(title, message, url);

				notifications[type][key].seen = true;
			}

			if (seen && Date.now() - date > 3 * TO_MILLIS.DAYS) {
				delete notifications[type][key];
			}
		}
	}
}

function timedUpdates() {
	if (api.torn.key) {
		updateUserdata()
			.then(({ updated, types, selections }) => {
				if (updated) console.log(`Updated ${types.join("+")} userdata.`, selections);
				else console.log("Skipped this userdata update.");
			})
			.catch((error) => console.error("Error while updating userdata.", error));

		updateStakeouts()
			.then(({ updated, success, failed }) => {
				if (updated) {
					if (success || failed) console.log("Updated stakeouts.", { success, failed });
					else console.log("No stakeouts to update.");
				} else console.log("Skipped this stakeout update.");
			})
			.catch((error) => console.error("Error while updating stakeouts.", error));

		if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
			// Update once every torn day.
			updateTorndata()
				.then(() => console.log("Updated torndata."))
				.catch((error) => console.error("Error while updating torndata.", error));
		}

		// noinspection JSCheckFunctionSignatures
		if (!torndata || !torndata.stocks || !isSameStockTick(new Date(torndata.stocks.date), new Date())) {
			updateStocks()
				.then(() => console.log("Updated stocks."))
				.catch((error) => console.error("Error while updating stocks.", error));
		}

		if (!factiondata || Date.now() - factiondata.date >= TO_MILLIS.MINUTES * 15)
			updateFactiondata()
				.then(() => console.log("Updated factiondata."))
				.catch((error) => console.error("Error while updating factiondata.", error));
	}
}

async function updateUserdata() {
	const now = Date.now();

	let updatedTypes = [];
	let updateEssential = !userdata || now - userdata.date + 100 >= TO_MILLIS.SECONDS * settings.apiUsage.delayEssential;
	let updateBasic =
		updateEssential &&
		(!userdata.dateBasic ||
			(now - userdata.dateBasic + 100 >= TO_MILLIS.SECONDS * settings.apiUsage.delayBasic &&
				now - userdata.last_action.timestamp * 1000 <= TO_MILLIS.MINUTES * 5));

	let selections = [];
	if (updateEssential) {
		selections.push("profile", "timestamp");

		for (let selection of ["bars", "cooldowns", "travel", "events", "messages", "money", "refills"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}
		updatedTypes.push("essential");
	}
	if (updateBasic) {
		for (let selection of ["personalstats", "stocks", "inventory", "merits"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}

		if (
			settings.apiUsage.user.education &&
			(!userdata.education || !userdata.education_completed || userdata.education_completed.length !== Object.keys(torndata.education).length)
		)
			selections.push("education");

		updatedTypes.push("basic");
	}
	if (attackHistory.fetchData && settings.apiUsage.user.attacks) {
		selections.push("attacks");

		updatedTypes.push("attack history");
	}
	if (!selections.length) return { updated: false };

	const oldUserdata = { ...userdata };
	userdata = await fetchApi("torn", { section: "user", selections });
	userdata.date = now;
	userdata.dateBasic = updateBasic ? now : oldUserdata.dateBasic;

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
			let fetchData = ["killstreak", "defendsstalemated", "attacksdraw", "defendslost"].some(
				(stat) => oldUserdata.personalstats[stat] !== userdata.personalstats[stat]
			);

			await ttStorage.change({ attackHistory: { fetchData } });
		}

		async function updateAttackHistory() {
			let lastAttack = attackHistory.lastAttack;
			for (let attackId in userdata.attacks) {
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
							let hasBaseRespect = attack.modifiers;

							if (hasBaseRespect) {
								if (respect === attack.modifiers.chainBonus) {
									respect = 1;
									hasBaseRespect = false;
								} else if (attack.modifiers.war > 1) {
									respect =
										respect / attack.modifiers.war / attack.modifiers.groupAttack / attack.modifiers.overseas / attack.modifiers.chainBonus;
									hasBaseRespect = false;
								} else {
									if (attack.result === "Mugged") respect /= 0.75;

									respect = respect / attack.modifiers.groupAttack / attack.modifiers.overseas / attack.modifiers.chainBonus;
								}
							}

							attackHistory.history[enemyId][hasBaseRespect ? "respect_base" : "respect"].push(respect);
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

			await ttStorage.change({ attackHistory: { lastAttack, fetchData: false, history: { ...attackHistory.history } } });
		}
	}

	async function notifyEventMessages() {
		let eventCount = 0;
		if (settings.apiUsage.user.events) {
			let events = [];
			for (let key of Object.keys(userdata.events).reverse()) {
				const event = userdata.events[key];
				if (event.seen) break;

				if (settings.notifications.types.global && settings.notifications.types.events && !notifications.events[key]) {
					events.push({ id: key, event: event.event });
					notifications.events[key] = { skip: true };
				}

				eventCount++;
			}
			if (events.length) {
				let message = events.last().event.replace(/<\/?[^>]+(>|$)/g, "");
				if (events.length > 1) message += `\n(and ${events.length - 1} more event${events.length > 2 ? "s" : ""}`;

				notifications.events.combined = newNotification(`New Event${applyPlural(events.length)}`, message, LINKS.events);
			}
		}

		let messageCount = 0;
		if (settings.apiUsage.user.messages) {
			let messages = [];
			for (let key of Object.keys(userdata.messages).reverse()) {
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

		await setBadge("count", { events: eventCount, messages: messageCount });
	}

	async function notifyStatusChange() {
		if (!settings.notifications.types.global || !settings.notifications.types.status || !oldUserdata.status) return;

		const previous = oldUserdata.status.state;
		const current = userdata.status.state;

		if (current === previous || current === "Traveling" || current === "Abroad") return;

		if (current === "Okay") {
			if (previous === "Hospital") {
				await notifyUser("TornTools - Status", `You are out of the hospital.`, LINKS.home);
			} else if (previous === "Jail") {
				await notifyUser("TornTools - Status", `You are out of the jail.`, LINKS.home);
			}
		} else {
			await notifyUser("TornTools - Status", userdata.status.description, LINKS.home);
		}
	}

	async function notifyCooldownOver() {
		if (!settings.apiUsage.user.cooldowns || !settings.notifications.types.global || !settings.notifications.types.cooldowns || !oldUserdata.cooldowns)
			return;

		for (let type in userdata.cooldowns) {
			if (userdata.cooldowns[type] || !oldUserdata.cooldowns[type]) continue;

			await notifyUser("TornTools - Cooldown", `Your ${type} cooldown has ended.`, LINKS.items);
		}
	}

	async function notifyTravelLanding() {
		if (!settings.apiUsage.user.travel || !settings.notifications.types.global || !settings.notifications.types.traveling || !oldUserdata.travel) return;
		if (userdata.travel.time_left !== 0 || oldUserdata.travel.time_left === 0) return;

		await notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}.`, LINKS.home);
	}

	async function notifyEducation() {
		if (!settings.apiUsage.user.education || !settings.notifications.types.global || !settings.notifications.types.education || !oldUserdata.travel) return;
		if (userdata.education_timeleft !== 0 || oldUserdata.education_timeleft === 0) return;

		await notifyUser("TornTools - Education", `You have finished your education course.`, LINKS.education);
	}

	async function notifyNewDay() {
		if (!settings.notifications.types.global || !settings.notifications.types.newDay) return;

		const date = new Date();
		const utc = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
		if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || utc in notifications.newDay) return;

		notifications.newDay[utc] = newNotification(`New Day`, "It's a new day! Hopefully a sunny one.", LINKS.home);
	}

	async function notifyBars() {
		if (!settings.apiUsage.user.bars || !settings.notifications.types.global) return;

		for (let bar of ["energy", "happy", "nerve", "life"]) {
			if (!settings.notifications.types[bar].length || !oldUserdata[bar]) return;

			const checkpoints = settings.notifications.types[bar]
				.map((checkpoint) =>
					typeof checkpoint === "string" && checkpoint.includes("%") ? (parseInt(checkpoint) / 100) * userdata[bar].maximum : parseInt(checkpoint)
				)
				.sort((a, b) => b - a);

			for (let checkpoint of checkpoints) {
				if (oldUserdata[bar].current < userdata[bar].current && userdata[bar].current >= checkpoint && !notifications[bar][checkpoint]) {
					notifications[bar][checkpoint] = newNotification(
						`Bars`,
						`Your ${capitalizeText(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}.`,
						LINKS.home
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

		if (settings.notifications.types.chainTimer.length > 0 && userdata.chain.timeout !== 0 && userdata.chain.current >= 10) {
			const timeout = userdata.chain.timeout * 1000 - (now - userdata.timestamp * 1000); // ms
			const count = userdata.chain.current;

			for (let checkpoint of settings.notifications.types.chainTimer.sort((a, b) => a - b)) {
				const key = `${count}_${checkpoint}`;
				if (timeout > parseInt(checkpoint) * TO_MILLIS.SECONDS || notifications.chain[key]) continue;

				notifications.chain[key] = newNotification(
					`Chain`,
					`Chain timer will run out in ${formatTime({ milliseconds: timeout }, { type: "wordTimer" })}.`,
					LINKS.chain
				);
				break;
			}
		} else {
			notifications.chain = {};
		}

		if (settings.notifications.types.chainBonus.length > 0 && userdata.chain.timeout !== 0 && userdata.chain.current >= 10) {
			const count = userdata.chain.current;
			const nextBonus = getNextChainBonus(count);

			for (let checkpoint of settings.notifications.types.chainBonus.sort((a, b) => b - a)) {
				const key = `${nextBonus}_${checkpoint}`;

				if (nextBonus - count > parseInt(checkpoint) || notifications.chainCount[key]) continue;

				notifications.chainCount[key] = newNotification(
					`Chain`,
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

		if (settings.notifications.types.leavingHospital.length && userdata.status.state === "Hospital") {
			for (let checkpoint of settings.notifications.types.leavingHospital.sort((a, b) => a - b)) {
				let timeLeft = userdata.status.until * 1000 - now;

				if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications.hospital[checkpoint]) continue;

				notifications.hospital[checkpoint] = newNotification(
					`Hospital`,
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

		if (settings.notifications.types.landing.length && userdata.travel.time_left) {
			for (let checkpoint of settings.notifications.types.landing.sort((a, b) => a - b)) {
				let timeLeft = userdata.travel.timestamp * 1000 - now;

				if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications.travel[checkpoint]) continue;

				notifications.travel[checkpoint] = newNotification(
					`Travel`,
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
			{ name: "drug", title: "Drugs", setting: "cooldownDrug", memory: "drugs" },
			{ name: "booster", title: "Boosters", setting: "cooldownBooster", memory: "boosters" },
			{ name: "medical", title: "Medical", setting: "cooldownMedical", memory: "medical" },
		];

		for (let cooldown of COOLDOWNS) {
			if (settings.notifications.types[cooldown.setting].length && userdata.cooldowns[cooldown.name] > 0) {
				for (let checkpoint of settings.notifications.types[cooldown.setting].sort((a, b) => a - b)) {
					let timeLeft = userdata.cooldowns[cooldown.name] * 1000;

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

			let width;
			if (key === "travel") {
				let totalTrip = userdata[key].timestamp - userdata[key].departed;
				width = barWidth * ((totalTrip - userdata[key].time_left) / totalTrip);
			} else {
				width = barWidth * (userdata[key].current / userdata[key].maximum);
			}

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

	if (stakeouts.date && now - stakeouts.date + 100 < TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts) return { updated: false };

	let success = 0;
	let failed = 0;
	for (let id in stakeouts) {
		if (isNaN(id)) continue;

		let data;
		try {
			data = await fetchApi("torn", { section: "user", selections: ["profile"], id, silent: true });
			success++;
		} catch (e) {
			console.log("STAKEOUT error", e);
			failed++;
			continue;
		}

		if (stakeouts[id].alerts) {
			const { okay, hospital, landing, online, life } = stakeouts[id].alerts;
			const now = Date.now();

			if (okay) {
				const key = `${id}_okay`;
				if (data.status.state === "Okay" && !notifications.stakeouts[key]) {
					notifications.stakeouts[key] = newNotification("Stakeouts", `${data.name} is now okay.`, `https://www.torn.com/profiles.php?XID=${id}`);
				} else if (data.status.state !== "Okay") {
					delete notifications.stakeouts[key];
				}
			}
			if (hospital) {
				const key = `${id}_hospital`;
				if (data.status.state === "Hospital" && !notifications.stakeouts[key]) {
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
				if (data.last_action.status !== "Traveling" && !notifications.stakeouts[key]) {
					notifications.stakeouts[key] = newNotification(
						"Stakeouts",
						`${data.name} is now ${data.status.state === "abroad" ? data.status.description : "in Torn"}.`,
						`https://www.torn.com/profiles.php?XID=${id}`
					);
				} else if (data.last_action.status !== "Traveling") {
					delete notifications.stakeouts[key];
				}
			}
			if (online) {
				const key = `${id}_online`;
				if (data.last_action.status === "Online" && !notifications.stakeouts[key]) {
					notifications.stakeouts[key] = newNotification("Stakeouts", `${data.name} is now online.`, `https://www.torn.com/profiles.php?XID=${id}`);
				} else if (data.last_action.status !== "Online") {
					delete notifications.stakeouts[key];
				}
			}
			if (life) {
				const key = `${id}_life`;
				if (data.life.current <= data.life.maximum * (life / 100) && !notifications.stakeouts[key]) {
					notifications.stakeouts[key] = newNotification(
						"Stakeouts",
						`${data.name}'${data.name.endsWith("s") ? "" : "s"} life has dropped below ${life}%.`,
						`https://www.torn.com/profiles.php?XID=${id}`
					);
				} else if (data.life.current > data.life.maximum * (life / 100)) {
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
		};
	}
	stakeouts.date = now;

	await ttStorage.change({ stakeouts });
	return { updated: true, success, failed };
}

async function updateTorndata() {
	const oldTorndata = { ...torndata };
	torndata = await fetchApi("torn", { section: "torn", selections: ["education", "honors", "items", "medals", "pawnshop"] });
	torndata.date = Date.now();

	torndata.stocks = oldTorndata.stocks;

	await ttStorage.set({ torndata });
}

async function updateStocks() {
	const oldStocks = { ...torndata.stocks };
	let stocks = (await fetchApi("torn", { section: "torn", selections: ["stocks"] })).stocks;
	stocks.date = Date.now();

	await ttStorage.change({ torndata: { stocks } });

	if (oldStocks) {
		for (let id in settings.notifications.types.stocks) {
			const alerts = settings.notifications.types.stocks[id];

			if (alerts.priceFalls && oldStocks[id].current_price > alerts.priceFalls && stocks[id].current_price <= alerts.priceFalls) {
				await notifyUser(
					"TornTools - Stock Alerts",
					`(${stocks[id].acronym}) ${stocks[id].name} has fallen to $${formatNumber(stocks[id].current_price)} (alert: $${formatNumber(
						alerts.priceFalls
					)})!`,
					LINKS.stocks
				);
			} else if (alerts.priceReaches && oldStocks[id].current_price < alerts.priceFalls && stocks[id].current_price >= alerts.priceReaches) {
				await notifyUser(
					"TornTools - Stock Alerts",
					`(${stocks[id].acronym}) ${stocks[id].name} has reached $${formatNumber(stocks[id].current_price)} (alert: $${formatNumber(
						alerts.priceReaches
					)})!`,
					LINKS.stocks
				);
			} else if (alerts.systemDumps && oldStocks[id].total_shares < stocks[id].total_shares) {
				await notifyUser("TornTools - Stock Alerts", `(${stocks[id].acronym}) ${stocks[id].name} has dumped new shares!`, LINKS.stocks);
			}
		}
	}
}

async function updateNetworth() {
	if (!settings.apiUsage.user.networth) return;

	let networth = (await fetchApi("torn", { section: "user", selections: ["networth"] })).networth;
	networth.date = Date.now();

	await ttStorage.change({ userdata: { networth } });
	console.log("Updated networth data.");
}

async function updateFactiondata() {
	if (!userdata || !userdata.faction.faction_id) {
		factiondata = {};
	} else {
		factiondata = await fetchApi("torn", { section: "faction", selections: ["crimes"], silent: true, succeedOnError: true });
		delete factiondata.error;
	}

	factiondata.date = Date.now();

	if (factiondata.crimes) {
		factiondata.userCrime = -1;

		for (let id of Object.keys(factiondata.crimes).reverse()) {
			const crime = factiondata.crimes[id];

			if (crime.initiated || !crime.participants.map((value) => parseInt(Object.keys(value)[0])).includes(userdata.player_id)) continue;

			factiondata.userCrime = crime.time_ready * 1000;
		}
	}

	await ttStorage.set({ factiondata });
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
	const options = {
		icon: "resources/images/icon_128.png",
		body: message,
		requireInteraction: settings.notifications.requireInteraction,
	};
	if (notificationSound !== "default" && hasSilentSupport()) options.silent = true;

	await setupSoundPlayer();

	let notification = new Notification(title, options);

	if (notificationSound !== "default" && notificationSound !== "mute")
		notification.onshow = () => {
			notificationPlayer.play();
		};

	if (settings.notifications.link)
		notification.onclick = () => {
			if (settings.notifications.searchOpenTab) {
				chrome.tabs.query({ url: "https://www.torn.com/index.php" }, (result) => {
					if (result.length) {
						const tab = result[0];

						chrome.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
					} else {
						chrome.tabs.create({ url });
					}
				});
			} else {
				chrome.tabs.create({ url });
			}
		};

	if (settings.notifications.tts) {
		const ttsTitle = new SpeechSynthesisUtterance(title);
		const ttsMessage = new SpeechSynthesisUtterance(message);
		ttsTitle.volume = settings.notifications.volume / 100;
		ttsMessage.volume = settings.notifications.volume / 100;
		window.speechSynthesis.speak(ttsTitle);
		window.speechSynthesis.speak(ttsMessage);
	}

	function hasSilentSupport() {
		return !usingFirefox() && (!navigator.userAgent.includes("Mobile Safari") || usingYandex());
	}

	async function setupSoundPlayer() {
		if (notificationSound !== settings.notifications.sound) {
			let sound = await getNotificationSound(settings.notifications.sound);

			if (sound && sound !== "mute") {
				// noinspection JSValidateTypes
				notificationPlayer.src = sound;
			}

			notificationSound = settings.notifications.sound;
		}
		notificationPlayer.volume = settings.notifications.volume / 100;
	}
}

// noinspection JSDeprecatedSymbols
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
				// noinspection JSValidateTypes
				notificationTestPlayer.src = sound;
				// noinspection JSIgnoredPromiseFromCall
				notificationTestPlayer.play();
			});
			sendResponse({ success: true });
			break;
		case "stop-notification-sound":
			notificationTestPlayer.pause();
			break;

		case "updateData":
			switch (message.type) {
				case "networth":
					updateNetworth().then(() => {});
					sendResponse({ success: true });
					break;
				default:
					sendResponse({ success: false, message: "Unknown data type." });
					break;
			}
			break;
		default:
			sendResponse({ success: false, message: "Unknown action." });
			break;
	}
});

// noinspection JSDeprecatedSymbols
chrome.notifications.onClicked.addListener((id) => {
	if (settings.notifications.link) {
		chrome.tabs.create({ url: notificationRelations[id] });
	}
});
