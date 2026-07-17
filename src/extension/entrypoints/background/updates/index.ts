import { ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { api, factiondata, initializeDatabase, stockdata, torndata } from "@common/utils/data/database";
import { isTornApiError } from "@common/utils/functions/api";
import { CUSTOM_API_ERROR } from "@common/utils/functions/api-fetcher";
import { hasTimePassed, isSameUTCDay, TO_MILLIS } from "@common/utils/functions/utilities";
import { updateFactionStakeouts } from "@extension/entrypoints/background/updates/faction-stakeouts";
import { updateFactiondata } from "@extension/entrypoints/background/updates/factiondata";
import { updateNPCs } from "@extension/entrypoints/background/updates/npcs";
import { updateStakeouts } from "@extension/entrypoints/background/updates/stakeouts";
import { updateStocks } from "@extension/entrypoints/background/updates/stockdata";
import { updateTorndata } from "@extension/entrypoints/background/updates/torndata";
import { updateUserdata } from "@extension/entrypoints/background/updates/userdata";

let lockTimedUpdates = false;

export async function timedUpdates() {
	if (lockTimedUpdates) return;

	lockTimedUpdates = true;

	const updatePromises: Promise<unknown>[] = [];
	try {
		await initializeDatabase();

		if (api.torn.key) {
			updatePromises.push(
				updateUserdata()
					.then(({ updated, types, selections }) => {
						if (updated) console.log(`Updated ${types.join("+")} userdata.`, selections);
						else console.log("Skipped this userdata update.");
					})
					.catch((error) => logError("updating userdata", error)),
			);

			updatePromises.push(
				updateStakeouts()
					.then(({ updated, success, failed }) => {
						if (updated) {
							if (success || failed) console.log("Updated stakeouts.", { success, failed });
							else console.log("No stakeouts to update.");
						} else console.log("Skipped this stakeout update.");
					})
					.catch((error) => logError("updating stakeouts", error)),
			);

			updatePromises.push(
				updateFactionStakeouts()
					.then(({ updated, success, failed }) => {
						if (updated) {
							if (success || failed) console.log("Updated faction stakeouts.", { success, failed });
							else console.log("No faction stakeouts to update.");
						} else console.log("Skipped this faction stakeout update.");
					})
					.catch((error) => logError("updating faction stakeouts", error)),
			);

			if (
				!torndata ||
				!isSameUTCDay(new Date(torndata.date), new Date()) ||
				(hasOutdatedTornStats() && hasTimePassed(torndata.date, TO_MILLIS.MINUTES * 10))
			) {
				// Update once every torn day.
				updatePromises.push(
					updateTorndata()
						.then(() => console.log("Updated torndata."))
						.catch((error) => logError("updating torndata", error)),
				);
			}

			if (!stockdata?.date || hasTimePassed(stockdata.date, TO_MILLIS.MINUTES * 5)) {
				updatePromises.push(
					updateStocks()
						.then(() => console.log("Updated stocks."))
						.catch((error) => logError("updating stocks", error)),
				);
			}

			if (!factiondata || !("date" in factiondata) || hasTimePassed(factiondata.date, TO_MILLIS.MINUTES * 15))
				updatePromises.push(
					updateFactiondata()
						.then(() => console.log("Updated factiondata."))
						.catch((error) => logError("updating factiondata", error)),
				);
		}

		updatePromises.push(
			updateNPCs()
				.then(({ updated, alerts }) => {
					if (updated) console.log("Updated npcs.");
					if (alerts) console.log(`Sent out ${alerts} npc alerts.`);
				})
				.catch((error) => logError("updating npcs", error)),
		);

		updatePromises.push(verifyTime().catch((error) => logError("Failed to verify your time to be synced.", error)));

		await Promise.all(updatePromises);
	} finally {
		lockTimedUpdates = false;
	}

	function logError(message: any, error: any) {
		if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
			console.warn(`You disabled our permission to call the API!`);
		} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK) {
			console.warn(`Error due to no internet while ${message}.`);
		} else if (error.code === CUSTOM_API_ERROR.CANCELLED) {
			console.warn(`Error due to requests taking too long while ${message}.`);
		} else if (isTornApiError(error)) {
			if (error.code === 9) {
				console.log(`Torn's API is temporary disabled while ${message}.`);
			} else if (error.code === 17) {
				console.log(`Torn's API is having backend issues while ${message}.`);
			} else {
				console.error(`Error while ${message}.`, error);
			}
		} else {
			console.error(`Error while ${message}.`, error);
		}
	}
}

async function verifyTime() {
	const savedTime = await ttStorage.get("time");

	const now = Date.now();
	if (savedTime != null && savedTime > Date.now()) {
		console.warn("Detected a desynchronized time! Resetting timed data.");
		await ttCache.clear();
		await Promise.all([updateUserdata(true), updateFactiondata(), updateTorndata(), updateStocks(), updateStakeouts(true), updateFactionStakeouts(true)]);
	}

	await ttStorage.set({ time: now });
}

function hasOutdatedTornStats(): boolean {
	const alteredStatsTimestamp = torndata.stats.timestamp * 1000 + TO_MILLIS.DAYS;

	return !isSameUTCDay(alteredStatsTimestamp, torndata.date) && torndata.date > alteredStatsTimestamp;
}
