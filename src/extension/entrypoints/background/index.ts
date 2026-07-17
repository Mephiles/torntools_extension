import { ttStorage } from "@common/utils/context";
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
import { exposeDebugObjects } from "@common/utils/functions/pages-debug";
import { cleanupNotifications, initializeBackoff, type NotificationRelation } from "@extension/entrypoints/background/notifications";
import { timedUpdates } from "@extension/entrypoints/background/updates/";
import { showIconBars } from "@extension/entrypoints/background/updates/icon-bars";
import { registerExtensionContext } from "@extension/runtime/extension-context";
import { BACKGROUND_SERVICE_KEY, SOURCE_SERVICE_KEY } from "@extension/services/proxy-service-keys";
import { SourceService } from "@extension/services/SourceService";
import { registerService } from "@webext-core/proxy-service";
import { type Browser, browser } from "wxt/browser";
import { BackgroundService } from "@/services/BackgroundService";

type Alarm = Browser.alarms.Alarm;

let iconBarListenerRegistered = false;

function onInitialisation() {
	registerExtensionContext();
	browser.alarms.getAll().then((currentAlarms) => {
		if (currentAlarms.length === Object.keys(ALARM_NAMES).length) return;

		void resetAlarms();
	});
}

function registerShowIconBarsListener() {
	if (iconBarListenerRegistered) return;
	iconBarListenerRegistered = true;
	storageListeners.settings.push(showIconBars);
}

async function onInstall() {
	await migrateDatabase(true);
	initializeDatabase();
	void checkUpdate();

	initializeBackoff();
	void resetAlarms();

	// These are refresh tasks, not clearing.
	clearCache();

	// Initial call
	await timedUpdates();

	void showIconBars();
	registerShowIconBarsListener();
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

	initializeBackoff();

	// These are refresh tasks, not clearing.
	clearCache();

	// Initial call
	await timedUpdates();

	void showIconBars();
	registerShowIconBarsListener();
}

const ALARM_NAMES = {
	CLEAR_CACHE: "clear-cache-alarm",
	DATA_UPDATE: "data-update-alarm",
	CLEANUP_NOTIFICATIONS: "CLEANUP_NOTIFICATIONS-ALARM",
} as const;

async function onAlarm(alarm: Alarm) {
	await loadDatabase(true);

	switch (alarm.name) {
		case ALARM_NAMES.CLEAR_CACHE:
			clearCache();
			break;
		case ALARM_NAMES.CLEANUP_NOTIFICATIONS:
			await cleanupNotifications();
			break;
		case ALARM_NAMES.DATA_UPDATE:
			await timedUpdates();
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
	void browser.alarms.create(ALARM_NAMES.DATA_UPDATE, { periodInMinutes: 0.5 });
	void browser.alarms.create(ALARM_NAMES.CLEANUP_NOTIFICATIONS, { periodInMinutes: 60 });
}

function onNotificationClicked(id: string) {
	const relation = ttCache.get<NotificationRelation>("notification-relations", id);
	if (!relation?.link) return;

	void browser.tabs.create({ url: relation.link });
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
