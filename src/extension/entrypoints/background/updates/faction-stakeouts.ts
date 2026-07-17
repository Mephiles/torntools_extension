import { ttStorage } from "@common/utils/context";
import { factionStakeouts, loadDatabase, notifications, settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { hasTimePassed, TO_MILLIS } from "@common/utils/functions/utilities";
import type { FactionBasicResponse, FactionOngoingChainResponse, FactionWarsResponse } from "tornapi-typescript";
import { dispatchNotification, newNotification } from "../notifications";

const UPDATE_JITTER = 1_000;

type FetchedFactionStakeout = FactionBasicResponse & FactionOngoingChainResponse & FactionWarsResponse;

export async function updateFactionStakeouts(forceUpdate = false) {
	await loadDatabase(true);

	const now = Date.now();

	if (!forceUpdate && factionStakeouts.date && !hasTimePassed(factionStakeouts.date - UPDATE_JITTER, TO_MILLIS.SECONDS * settings.apiUsage.delayStakeouts)) {
		return { updated: false };
	}

	let success = 0;
	let failed = 0;
	for (const entry of factionStakeouts.list) {
		const factionId = entry.id;
		const oldData = entry.info ?? null;
		let data: FetchedFactionStakeout;
		try {
			data = await fetchData<FetchedFactionStakeout>("tornv2", {
				section: "faction",
				selections: ["basic", "chain", "wars"],
				id: factionId,
				silent: true,
			});
			if (!data) {
				console.log("Unexpected result during faction stakeout updating.");
				failed++;
				continue;
			}

			success++;
		} catch (e) {
			console.log("FACTION STAKEOUT error", e);
			failed++;
			continue;
		}

		if (entry.alerts) {
			const { chainReaches, memberCountDrops, rankedWarStarts, inRaid, inTerritoryWar } = entry.alerts;

			if (chainReaches !== null) {
				const oldChainCount = oldData ? oldData.chain : false;
				const chainCount = data.chain.current;

				if (chainReaches === 0) {
					const key = `faction_${factionId}_chainDrops`;
					if (typeof oldChainCount === "number" && chainCount < oldChainCount && oldChainCount >= 10 && !notifications.stakeouts[key]) {
						if (settings.notifications.types.global) {
							const notification = newNotification(
								"Faction Stakeouts",
								`${data.basic.name} has dropped their ${oldChainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`,
							);
							await dispatchNotification(notification);
							await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
						}
					} else if (chainCount > 10) {
						await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
					}
				} else {
					const key = `faction_${factionId}_chainReaches`;
					if (
						chainReaches !== false &&
						chainCount >= chainReaches &&
						(!oldChainCount || oldChainCount < chainCount) &&
						!notifications.stakeouts[key]
					) {
						if (settings.notifications.types.global) {
							const notification = newNotification(
								"Faction Stakeouts",
								`${data.basic.name} has reached a ${chainCount} chain.`,
								`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`,
							);
							await dispatchNotification(notification);
							await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
						}
					} else if (typeof oldChainCount === "number" && chainCount < oldChainCount) {
						await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
					}
				}
			}
			if (memberCountDrops) {
				const oldMemberCount = oldData ? oldData.members.current : false;
				const memberCount = data.basic.members;

				const key = `faction_${factionId}_memberCountDrops`;
				if (
					typeof oldMemberCount === "number" &&
					memberCount < memberCountDrops &&
					(!oldMemberCount || oldMemberCount > memberCount) &&
					!notifications.stakeouts[key]
				) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Faction Stakeouts",
							`${data.basic.name} now has less than ${memberCount} members.`,
							`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			}

			const handleWarStakeout = async (type: string, wasValue: boolean, isValue: boolean, createMessage: () => string) => {
				const key = `faction_${factionId}_${type}`;
				if (isValue && (!oldData || !wasValue) && !notifications.stakeouts[key]) {
					if (settings.notifications.types.global) {
						const notification = newNotification(
							"Faction Stakeouts",
							createMessage(),
							`https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { stakeouts: { [key]: notification } } });
					}
				} else if (!isValue) {
					await ttStorage.update("notifications", (notifications) => delete notifications.stakeouts[key]);
				}
			};
			if (rankedWarStarts) {
				await handleWarStakeout(
					"rankedWarStarts",
					oldData ? oldData.rankedWar : false,
					data.wars.ranked !== null,
					() => `${data.basic.name} is now in a ranked war.`,
				);
			}
			if (inRaid) {
				await handleWarStakeout("inRaid", oldData ? oldData.raid : false, data.wars.raids.length > 0, () => `${data.basic.name} is now in a raid.`);
			}
			if (inTerritoryWar) {
				await handleWarStakeout(
					"inTerritoryWar",
					oldData ? oldData.territoryWar : false,
					data.wars.territory.length > 0,
					() => `${data.basic.name} is now in a territory war.`,
				);
			}
		}

		const existingIndex = factionStakeouts.list.findIndex((e) => e.id === factionId);
		if (existingIndex !== -1) {
			factionStakeouts.list[existingIndex].info = {
				name: data.basic.name,
				chain: data.chain.current,
				respect: data.basic.respect,
				members: {
					current: data.basic.members,
					maximum: data.basic.capacity,
				},
				rankedWar: data.wars.ranked !== null,
				raid: data.wars.raids.length > 0,
				territoryWar: data.wars.territory.length > 0,
			};
		}
	}
	factionStakeouts.date = now;

	await ttStorage.change({ factionStakeouts });
	return { updated: true, success, failed };
}
