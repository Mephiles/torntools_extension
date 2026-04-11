import { registerService } from "@webext-core/proxy-service";
import type { Browser } from "wxt/browser";
import { notificationRelations, sendNotifications } from "@/entrypoints/background/notifications";
import { showIconBars, timedUpdates } from "@/entrypoints/background/updates";
import { ttCache } from "@/utils/common/data/cache";
import {
	type Database,
	initializeDatabase,
	loadDatabase,
	migrateDatabase,
	type RecursivePartial,
	storageListeners,
	version,
	type Writable,
} from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { ttUsage } from "@/utils/common/data/usage";
import { exposeDebugObjects } from "@/utils/common/functions/pages-debug";
import { BackgroundService } from "@/utils/services/BackgroundService";
import { BACKGROUND_SERVICE_KEY, SOURCE_SERVICE_KEY } from "@/utils/services/proxy-service-keys";
import { SourceService } from "@/utils/services/SourceService";

type Alarm = Browser.alarms.Alarm;

function onInitialisation() {
	browser.alarms.getAll().then((currentAlarms) => {
		if (currentAlarms.length === 4) return;

		void resetAlarms();
	});
}

async function onInstall() {
	await migrateDatabase(true);
	initializeDatabase();
	void checkUpdate();

	void resetAlarms();

	// These are refresh tasks, not clearing.
	clearUsage();
	clearCache();

	// Initial call
	timedUpdates();

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
	clearUsage();
	clearCache();

	// Initial call
	timedUpdates();

	void showIconBars();
	storageListeners.settings.push(showIconBars);
}

const ALARM_NAMES = {
	CLEAR_CACHE: "clear-cache-alarm",
	CLEAR_USAGE: "clear-usage-alarm",
	DATA_UPDATE_AND_NOTIFICATIONS: "data-update-and-notifications-alarm",
	NOTIFICATIONS: "notifications-alarm",
} as const;

async function onAlarm(alarm: Alarm) {
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
			throw new Error(`Undefined alarm name: ${alarm.name}`);
	}
}

function clearCache() {
	ttCache.refresh().catch((error) => console.error("Error while clearing cache.", error));
}

function clearUsage() {
	ttUsage.refresh().catch((error) => console.error("Error while clearing API usage data.", error));
}

export async function resetAlarms() {
	await browser.alarms.clearAll();

	void browser.alarms.create(ALARM_NAMES.CLEAR_CACHE, { periodInMinutes: 60 });
	void browser.alarms.create(ALARM_NAMES.CLEAR_USAGE, { periodInMinutes: 60 * 24 });
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
	browser.runtime.onUpdateAvailable.addListener(() => browser.runtime.reload());

	registerService(BACKGROUND_SERVICE_KEY, new BackgroundService());
	registerService(SOURCE_SERVICE_KEY, new SourceService());

	if ("connection" in navigator) {
		// @ts-expect-error Not part of the standard, only available on Chromium-based browsers.
		navigator.connection.addEventListener("change", () => {
			if (navigator.onLine) timedUpdates();
		});
	} else if (typeof window !== "undefined") {
		window.addEventListener("online", timedUpdates);
	} else {
		self.addEventListener("online", timedUpdates);
	}
	exposeDebugObjects();
	console.log("Background script loaded");
});
