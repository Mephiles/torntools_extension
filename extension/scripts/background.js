const notificationPlayer = getAudioPlayer();
const notificationTestPlayer = getAudioPlayer();

let notificationSound = null;
let notificationRelations = {};

(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();

	registerUpdaters();
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

	setInterval(timedUpdates, 30 * TO_MILLIS.SECONDS);
}

function timedUpdates() {
	if (api.torn.key) {
		updateUserdata()
			.then(() => console.log("Updated essential userdata."))
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
	userdata = await fetchApi("torn", { section: "user", selections: ["profile", "bars", "cooldowns", "timestamp", "travel"] });

	await ttStorage.set({ userdata });
}

async function updateTorndata() {
	torndata = await fetchApi("torn", { section: "torn", selections: ["education", "honors", "items", "medals", "pawnshop"] });
	torndata.date = new Date().getTime();

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

chrome.notifications.onClicked.addListener((id) => {
	if (settings.notifications.link) {
		chrome.tabs.create({ url: notificationRelations[id] });
	}
});
