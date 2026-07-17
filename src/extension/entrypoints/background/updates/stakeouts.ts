import { ttStorage } from "@common/utils/context";
import { loadDatabase, notifications, settings, stakeouts } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { dropDecimals } from "@common/utils/functions/formatting";
import { getHospitalizationReason } from "@common/utils/functions/torn";
import { hasTimePassed, TO_MILLIS } from "@common/utils/functions/utilities";
import type { UserProfileResponse } from "tornapi-typescript";
import { dispatchNotification, newNotification } from "../notifications";

const UPDATE_JITTER = 1_000;

export async function updateStakeouts(forceUpdate = false) {
	await loadDatabase(true);

	const now = Date.now();

	if (!forceUpdate && stakeouts.date && !hasTimePassed(stakeouts.date - UPDATE_JITTER, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) {
		return { updated: false };
	}

	let success = 0;
	let failed = 0;
	for (const stakeout of stakeouts.list) {
		const id = stakeout.id;

		const oldData = stakeout?.info ?? null;
		let data: UserProfileResponse;
		try {
			data = await fetchData<UserProfileResponse>("tornv2", { section: "user", selections: ["profile"], id, silent: true });
			if (!data) {
				console.log("Unexpected result during stakeout updating.");
				failed++;
				continue;
			}

			success++;
		} catch (e) {
			console.log("STAKEOUT error", e);
			failed++;
			continue;
		}

		if (stakeout.alerts) {
			const { label } = stakeout;
			const { okay, hospital, flying, landing, online, life, offline, revivable } = stakeout.alerts;

			if (okay) {
				const key = `${id}_okay`;
				if (data.profile.status.state === "Okay" && (!oldData || oldData.status.state !== data.profile.status.state) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label ? `${data.profile.name} (${label}) is now okay.` : `${data.profile.name} is now okay.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.status.state !== "Okay") {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (hospital) {
				const key = `${id}_hospital`;
				if (data.profile.status.state === "Hospital" && (!oldData || oldData.status.state !== data.profile.status.state)) {
					if (settings.notifications.types.global) {
						let reasonText = "";
						const reason = getHospitalizationReason(data.profile.status.details);
						if (reason?.important) {
							reasonText = reason.display_sentence ?? reason.display ?? reason.name;
							reasonText = ` ${reasonText}`;
						}
						const notification = newNotification(
							"Stakeouts",
							label
								? `${data.profile.name} (${label}) is now in the hospital${reasonText}.`
								: `${data.profile.name} is now in the hospital${reasonText}.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.status.state !== "Hospital") {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (flying) {
				const key = `${id}_flying`;
				if (
					data.profile.status.state === "Traveling" &&
					(!oldData || oldData.status.state !== data.profile.status.state) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label ? `${data.profile.name} (${label}) is now flying.` : `${data.profile.name} is now flying.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.status.state !== "Traveling") {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (landing) {
				const key = `${id}_landing`;
				if (
					data.profile.status.state !== "Traveling" &&
					(!oldData || oldData.status.state !== data.profile.status.state) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label
								? `${data.profile.name} (${label}) is now ${data.profile.status.state === "Abroad" ? data.profile.status.description : "in Torn"}.`
								: `${data.profile.name} is now ${data.profile.status.state === "Abroad" ? data.profile.status.description : "in Torn"}.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.status.state === "Traveling") {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (online) {
				const key = `${id}_online`;
				if (
					data.profile.last_action.status === "Online" &&
					(!oldData || oldData.last_action.status !== data.profile.last_action.status) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label ? `${data.profile.name} (${label}) is now online.` : `${data.profile.name} is now online.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.last_action.status !== "Online") {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (life) {
				const key = `${id}_life`;
				if (data.profile.life.current <= data.profile.life.maximum * (life / 100) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label
								? `${data.profile.name}'${data.profile.name.endsWith("s") ? "" : "s"} (${label}) life has dropped below ${life}%.`
								: `${data.profile.name}'${data.profile.name.endsWith("s") ? "" : "s"} life has dropped below ${life}%.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (data.profile.life.current > data.profile.life.maximum * (life / 100)) {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (offline) {
				const oldOfflineHours = oldData ? dropDecimals((now - oldData.last_action.timestamp * 1000) / TO_MILLIS.HOURS) : null;
				const offlineHours = dropDecimals((now - data.profile.last_action.timestamp * 1000) / TO_MILLIS.HOURS);

				const key = `${id}_offline`;
				if (offlineHours >= offline && (!oldOfflineHours || oldOfflineHours < offlineHours) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label
								? `${data.profile.name} (${label}) has been offline for ${offlineHours} hours.`
								: `${data.profile.name} has been offline for ${offlineHours} hours.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (offlineHours < offline) {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
			if (revivable) {
				const oldIsRevivable = oldData?.isRevivable ?? false;
				const isRevivable = data.profile.revivable;

				const key = `${id}_revivable`;
				if (!oldIsRevivable && isRevivable && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Stakeouts",
							label ? `${data.profile.name} (${label}) is now revivable.` : `${data.profile.name} is now revivable.`,
							`https://www.torn.com/profiles.php?XID=${id}`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (!isRevivable) {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}
		}

		const existingIndex = stakeouts.list.findIndex((e) => e.id === id);
		if (existingIndex !== -1) {
			stakeouts.list[existingIndex] = {
				...stakeout,
				info: {
					name: data.profile.name,
					last_action: {
						status: data.profile.last_action.status,
						relative: data.profile.last_action.relative,
						timestamp: data.profile.last_action.timestamp * 1000,
					},
					life: {
						current: data.profile.life.current,
						maximum: data.profile.life.maximum,
					},
					status: {
						state: data.profile.status.state,
						color: data.profile.status.color,
						until: data.profile.status.until ? data.profile.status.until * 1000 : null,
						description: data.profile.status.description,
					},
					isRevivable: data.profile.revivable,
				},
			};
		}
	}
	stakeouts.date = now;

	await ttStorage.change({ stakeouts });
	return { updated: true, success, failed };
}
