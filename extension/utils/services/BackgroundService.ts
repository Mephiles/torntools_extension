import { timedUpdates, updateFactiondata, updateStocks, updateTorndata, updateUserdata } from "@/entrypoints/background/updates";
import { getNotificationSound, notificationTestPlayer, notifyUser } from "@/entrypoints/background/notifications";
import { fetchData, type FetchLocation, type FetchOptions } from "@/utils/common/functions/api";
import { ttCache } from "@/utils/common/data/cache";
import { resetAlarms } from "@/entrypoints/background";
import { type Browser } from "@wxt-dev/browser";

type Alarm = Browser.alarms.Alarm;

type ActionResponse = { success: true } | { success: false; error: any } | { success: false; message: string };

export class BackgroundService {
	initialize(): ActionResponse {
		timedUpdates();
		return { success: true };
	}

	playNotificationSound(s: string, volume: number, allowDefault?: boolean) {
		const sound = getNotificationSound(s, allowDefault ?? true);
		if (sound) {
			notificationTestPlayer.volume = volume / 100;
			notificationTestPlayer.src = sound;
			void notificationTestPlayer.play();
		}
	}

	stopNotificationSound() {
		void notificationTestPlayer.pause();
	}

	notification(title: string, message: string, url?: string): Promise<ActionResponse> {
		return new Promise<ActionResponse>((resolve) => {
			notifyUser(title, message, url)
				.then(() => resolve({ success: true }))
				.catch((error) => resolve({ success: false, error }));
		});
	}

	fetchRelay<R = any>(location: FetchLocation, options: Partial<FetchOptions> = {}): Promise<R> {
		return fetchData<R>(location, options);
	}

	async forceUpdate(update: "torndata" | "stocks" | "factiondata" | "userdata"): Promise<ActionResponse> {
		let updateFunction: (forceUpdate?: boolean) => Promise<void> | ReturnType<typeof updateUserdata>;

		if (update === "torndata") updateFunction = updateTorndata;
		else if (update === "stocks") updateFunction = updateStocks;
		else if (update === "factiondata") updateFunction = updateFactiondata;
		else if (update === "userdata") updateFunction = updateUserdata;
		else {
			return { success: false, message: "Unknown update type." };
		}

		await updateFunction(true);
		return { success: true };
	}

	async reinitializeTimers(): Promise<Alarm[]> {
		await resetAlarms();
		return browser.alarms.getAll();
	}

	clearCache(): ActionResponse {
		ttCache.clear();
		return { success: true };
	}
}
