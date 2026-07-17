import { ttStorage } from "@common/utils/context";
import { api, attackHistory, type DatabaseUserdata, loadDatabase, notifications, settings, setUserdata, userdata } from "@common/utils/data/database";
import type { StoredUserdata } from "@common/utils/data/default-database";
import { buildFetchRequest, type FetchOptions, type FetchRequest, fetchData, mergeOptions } from "@common/utils/functions/api-fetcher";
import type { UserV1NetworthResponse, UserV1PerksResponse } from "@common/utils/functions/api-v1.types";
import { setBadge } from "@common/utils/functions/extension";
import { applyPlural, capitalizeText, formatTime } from "@common/utils/functions/formatting";
import { getNextChainBonus, hasFinishedEducation, LINKS, MAX_MISSIONS } from "@common/utils/functions/torn";
import { getUTCTodayAtTime, hasTimePassed, TO_MILLIS } from "@common/utils/functions/utilities";
import { showIconBars } from "@extension/entrypoints/background/updates/icon-bars";
import type {
	AttacksResponse,
	TimestampResponse,
	UserAmmoResponse,
	UserBarsResponse,
	UserBattleStatsResponse,
	UserCalendarResponse,
	UserCooldownsResponse,
	UserEducationResponse,
	UserEventsResponse,
	UserFactionResponse,
	UserHonorsResponse,
	UserIconPrivate,
	UserJobPointsResponse,
	UserJobResponse,
	UserMedalsResponse,
	UserMeritsResponse,
	UserMissionsResponse,
	UserMoneyResponse,
	UserNewEventsResponse,
	UserNewMessagesResponse,
	UserNotificationsResponse,
	UserOrganizedCrimeResponse,
	UserPersonalStatsFull,
	UserProfileResponse,
	UserPropertiesResponse,
	UserRefillsResponse,
	UserSkillsResponse,
	UserStocksResponse,
	UserTravelResponse,
	UserVirusResponse,
	UserWeaponExpResponse,
	UserWorkStatsResponse,
} from "tornapi-typescript";
import { dispatchNotification, newNotification } from "../notifications";

const UPDATE_JITTER = 1_000;

export type FetchedUserdata = UserProfileResponse &
	UserFactionResponse &
	UserJobResponse &
	TimestampResponse &
	UserNotificationsResponse &
	UserBarsResponse &
	UserCooldownsResponse &
	UserTravelResponse &
	UserNewMessagesResponse &
	UserRefillsResponse & { icons: UserIconPrivate[] } & UserMoneyResponse &
	UserStocksResponse &
	UserMeritsResponse &
	UserV1PerksResponse &
	UserV1NetworthResponse &
	UserAmmoResponse &
	UserBattleStatsResponse &
	UserWorkStatsResponse &
	UserSkillsResponse &
	UserWeaponExpResponse &
	UserPropertiesResponse &
	UserCalendarResponse &
	UserOrganizedCrimeResponse &
	UserPersonalStatsFull &
	UserHonorsResponse &
	UserMedalsResponse &
	UserMissionsResponse &
	UserEducationResponse &
	AttacksResponse &
	(UserEventsResponse | UserNewEventsResponse) &
	UserVirusResponse &
	UserJobPointsResponse;

export async function updateUserdata(forceUpdate = false) {
	const now = Date.now();

	const updatedTypes = [];
	const updateEssential =
		forceUpdate ||
		!userdata ||
		!Object.keys(userdata).length ||
		hasTimePassed((userdata.date ?? 0) - UPDATE_JITTER, TO_MILLIS.SECONDS * settings.apiUsage.delayEssential);
	const updateBasic =
		updateEssential &&
		(forceUpdate ||
			!userdata?.dateBasic ||
			(hasTimePassed(userdata?.dateBasic - UPDATE_JITTER, TO_MILLIS.SECONDS * settings.apiUsage.delayBasic) &&
				!hasTimePassed(userdata?.profile?.last_action?.timestamp * 1000, TO_MILLIS.MINUTES * 5)));
	const updatePassive =
		updateEssential &&
		(forceUpdate ||
			!userdata?.datePassive ||
			(hasTimePassed(userdata?.datePassive - UPDATE_JITTER, TO_MILLIS.SECONDS * settings.apiUsage.delayPassive) &&
				!hasTimePassed(userdata?.profile?.last_action?.timestamp * 1000, TO_MILLIS.MINUTES * 5)));

	const selections = [];
	const selectionsV2 = [];
	if (updateEssential) {
		// TODO - Move some of those behind a setting.
		selectionsV2.push("profile", "faction", "job", "timestamp", "notifications");
		// Notifications have a 100K count limit from being fetched via the Torn API
		// Use "newevents" selection only when the old events count > new events count
		// Fetch the notifications count always, to avoid additional API calls

		for (const selection of ["bars", "cooldowns", "icons", "newmessages", "money", "travel", "refills"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		updatedTypes.push("essential");
	}
	if (updateBasic) {
		// TODO - Migrate to V2 (user/perks).
		// TODO - Migrate to V2 (user/networth).
		for (const selection of [
			// "inventory",
			"perks",
			"networth",
		]) {
			if (!settings.apiUsage.user[selection]) continue;

			selections.push(selection);
		}
		for (const selection of [
			"ammo",
			"battlestats",
			"skills",
			"calendar",
			"organizedcrime",
			"personalstats",
			"honors",
			"weaponexp",
			"medals",
			"properties",
			"missions",
			"workstats",
			"virus",
			"merits",
			"stocks",
		]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		if (settings.apiUsage.user.education && !hasFinishedEducation()) selectionsV2.push("education");

		updatedTypes.push("basic");
	}
	if (updatePassive) {
		for (const selection of ["jobpoints"]) {
			if (!settings.apiUsage.user[selection]) continue;

			selectionsV2.push(selection);
		}

		updatedTypes.push("passive");
	}
	if (attackHistory.fetchData && settings.apiUsage.user.attacks && settings.pages.global.keepAttackHistory) {
		selectionsV2.push("attacks");

		updatedTypes.push("attack history");
	}
	if (!selections.length && !selectionsV2.length) return { updated: false };

	const fetchOptions: Partial<FetchOptions> = {
		section: "user",
		legacySelections: selections,
		selections: selectionsV2,
		params: { cat: "all", timestamp: Math.floor(Date.now() / 1000) },
	};
	const fetchedUserdata = await fetchData<FetchedUserdata>("tornv2", fetchOptions);
	validateUserdataResponse(fetchedUserdata, buildFetchRequest("tornv2", mergeOptions(fetchOptions)));

	const oldUserdata = (await loadDatabase()).userdata;
	const newUserdata: StoredUserdata = {
		...oldUserdata,
		...fetchedUserdata,
		date: now,
		dateBasic: updateBasic ? now : (oldUserdata?.dateBasic ?? now),
		datePassive: updatePassive ? now : (oldUserdata?.datePassive ?? now),
	};

	// Notifications have a 100K count limit from being fetched via the Torn API
	// Use "newevents" selection only when the old events count > new events count
	// Fetch only when new events arrived
	if (oldUserdata?.notifications?.events !== newUserdata?.notifications?.events) {
		const newEventsCount = (newUserdata?.notifications?.events ?? 0) - (oldUserdata?.notifications?.events ?? 0);

		if (newEventsCount > 0) {
			const category = newEventsCount <= 25 ? "newevents" : "events";
			newUserdata.events = (
				await fetchData<UserEventsResponse | UserNewEventsResponse>("tornv2", {
					section: "user",
					selections: [category],
					params: { limit: newEventsCount },
				})
			).events;
			selections.push(category);
		}
	}
	if (!("events" in newUserdata) || newUserdata?.notifications?.events === 0) {
		newUserdata.events = [];
	}

	await processUserdata().catch((error) => console.error("Error while processing userdata.", error));
	await checkAttacks().catch((error) => console.error("Error while checking personal stats for attack changes.", error));

	setUserdata(newUserdata);
	await ttStorage.set({ userdata: newUserdata });

	await showIconBars().catch((error) => console.error("Error while updating the icon bars.", error));
	if (updateEssential) {
		await notifyEventMessages().catch((error) => console.error("Error while sending event and message notifications.", error));
		await notifyTravelLanding().catch((error) => console.error("Error while sending travel landing notifications.", error));
		await notifyBars().catch((error) => console.error("Error while sending bar notification.", error));
		await notifyOffline().catch((error) => console.error("Error while sending offline notification.", error));
		await notifyChain().catch((error) => console.error("Error while sending chain notifications.", error));
		await notifyTraveling().catch((error) => console.error("Error while sending traveling notifications.", error));
		await notifyMissions().catch((error) => console.error("Error while sending mission notifications.", error));
		await notifyRefills().catch((error) => console.error("Error while sending refill notifications.", error));
	}
	await notifyStatusChange().catch((error) => console.error("Error while sending status change notifications.", error));
	await notifyCooldownOver().catch((error) => console.error("Error while sending cooldown notifications.", error));
	await notifyEducation().catch((error) => console.error("Error while sending education notifications.", error));
	await notifyNewDay().catch((error) => console.error("Error while sending new day notification.", error));
	await notifyHospital().catch((error) => console.error("Error while sending hospital notifications.", error));
	await notifySpecificCooldowns().catch((error) => console.error("Error while sending specific cooldown notifications.", error));

	return { updated: true, types: updatedTypes, selections: [...selections, ...selectionsV2] };

	async function checkAttacks() {
		if (!settings.pages.global.keepAttackHistory) return;

		if (newUserdata.attacks) {
			await updateAttackHistory();

			delete newUserdata.attacks;
		}

		if (oldUserdata.personalstats && newUserdata.personalstats) {
			const fetchData = [
				(data: DatabaseUserdata) => data.personalstats.attacking.attacks.lost,
				(data: DatabaseUserdata) => data.personalstats.attacking.attacks.stalemate,
				(data: DatabaseUserdata) => data.personalstats.attacking.defends.lost,
				(data: DatabaseUserdata) => data.personalstats.attacking.defends.stalemate,
				(data: DatabaseUserdata) => data.personalstats.attacking.killstreak.current,
			].some((getter) => getter(oldUserdata) !== getter(newUserdata));

			await ttStorage.change({ attackHistory: { fetchData } });
		}

		async function updateAttackHistory() {
			let lastAttack = attackHistory.lastAttack;
			newUserdata.attacks
				.filter(({ id }) => id > attackHistory.lastAttack)
				.forEach((attack) => {
					if (attack.id > lastAttack) lastAttack = attack.id;

					const enemyId = attack.attacker?.id === newUserdata.profile.id ? attack.defender.id : attack.attacker?.id;
					if (!enemyId) return;

					// Set up the data so there are no missing keys.
					attackHistory.history[enemyId] = {
						name: "",
						defend: 0,
						defend_lost: 0,
						lose: 0,
						stalemate: 0,
						win: 0,
						stealth: 0,
						mug: 0,
						hospitalise: 0,
						leave: 0,
						arrest: 0,
						assist: 0,
						special: 0,
						escapes: 0,
						respect: [],
						respect_base: [],
						...(enemyId in attackHistory.history ? attackHistory.history[enemyId] : {}),
						lastAttack: attack.ended * 1000,
						lastAttackCode: attack.code,
					};

					if (attack.defender.id === newUserdata.profile.id) {
						if (attack.attacker.name) attackHistory.history[enemyId].name = attack.attacker.name;

						if (attack.result === "Assist") {
							// Ignore group attacks that isn't the finishing hit
						} else if (["Lost", "Timeout", "Escape", "Stalemate"].includes(attack.result)) {
							attackHistory.history[enemyId].defend++;
						} else {
							attackHistory.history[enemyId].defend_lost++;
						}
					} else if (attack.attacker?.id === newUserdata.profile.id) {
						if (attack.defender.name) attackHistory.history[enemyId].name = attack.defender.name;

						if (attack.result === "Lost" || attack.result === "Timeout") attackHistory.history[enemyId].lose++;
						else if (attack.result === "Stalemate") attackHistory.history[enemyId].stalemate++;
						else if (attack.result === "Assist") attackHistory.history[enemyId].assist++;
						else if (attack.result === "Escape") attackHistory.history[enemyId].escapes++;
						else {
							attackHistory.history[enemyId].win++;
							if (attack.is_stealthed) attackHistory.history[enemyId].stealth++;

							let respect = attack.respect_gain;
							if (respect !== 0) {
								let hasAccurateModifiers = "modifiers" in attack;

								if (hasAccurateModifiers) {
									if (respect === attack.modifiers.chain) {
										respect = 1;
										hasAccurateModifiers = false;
									} else {
										if (attack.result === "Mugged") respect /= 0.75;

										respect =
											respect /
											attack.modifiers.war /
											attack.modifiers.retaliation /
											attack.modifiers.group /
											attack.modifiers.overseas /
											attack.modifiers.chain /
											attack.modifiers.warlord;
									}
									attackHistory.history[enemyId].latestFairFightModifier = attack.modifiers.fair_fight;
								}

								attackHistory.history[enemyId][hasAccurateModifiers ? "respect_base" : "respect"].push(respect);
							}

							switch (attack.result) {
								case "Mugged":
									attackHistory.history[enemyId].mug++;
									break;
								case "Hospitalized":
									attackHistory.history[enemyId].hospitalise++;
									break;
								case "Attacked":
									attackHistory.history[enemyId].leave++;
									break;
								case "Arrested":
									attackHistory.history[enemyId].arrest++;
									break;
								case "Special":
									attackHistory.history[enemyId].special++;
									break;
							}
						}
					}
				});

			await ttStorage.change({
				attackHistory: {
					lastAttack,
					fetchData: false,
					history: { ...attackHistory.history },
				},
			});
		}
	}

	async function processUserdata() {
		if ("icons" in newUserdata) {
			const icon85 = newUserdata.icons.find(({ id }) => id === 85);
			if (icon85) {
				newUserdata.userCrime = icon85.until * 1000;
			} else if (newUserdata.icons.some(({ id }) => id === 86)) {
				newUserdata.userCrime = newUserdata.timestamp * TO_MILLIS.SECONDS;
			} else {
				newUserdata.userCrime = -1;
			}
		}
	}

	async function notifyEventMessages() {
		if (settings.apiUsage.user.newevents && settings.notifications.types.global && settings.notifications.types.events) {
			const events = newUserdata.events.filter((event) => !notifications.events[event.id]);
			if (events.length) {
				// Remove profile links from event message
				let message = events.at(-1)!.event.replace(/<\/?[^>]+(>|$)/g, "");
				if (events.length > 1) message += `\n(and ${events.length - 1} more event${events.length > 2 ? "s" : ""})`;

				const notification = newNotification(`New Event${applyPlural(events.length)}`, message, LINKS.events);
				await dispatchNotification(notification);
				await Promise.all(events.map((event) => ttStorage.change({ notifications: { events: { [event.id]: { combined: true } } } })));
			}
		}

		if (settings.apiUsage.user.newmessages && settings.notifications.types.global && settings.notifications.types.messages) {
			const messages = newUserdata.messages.filter(({ seen }) => !seen).filter((message) => !notifications.messages[message.id]);
			if (messages.length) {
				let message = `${messages.at(-1)!.topic} - by ${messages.at(-1)!.sender.name}`;
				if (messages.length > 1) message += `\n(and ${messages.length - 1} more message${messages.length > 2 ? "s" : ""})`;

				const notification = newNotification(`New Message${applyPlural(messages.length)}`, message, LINKS.messages);
				await dispatchNotification(notification);
				await Promise.all(messages.map((message) => ttStorage.change({ notifications: { messages: { [message.id]: { combined: true } } } })));
			}
		}

		await setBadge("count", { events: newUserdata.notifications.events, messages: newUserdata.notifications.messages });
	}

	async function notifyStatusChange() {
		if (!settings.notifications.types.global || !settings.notifications.types.status || !oldUserdata.profile?.status) return;

		const previous = oldUserdata.profile.status.state;
		const current = newUserdata.profile.status.state;

		if (current === previous || current === "Traveling" || current === "Abroad") return;

		if (current === "Okay") {
			if (previous === "Hospital") {
				await dispatchNotification({
					title: "TornTools - Status",
					message: "You are out of the hospital.",
					url: LINKS.home,
					type: "status",
					key: Date.now(),
					date: Date.now(),
				});
			} else if (previous === "Jail") {
				await dispatchNotification({
					title: "TornTools - Status",
					message: "You are out of the jail.",
					url: LINKS.home,
					date: Date.now(),
				});
			}
		} else {
			await dispatchNotification({
				title: "TornTools - Status",
				message: newUserdata.profile.status.description,
				url: LINKS.home,
				date: Date.now(),
			});
		}
	}

	async function notifyCooldownOver() {
		if (!settings.apiUsage.user.cooldowns || !settings.notifications.types.global || !settings.notifications.types.cooldowns || !oldUserdata.cooldowns)
			return;

		for (const type in newUserdata.cooldowns) {
			if (newUserdata.cooldowns[type] || !oldUserdata.cooldowns[type]) continue;

			await dispatchNotification({
				title: "TornTools - Cooldown",
				message: `Your ${type} cooldown has ended.`,
				url: LINKS.items,
				date: Date.now(),
			});
		}
	}

	async function notifyTravelLanding() {
		if (!settings.apiUsage.user.travel || !settings.notifications.types.global || !settings.notifications.types.traveling || !oldUserdata.travel) return;
		if (newUserdata.travel.time_left !== 0 || oldUserdata.travel.time_left === 0) return;

		await dispatchNotification({
			title: "TornTools - Traveling",
			message: `You have landed in ${newUserdata.travel.destination}.`,
			url: LINKS.home,
			date: Date.now(),
		});
	}

	async function notifyEducation() {
		if (
			!settings.apiUsage.user.education ||
			!settings.notifications.types.global ||
			!settings.notifications.types.education ||
			!oldUserdata.education.current ||
			newUserdata.education.current
		)
			return;

		await dispatchNotification({
			title: "TornTools - Education",
			message: "You have finished your education course.",
			url: LINKS.education,
			date: Date.now(),
		});
	}

	async function notifyNewDay() {
		if (!settings.notifications.types.global || !settings.notifications.types.newDay) return;

		const date = new Date();
		const utc = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
		if (date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || utc in notifications.newDay) return;

		const notification = newNotification("New Day", "It's a new day! Hopefully a sunny one.", LINKS.home);
		await dispatchNotification(notification);
		await ttStorage.change({ notifications: { newDay: { [utc]: notification } } });
	}

	async function notifyBars() {
		if (!settings.apiUsage.user.bars || !settings.notifications.types.global) return;

		for (const bar of ["energy", "happy", "nerve", "life"] as const) {
			if (!settings.notifications.types[bar].length || !oldUserdata.bars?.[bar]) continue;

			const checkpoints = settings.notifications.types[bar]
				.map<number>((checkpoint: string | number) =>
					typeof checkpoint === "string" && checkpoint.includes("%")
						? (parseInt(checkpoint) / 100) * newUserdata.bars[bar].maximum
						: parseInt(checkpoint.toString()),
				)
				.sort((a, b) => b - a);

			for (const checkpoint of checkpoints) {
				if (
					oldUserdata.bars[bar].current < newUserdata.bars[bar].current &&
					newUserdata.bars[bar].current >= checkpoint &&
					!notifications[bar][checkpoint]
				) {
					const url = (() => {
						switch (bar) {
							case "energy":
								return LINKS.gym;
							case "happy":
								return LINKS.items_candy;
							case "nerve":
								return LINKS.crimes;
							case "life":
								return LINKS.items_medical;
							default:
								return LINKS.home;
						}
					})();

					const notification = newNotification(
						"Bars",
						`Your ${capitalizeText(bar)} bar has reached ${newUserdata.bars[bar].current}/${newUserdata.bars[bar].maximum}.`,
						url,
					);
					await dispatchNotification(notification);
					await ttStorage.change({ notifications: { [bar]: { [checkpoint]: notification } } });
					break;
				} else if (newUserdata.bars[bar].current < checkpoint && notifications[bar][checkpoint]) {
					await ttStorage.update("notifications", (notifications) => delete notifications[bar][checkpoint]);
				}
			}
		}
	}

	async function notifyOffline() {
		if (!settings.notifications.types.global || !settings.notifications.types.offline.length || !oldUserdata?.profile?.last_action?.timestamp) return;

		const checkpoints = settings.notifications.types.offline.sort((a, b) => b - a);

		const oldHoursOffline = Math.floor(((oldUserdata.timestamp - oldUserdata.profile.last_action.timestamp) * TO_MILLIS.SECONDS) / TO_MILLIS.HOURS);
		const hoursOffline = Math.floor(((newUserdata.timestamp - newUserdata.profile.last_action.timestamp) * TO_MILLIS.SECONDS) / TO_MILLIS.HOURS);

		for (const checkpoint of checkpoints) {
			if (oldHoursOffline < hoursOffline && hoursOffline >= checkpoint && !notifications.offline[checkpoint]) {
				const notification = newNotification("Offline", `You've been offline for over ${checkpoint} hour${applyPlural(checkpoint)}.`, LINKS.home);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { offline: { [checkpoint]: notification } } });
				break;
			} else if (hoursOffline < checkpoint && notifications.offline[checkpoint]) {
				await ttStorage.update("notifications", (notifications) => delete notifications.offline[checkpoint]);
			}
		}
	}

	async function notifyChain() {
		if (!settings.apiUsage.user.bars || !settings.notifications.types.global) return;

		if (
			settings.notifications.types.chainTimerEnabled &&
			settings.notifications.types.chainTimer.length > 0 &&
			newUserdata.bars?.chain &&
			newUserdata.bars.chain.timeout !== 0 &&
			newUserdata.bars.chain.current >= 10
		) {
			const timeout = newUserdata.bars.chain.timeout * 1000 - (now - newUserdata.timestamp * 1000); // ms
			const count = newUserdata.bars.chain.current;

			for (const checkpoint of settings.notifications.types.chainTimer.sort((a, b) => a - b)) {
				const key = `${count}_${checkpoint}`;
				if (timeout > checkpoint * TO_MILLIS.SECONDS || notifications.chain[key]) continue;

				const notification = newNotification(
					"Chain",
					`Chain timer will run out in ${formatTime({ milliseconds: timeout }, { type: "wordTimer" })}.`,
					LINKS.chain,
				);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { chain: { [key]: notification } } });
				break;
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.chain = {}));
		}

		if (
			settings.notifications.types.chainBonusEnabled &&
			settings.notifications.types.chainBonus.length > 0 &&
			newUserdata.bars?.chain &&
			newUserdata.bars.chain.timeout !== 0 &&
			newUserdata.bars.chain.current >= 10
		) {
			const count = newUserdata.bars.chain.current;
			const nextBonus = getNextChainBonus(count);

			for (const checkpoint of settings.notifications.types.chainBonus.sort((a, b) => b - a)) {
				const key = `${nextBonus}_${checkpoint}`;

				if (nextBonus - count > checkpoint || notifications.chainCount[key]) continue;

				const notification = newNotification(
					"Chain",
					`Chain will reach the next bonus hit in ${nextBonus - count} hit${applyPlural(nextBonus - count)}.`,
					LINKS.chain,
				);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { chainCount: { [key]: notification } } });
				break;
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.chainCount = {}));
		}
	}

	async function notifyHospital() {
		if (!settings.notifications.types.global) return;

		if (
			settings.notifications.types.leavingHospitalEnabled &&
			settings.notifications.types.leavingHospital.length &&
			newUserdata.profile.status.state === "Hospital"
		) {
			for (const checkpoint of settings.notifications.types.leavingHospital.sort((a, b) => a - b)) {
				const timeLeft = newUserdata.profile.status.until * 1000 - now;

				if (timeLeft > checkpoint * TO_MILLIS.MINUTES || notifications.hospital[checkpoint]) continue;

				const notification = newNotification(
					"Hospital",
					`You will be out of the hospital in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
					LINKS.hospital,
				);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { hospital: { [checkpoint]: notification } } });
				break;
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.hospital = {}));
		}
	}

	async function notifyTraveling() {
		if (!settings.apiUsage.user.travel || !settings.notifications.types.global) return;

		if (settings.notifications.types.landingEnabled && settings.notifications.types.landing.length && newUserdata.travel.time_left) {
			for (const checkpoint of settings.notifications.types.landing.sort((a, b) => a - b)) {
				const timeLeft = newUserdata.travel.arrival_at * 1000 - now;

				if (timeLeft > checkpoint * TO_MILLIS.MINUTES || notifications.travel[checkpoint]) continue;

				const notification = newNotification(
					"Travel",
					`You will be landing in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
					LINKS.home,
				);
				await dispatchNotification(notification);
				await ttStorage.change({ notifications: { travel: { [checkpoint]: notification } } });
				break;
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.travel = {}));
		}
	}

	async function notifySpecificCooldowns() {
		if (!settings.apiUsage.user.cooldowns || !settings.notifications.types.global) return;

		const COOLDOWNS = [
			{ name: "drug", title: "Drugs", setting: "cooldownDrug", memory: "drugs", enabled: "cooldownDrugEnabled" },
			{
				name: "booster",
				title: "Boosters",
				setting: "cooldownBooster",
				memory: "boosters",
				enabled: "cooldownBoosterEnabled",
			},
			{
				name: "medical",
				title: "Medical",
				setting: "cooldownMedical",
				memory: "medical",
				enabled: "cooldownMedicalEnabled",
			},
		];

		for (const cooldown of COOLDOWNS) {
			if (
				settings.notifications.types[cooldown.enabled] &&
				settings.notifications.types[cooldown.setting].length &&
				newUserdata.cooldowns[cooldown.name] > 0
			) {
				for (const checkpoint of settings.notifications.types[cooldown.setting].sort((a: number, b: number) => a - b)) {
					const timeLeft = newUserdata.cooldowns[cooldown.name] * 1000;

					if (timeLeft > parseFloat(checkpoint) * TO_MILLIS.MINUTES || notifications[cooldown.memory][checkpoint]) continue;

					const notification = newNotification(
						cooldown.title,
						`Your ${cooldown.name} cooldown will end in ${formatTime({ milliseconds: timeLeft }, { type: "wordTimer" })}.`,
						LINKS.items,
					);
					await dispatchNotification(notification);
					await ttStorage.change({ notifications: { [cooldown.memory]: { [checkpoint]: notification } } });
				}
			} else {
				await ttStorage.update("notifications", (notifications) => (notifications[cooldown.memory] = {}));
			}
		}
	}

	async function notifyMissions() {
		if (!settings.apiUsage.user.missions || !settings.notifications.types.global) return;

		if (settings.notifications.types.missionsLimitEnabled && settings.notifications.types.missionsLimit) {
			const limitParts = settings.notifications.types.missionsLimit.split(":").map((part) => parseInt(part, 10));
			const cutoff = getUTCTodayAtTime(limitParts[0], limitParts[1]);

			if (new Date() >= cutoff) {
				for (const { name, contracts } of newUserdata.missions.givers) {
					const activeContracts = contracts.filter((contract) => contract.completed_at === null);
					const maxMissions = name in MAX_MISSIONS ? MAX_MISSIONS[name] : MAX_MISSIONS.DEFAULT;

					if (activeContracts.length >= maxMissions) {
						const now = new Date();
						const key = `${name}_${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

						if (!(key in notifications.missionsLimit)) {
							const notification = newNotification(
								"Missions",
								`You are currently at the maximum amount of contracts (${maxMissions}) for ${name}.`,
								LINKS.missions,
							);
							await dispatchNotification(notification);
							await ttStorage.change({ notifications: { missionsLimit: { [key]: notification } } });
						}
					}
				}
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.missionsLimit = {}));
		}

		if (settings.notifications.types.missionsExpireEnabled && settings.notifications.types.missionsExpire.length) {
			for (const { name, contracts } of newUserdata.missions.givers) {
				const ongoingMissions = contracts.filter((contract) => contract.status === "Accepted");

				for (const mission of ongoingMissions) {
					for (const checkpoint of settings.notifications.types.missionsExpire.sort((a, b) => a - b)) {
						const timeLeft = mission.expires_at * 1000 - now;
						const key = `${name}_${mission.title}_${mission.created_at}_${checkpoint}`;

						if (timeLeft > checkpoint * TO_MILLIS.HOURS || notifications.missionsExpire[key]) continue;

						const notification = newNotification(
							"Missions",
							`'${mission.title}' by ${name} will expire in ${formatTime(
								{ milliseconds: timeLeft },
								{
									type: "wordTimer",
									showDays: true,
									truncateSeconds: true,
								},
							)}.`,
							LINKS.missions,
						);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { missionsExpire: { [key]: notification } } });
						break;
					}
				}
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.missionsExpire = {}));
		}
	}

	async function notifyRefills() {
		if (!settings.apiUsage.user.refills || !settings.notifications.types.global) return;

		if (settings.notifications.types.refillEnergyEnabled && settings.notifications.types.refillEnergy) {
			const limitParts = settings.notifications.types.refillEnergy.split(":").map((part) => parseInt(part, 10));
			const cutoff = getUTCTodayAtTime(limitParts[0], limitParts[1]);

			if (new Date() >= cutoff) {
				if (!newUserdata.refills.energy) {
					const now = new Date();
					const key = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

					if (!(key in notifications.refillEnergy)) {
						const notification = newNotification("Refill", `You have yet to use your energy refill today.`, LINKS.points);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { refillEnergy: { [key]: notification } } });
					}
				}
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.refillEnergy = {}));
		}

		if (settings.notifications.types.refillNerveEnabled && settings.notifications.types.refillNerve) {
			const limitParts = settings.notifications.types.refillNerve.split(":").map((part) => parseInt(part, 10));
			const cutoff = getUTCTodayAtTime(limitParts[0], limitParts[1]);

			if (new Date() >= cutoff) {
				if (!newUserdata.refills.nerve) {
					const now = new Date();
					const key = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

					if (!(key in notifications.refillNerve)) {
						const notification = newNotification("Refill", `You have yet to use your nerve refill today.`, LINKS.points);
						await dispatchNotification(notification);
						await ttStorage.change({ notifications: { refillNerve: { [key]: notification } } });
					}
				}
			}
		} else {
			await ttStorage.update("notifications", (notifications) => (notifications.refillNerve = {}));
		}
	}
}

function validateUserdataResponse(fetchedUserdata: FetchedUserdata, _request: FetchRequest) {
	if (!fetchedUserdata?.profile?.id) throw new Error("Aborted updating due to an unexpected response.");

	if (api.torn.owner && api.torn.owner !== fetchedUserdata.profile.id) {
		throw new Error(`Aborted updating since it seems you received the data from ${fetchedUserdata.profile.id} instead of ${api.torn.owner}.`);
	}
}
