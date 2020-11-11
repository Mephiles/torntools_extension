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
};

(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();

	registerUpdaters();

	storageListeners.settings.push(() => {
		showIconBars();
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
			.then(({ updateBasic }) => console.log(`Updated essential${updateBasic ? "+basic" : ""} userdata.`))
			.catch((error) => console.error("Error while updating essential userdata.", error));

		if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
			// Update once every torn day.
			updateTorndata()
				.then(() => console.log("Updated torndata."))
				.catch((error) => console.error("Error while updating torndata.", error));
		}
	}

	// TODO - Update basic userdata.
	// TODO - Update npc times.
	// TODO - Update networth data.
	// TODO - Update stocks data.
	// TODO - Update OC data.
}

async function updateUserdata() {
	const now = Date.now();

	let updateBasic = !userdata.dateBasic || now - userdata.dateBasic >= TO_MILLIS.MINUTES * 2;

	let selections = ["profile", "bars", "cooldowns", "timestamp", "travel", "events", "messages", "money"];
	if (updateBasic) {
		selections = selections.concat("personalstats");

		if (!userdata.education || !userdata.education_completed || userdata.education_completed.length !== Object.keys(torndata.education).length)
			selections.push("education");
	}

	const oldUserdata = { ...userdata };
	userdata = await fetchApi("torn", { section: "user", selections });
	userdata.date = now;
	userdata.dateBasic = updateBasic ? now : oldUserdata.dateBasic;

	await ttStorage.set({ userdata });

	let data = {
		fetchAttacks: !oldUserdata || oldUserdata.energy.current - userdata.energy.current >= 25,
	};

	showIconBars();
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

	return { updateBasic };

	async function notifyEventMessages() {
		let eventCount = 0;
		let events = [];
		for (let key of Object.keys(userdata.events).reverse()) {
			const event = userdata.events[key];
			if (event.seen) break;

			if (settings.notifications.types.global && settings.notifications.types.events && !notifications.events[key]) {
				if (
					(event.event.includes("attacked") ||
						event.event.includes("mugged") ||
						event.event.includes("arrested") ||
						event.event.includes("hospitalized")) &&
					!event.event.includes("Someone")
				) {
					data.fetchAttacks = true;
				}

				events.push({ id: key, event: event.event });
				notifications.events[key] = { skip: true };
			}

			eventCount++;
		}
		if (events.length) {
			let message = events.last().event.replace(/<\/?[^>]+(>|$)/g, "");
			if (events.length > 1) message += `\n(and ${events.length - 1} more event${events.length > 2 ? "s" : ""}`;

			notifications.events.combined = {
				title: `TornTools - New Event${events.length > 1 ? "s" : ""}`,
				message,
				url: LINKS.events,
				date: now,
			};
		}

		let messageCount = 0;
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

			notifications.messages.combined = {
				title: `TornTools - New Message${messages.length > 1 ? "s" : ""}`,
				message,
				url: LINKS.messages,
				date: now,
			};
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
		if (!settings.notifications.types.global || !settings.notifications.types.cooldowns || !oldUserdata.cooldowns) return;

		for (let type in userdata.cooldowns) {
			if (userdata.cooldowns[type] || !oldUserdata.cooldowns[type]) continue;

			await notifyUser("TornTools - Cooldown", `Your ${type} cooldown has ended.`, LINKS.items);
		}
	}

	async function notifyTravelLanding() {
		if (!settings.notifications.types.global || !settings.notifications.types.traveling || !oldUserdata.travel) return;
		if (userdata.travel.time_left !== 0 || oldUserdata.travel.time_left === 0) return;

		await notifyUser("TornTools - Traveling", `You have landed in ${userdata.travel.destination}.`, LINKS.home);
	}

	async function notifyEducation() {
		if (!settings.notifications.types.global || !settings.notifications.types.education || !oldUserdata.travel) return;
		if (userdata.education_timeleft !== 0 || oldUserdata.education_timeleft === 0) return;

		await notifyUser("TornTools - Education", `You have finished your education course.`, LINKS.education);
	}

	async function notifyNewDay() {
		if (!settings.notifications.types.global || !settings.notifications.types.newDay) return;

		const date = new Date();
		const utc = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
		if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || utc in notifications.newDay) return;

		notifications.newDay[utc] = {
			title: "TornTools - New Day",
			message: "It's a new day! Hopefully a sunny one.",
			url: LINKS.home,
			date: now,
		};
	}

	async function notifyBars() {
		if (!settings.notifications.types.global) return;

		for (let bar of ["energy", "happy", "nerve", "life"]) {
			if (!settings.notifications.types[bar].length || !oldUserdata[bar]) return;

			const checkpoints = settings.notifications.types[bar]
				.map((checkpoint) =>
					typeof checkpoint === "string" && checkpoint.includes("%") ? (parseInt(checkpoint) / 100) * userdata[bar].maximum : parseInt(checkpoint)
				)
				.sort((a, b) => b - a);

			for (let checkpoint of checkpoints) {
				if (oldUserdata[bar].current < userdata[bar].current && userdata[bar].current >= checkpoint && !notifications[bar][checkpoint]) {
					notifications[bar][checkpoint] = {
						title: "TornTools - Bars",
						message: `Your ${capitalizeText(bar)} bar has reached ${userdata[bar].current}/${userdata[bar].maximum}.`,
						url: LINKS.home,
						date: now,
					};
					break;
				} else if (userdata[bar].current < checkpoint && notifications[bar][checkpoint]) {
					delete notifications[bar][checkpoint];
				}
			}
		}
	}

	async function notifyChain() {
		// TODO - Notify chains.
	}

	async function notifyHospital() {
		// TODO - Notify hospital.
	}

	async function notifyTraveling() {
		if (!settings.notifications.types.global) return;

		if (settings.notifications.types.landing.length && userdata.travel.time_left) {
			for (let checkpoint of settings.notifications.types.landing.sort((a, b) => a - b)) {
				let timeLeft = userdata.travel.timestamp * 1000 - now;

				if (timeLeft <= parseFloat(checkpoint) * TO_MILLIS.MINUTES && !notifications.travel[checkpoint]) {
					const minutes = Math.floor(timeLeft / 1000 / 60);
					const seconds = (timeLeft / 1000) % 60;

					notifications.travel[checkpoint] = {
						checkpoint: checkpoint,
						title: "TornTools - Travel",
						message: `You will be Landing in ${minutes} minute${applyPlural(minutes)} ${seconds.toFixed(0)} second${applyPlural(seconds)}`,
						url: LINKS.home,
						date: now,
					};
					break;
				}
			}
		} else {
			notifications.travel = {};
		}
	}

	async function notifySpecificCooldowns() {
		// TODO - Notify for specific cooldowns.
	}
}

function showIconBars() {
	if (!settings.pages.icon.global) {
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

async function updateTorndata() {
	torndata = await fetchApi("torn", { section: "torn", selections: ["education", "honors", "items", "medals", "pawnshop"] });
	torndata.date = Date.now();

	await ttStorage.set({ torndata });
}

async function notifyUser(title, message, url) {
	const options = {
		type: "basic",
		iconUrl: "resources/images/icon_128.png",
		title,
		message,
	};

	if (notificationSound !== settings.notifications.sound) {
		let sound = await getNotificationSound(settings.notifications.sound);

		if (sound && sound !== "mute") {
			// noinspection JSValidateTypes
			notificationPlayer.src = sound;
		}

		notificationSound = settings.notifications.sound;
	}
	notificationPlayer.volume = settings.notifications.volume / 100;

	if (notificationSound !== "default" && hasSilentSupport()) options.silent = true;

	chrome.notifications.create(options, (id) => {
		notificationRelations[id] = url;
		console.log("Notified!", options);

		if (notificationSound !== "default" && notificationSound !== "mute") notificationPlayer.play();
	});

	if (settings.notifications.tts) {
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(title));
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
	}

	function hasSilentSupport() {
		return !usingFirefox() && (!navigator.userAgent.includes("Mobile Safari") || usingYandex());
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
			break;
		case "stop-notification-sound":
			notificationTestPlayer.pause();
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
