import { ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { api, factiondata, initializeDatabase, stockdata, torndata } from "@common/utils/data/database";
import { isTornApiError } from "@common/utils/functions/api";
import { CUSTOM_API_ERROR } from "@common/utils/functions/api-fetcher";
import { logger } from "@common/utils/functions/logger";
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
						if (updated) logger.info(`Updated ${(types ?? []).join("+")} userdata.`, selections);
						else logger.info("Skipped this userdata update.");
					})
					.catch((error) => logError("updating userdata", error)),
				updateStakeouts()
					.then(({ updated, success, failed }) => {
						if (updated) {
							if (success || failed) logger.info("Updated stakeouts.", { success, failed });
							else logger.info("No stakeouts to update.");
						} else logger.info("Skipped this stakeout update.");
					})
					.catch((error) => logError("updating stakeouts", error)),
				updateFactionStakeouts()
					.then(({ updated, success, failed }) => {
						if (updated) {
							if (success || failed) logger.info("Updated faction stakeouts.", { success, failed });
							else logger.info("No faction stakeouts to update.");
						} else logger.info("Skipped this faction stakeout update.");
					})
					.catch((error) => logError("updating faction stakeouts", error)),
			);

			if (!torndata || !isSameUTCDay(new Date(torndata.date), new Date())) {
				// Update once every torn day.
				updatePromises.push(
					updateTorndata()
						.then(() => logger.info("Updated torndata."))
						.catch((error) => logError("updating torndata", error)),
				);
			}

			if (!stockdata?.date || hasTimePassed(stockdata.date, TO_MILLIS.MINUTES * 5)) {
				updatePromises.push(
					updateStocks()
						.then(() => logger.info("Updated stocks."))
						.catch((error) => logError("updating stocks", error)),
				);
			}

			if (!factiondata || !("date" in factiondata) || hasTimePassed(factiondata.date, TO_MILLIS.MINUTES * 15))
				updatePromises.push(
					updateFactiondata()
						.then(() => logger.info("Updated factiondata."))
						.catch((error) => logError("updating factiondata", error)),
				);
		}

		updatePromises.push(
			updateNPCs()
				.then(({ updated, alerts }) => {
					if (updated) logger.info("Updated npcs.");
					if (alerts) logger.info(`Sent out ${alerts} npc alerts.`);
				})
				.catch((error) => logError("updating npcs", error)),
			verifyTime().catch((error) => logError("Failed to verify your time to be synced.", error)),
		);

		await Promise.all(updatePromises);
	} finally {
		lockTimedUpdates = false;
	}

	function logError(message: any, error: any) {
		if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
			logger.warn(`You disabled our permission to call the API!`);
		} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK) {
			logger.warn(`Error due to no internet while ${message}.`);
		} else if (error.code === CUSTOM_API_ERROR.CANCELLED) {
			logger.warn(`Error due to requests taking too long while ${message}.`);
		} else if (isTornApiError(error)) {
			if (error.code === 9) {
				logger.info(`Torn's API is temporary disabled while ${message}.`);
			} else if (error.code === 17) {
				logger.info(`Torn's API is having backend issues while ${message}.`);
			} else {
				logger.error(`Error while ${message}.`, error);
			}
		} else {
			logger.error(`Error while ${message}.`, error);
		}
	}
}

async function verifyTime() {
	const savedTime = await ttStorage.get("time");

	const now = Date.now();
	if (savedTime != null && savedTime > Date.now()) {
		logger.warn("Detected a desynchronized time! Resetting timed data.");
		await ttCache.clear();
		await Promise.all([updateUserdata(true), updateFactiondata(), updateTorndata(), updateStocks(), updateStakeouts(true), updateFactionStakeouts(true)]);
	}

	await ttStorage.set({ time: now });
}
