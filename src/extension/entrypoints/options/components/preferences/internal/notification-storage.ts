import { ttStorage } from "@common/utils/context";
import type { DatabaseSettings } from "@common/utils/data/database";

export type NotificationSettings = DatabaseSettings["notifications"];
export type NotificationTypes = NotificationSettings["types"];
export type NotificationTypeKey = keyof NotificationTypes;
export type NotificationListValue = (number | string)[];

export async function updateNotification<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
	await ttStorage.change({ settings: { notifications: { [key]: value } } });
}

export async function updateNotificationType<K extends NotificationTypeKey>(key: K, value: NotificationTypes[K]) {
	await ttStorage.change({ settings: { notifications: { types: { [key]: value } } } });
}

export function parseNotificationList(value: string): NotificationListValue {
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => (parseFloat(entry).toString() === entry ? parseFloat(entry) : entry));
}

export function formatNotificationList(value: readonly (number | string)[]) {
	return value.join(",");
}
