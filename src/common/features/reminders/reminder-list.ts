import { api, settings, userdata } from "@common/utils/data/database";
import { hasFinishedEducation, LINKS } from "@common/utils/functions/torn";

export interface Reminder {
	name: string;
	group?: string;
	url?: string;
	enabled?: () => boolean;
	finished: () => boolean;
}

export const REMINDERS: Reminder[] = [
	{
		name: "Energy Refill",
		group: "refills",
		url: LINKS.points,
		enabled: () => settings.apiUsage.user.refills && settings.scripts.reminders.types.energyRefill,
		finished: () => userdata.refills.energy,
	},
	{
		name: "Nerve Refill",
		group: "refills",
		url: LINKS.points,
		enabled: () => settings.apiUsage.user.refills && settings.scripts.reminders.types.nerveRefill,
		finished: () => userdata.refills.nerve,
	},
	{
		name: "Medical Cooldown",
		group: "cooldowns",
		url: LINKS.items_medical,
		enabled: () => settings.apiUsage.user.cooldowns && settings.scripts.reminders.types.medicalCooldown,
		finished: () => !!userdata.cooldowns.medical,
	},
	{
		name: "Booster Cooldown",
		group: "cooldowns",
		url: LINKS.items_booster,
		enabled: () => settings.apiUsage.user.cooldowns && settings.scripts.reminders.types.boosterCooldown,
		finished: () => !!userdata.cooldowns.booster,
	},
	{
		name: "Drug Cooldown",
		group: "cooldowns",
		url: LINKS.items_drug,
		enabled: () => settings.apiUsage.user.cooldowns && settings.scripts.reminders.types.drugCooldown,
		finished: () => !!userdata.cooldowns.drug,
	},
	{
		name: "Bank Investment",
		url: LINKS.bank,
		enabled: () => settings.apiUsage.user.money && settings.scripts.reminders.types.bankInvestment,
		finished: () => !!userdata.money.city_bank && userdata.money.city_bank.until * 1000 > Date.now(),
	},
	{
		name: "Virus Coding",
		url: LINKS.pc,
		enabled: () => settings.apiUsage.user.virus && settings.scripts.reminders.types.virusCoding,
		finished: () => !!userdata.virus && userdata.virus.until * 1000 > Date.now(),
	},
	{
		name: "Mission Reward",
		group: "missions",
		url: LINKS.missions,
		enabled: () => settings.apiUsage.user.missions && settings.scripts.reminders.types.missionReward,
		finished: () => userdata.missions.rewards.every((reward) => reward.expires_at * 1000 >= Date.now()),
	},
	{
		name: "OC",
		group: "oc",
		url: LINKS.organizedCrimes,
		enabled: () => !!userdata.faction && settings.scripts.reminders.types.oc,
		finished: () => userdata.organizedCrime && "id" in userdata.organizedCrime,
	},
	{
		name: "OC: Item",
		group: "oc",
		url: LINKS.organizedCrimes,
		enabled: () => !!userdata.faction && settings.scripts.reminders.types.ocItem,
		finished: () => {
			// Mark as finished if not in an OC, we have a different reminder for that.
			if (!userdata.organizedCrime || !("id" in userdata.organizedCrime)) return true;

			const slot = userdata.organizedCrime.slots.find((slot) => slot.user?.id === api.torn.owner);
			if (!slot) return true;

			// Mark as finished if there is no item requirement, or when the item is available.
			return !slot.item_requirement || slot.item_requirement.is_available;
		},
	},
	{
		name: "Race",
		url: LINKS.raceway,
		enabled: () => settings.apiUsage.user.icons && settings.scripts.reminders.types.race,
		finished: () => userdata.icons.find((icon) => icon.title === "Racing")?.id === 17,
	},
	{
		name: "Education",
		url: LINKS.education,
		enabled: () => settings.apiUsage.user.education && settings.scripts.reminders.types.education,
		finished: () => userdata.education_current !== 0 || hasFinishedEducation(),
	},
];
