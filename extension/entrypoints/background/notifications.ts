import type { OffscreenMessage } from "@/entrypoints/offscreen/offscreen";
import { notificationHistory, notifications, setNotificationHistory, settings } from "@/utils/common/data/database";
import type { TTNotification } from "@/utils/common/data/default-database";
import { ttStorage } from "@/utils/common/data/storage";
import { hasInteractionSupport, hasSilentSupport } from "@/utils/common/functions/browser";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

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

		await browser.runtime.sendMessage({
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

let creatingOffscreen: Promise<void> | null = null;

async function setupAudioPlayerDocument() {
	const existingContexts = await browser.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
	if (existingContexts.length > 0) return;

	if (!creatingOffscreen) {
		creatingOffscreen = browser.offscreen.createDocument({
			url: "/offscreen.html",
			reasons: ["AUDIO_PLAYBACK"],
			justification: "To play notification alert sound and TTS.",
		});

		await creatingOffscreen;
		creatingOffscreen = null;
	} else {
		await creatingOffscreen;
	}
}

const notificationPlayer = new AudioPlayer();
export const notificationTestPlayer = new AudioPlayer();

let notificationSound: string | undefined, notificationWorker: ServiceWorkerRegistration | undefined;
export const notificationRelations: { [id: string]: string } = {};

export async function sendNotifications() {
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

export async function notifyUser(title: string, message: string, url?: string) {
	await setupSoundPlayer();

	const icon = browser.runtime.getURL("/images/icon_128.png");
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
		const id = await browser.notifications.create(options);

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
			if (settings.notifications.ttsVoice !== "default") {
				const matchedVoice = window.speechSynthesis.getVoices().find(({ name, lang }) => `${name} (${lang})` === settings.notifications.ttsVoice);

				if (matchedVoice) ttsMessage.voice = matchedVoice;
			}
			window.speechSynthesis.speak(ttsMessage);
		} else {
			// Offscreen documents
			await setupAudioPlayerDocument();

			await browser.runtime.sendMessage({
				offscreen: "tts",
				text: text,
				volume: settings.notifications.volume / 100,
				voice: settings.notifications.ttsVoice,
			} satisfies OffscreenMessage);
		}
	}
}

export async function storeNotification(notification: TTNotification) {
	if ("combined" in notification) {
		console.warn("Trying to save a combined notification.", notification);
		return;
	}
	if (!notification.title || !notification.message || !notification.date) {
		console.warn("Trying to save a notification without title, message or date.", notification);
		return;
	}

	notificationHistory.splice(0, 0, notification);
	setNotificationHistory(notificationHistory.slice(0, 100));

	await ttStorage.set({ notificationHistory });
}

export function getNotificationSound(type: string, allowDefault = false) {
	switch (type) {
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
			return browser.runtime.getURL(`/audio/notification${type}.wav`);
		case "custom":
			return settings.notifications.soundCustom;
		default:
			return allowDefault ? getNotificationSound("1") : false;
	}
}

export function newNotification(title: string, message: string, link?: string): TTNotification {
	return {
		title: `TornTools - ${title}`,
		message,
		url: link,
		date: Date.now(),
	};
}
