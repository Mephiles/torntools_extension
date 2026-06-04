import { ttCache } from "@common/utils/data/cache";
import {
	type Database,
	initializeDatabase,
	loadDatabase,
	migrateDatabase,
	type RecursivePartial,
	storageListeners,
	version,
	type Writable,
} from "@common/utils/data/database";
import { ttStorage } from "@common/utils/data/storage";
import { exposeDebugObjects } from "@common/utils/functions/pages-debug";
import { BackgroundService } from "@common/utils/services/BackgroundService";
import { BACKGROUND_SERVICE_KEY, SOURCE_SERVICE_KEY } from "@common/utils/services/proxy-service-keys";
import { SourceService } from "@common/utils/services/SourceService";
import { notificationRelations, sendNotifications } from "@extension/entrypoints/background/notifications";
import { showIconBars, timedUpdates } from "@extension/entrypoints/background/updates";
import { registerService } from "@webext-core/proxy-service";
import type { Browser } from "wxt/browser";

type Alarm = Browser.alarms.Alarm;

function onInitialisation() {
	browser.alarms.getAll().then((currentAlarms) => {
		if (currentAlarms.length === Object.keys(ALARM_NAMES).length) return;

		void resetAlarms();
	});
}

async function onInstall() {
	await migrateDatabase(true);
	initializeDatabase();
	void checkUpdate();

	void resetAlarms();

	// These are refresh tasks, not clearing.
	clearCache();

	// Initial call
	await timedUpdates();

	void showIconBars();
	storageListeners.settings.push(showIconBars);
}

async function checkUpdate() {
	const oldVersion = version.oldVersion;
	const newVersion = browser.runtime.getManifest().version;

	const change: RecursivePartial<Writable<Database>> = { version: { oldVersion: newVersion } };
	if (oldVersion !== newVersion) {
		console.log("New version detected!", newVersion);
		change.version.showNotice = true;
	}

	await ttStorage.change(change);
}

async function onStartup() {
	await migrateDatabase(false);
	initializeDatabase();
	void checkUpdate();

	// These are refresh tasks, not clearing.
	clearCache();

	// Initial call
	await timedUpdates();

	void showIconBars();
	storageListeners.settings.push(showIconBars);
}

const ALARM_NAMES = {
	CLEAR_CACHE: "clear-cache-alarm",
	DATA_UPDATE_AND_NOTIFICATIONS: "data-update-and-notifications-alarm",
	NOTIFICATIONS: "notifications-alarm",
} as const;

async function onAlarm(alarm: Alarm) {
	await loadDatabase();

	switch (alarm.name) {
		case ALARM_NAMES.CLEAR_CACHE:
			clearCache();
			break;
		case ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS:
			await timedUpdates();
			await sendNotifications();
			break;
		case ALARM_NAMES.NOTIFICATIONS:
			await sendNotifications();
			break;
		default:
			throw new Error(`Undefined alarm name: ${alarm.name}`);
	}
}

function clearCache() {
	ttCache.refresh().catch((error) => console.error("Error while clearing cache.", error));
}

export async function resetAlarms() {
	await browser.alarms.clearAll();

	void browser.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
	void browser.alarms.create(ALARM_NAMES.DATA_UPDATE_AND_NOTIFICATIONS, { periodInMinutes: 0.52 });
	void browser.alarms.create(ALARM_NAMES.NOTIFICATIONS, { periodInMinutes: 0.08 });
}

function onNotificationClicked(id: string) {
	if (id in notificationRelations) {
		void browser.tabs.create({ url: notificationRelations[id] });
	}
}

// noinspection JSUnusedGlobalSymbols
export default defineBackground(() => {
	onInitialisation();
	browser.runtime.onInstalled.addListener(onInstall);
	browser.runtime.onStartup.addListener(onStartup);
	browser.alarms.onAlarm.addListener(onAlarm);
	browser.notifications.onClicked.addListener(onNotificationClicked);

	const backgroundService = new BackgroundService();
	registerService(BACKGROUND_SERVICE_KEY, backgroundService);
	registerService(SOURCE_SERVICE_KEY, new SourceService());

	if ("connection" in navigator) {
		// @ts-expect-error Not part of the standard, only available on Chromium-based browsers.
		navigator.connection.addEventListener("change", async () => {
			if (navigator.onLine) await timedUpdates();
		});
	} else if (typeof window !== "undefined") {
		window.addEventListener("online", timedUpdates);
	} else {
		self.addEventListener("online", timedUpdates);
	}
	exposeDebugObjects(backgroundService);
	console.log("Background script loaded");
});
