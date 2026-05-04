import type { PersonalStatsCrimesV1, PersonalStatsCrimesV2, UserHofResponse, UserPersonalStatsFull } from "tornapi-typescript";
import type { StoredUserdata } from "@/utils/common/data/default-database";

export type StatFormat = "currency";

export type StatDef = {
	name: string;
	type: string;

	format?: StatFormat;
} & (
	| { v2Getter: (data: UserPersonalStatsFull) => number }
	| { targetGetter: (data: UserPersonalStatsFull & UserHofResponse) => number; playerGetter: (data: StoredUserdata) => number }
);

export const STATS: StatDef[] = [
	// Attacking
	{ name: "Attacks won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.won },
	{ name: "Attacks lost", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.lost },
	{ name: "Attacks stalemated", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.stalemate },
	{ name: "Attacks assisted", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.assist },
	{ name: "Defends won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.won },
	{ name: "Defends lost", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.lost },
	{ name: "Defends stalemated", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.stalemate },
	{ name: "Defends total", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.total },
	{ name: "Elo rating", type: "attacking", v2Getter: (data) => data.personalstats.attacking.elo },
	{ name: "Times escaped", type: "attacking", v2Getter: (data) => data.personalstats.attacking.escapes.player },
	{ name: "Foes escaped", type: "attacking", v2Getter: (data) => data.personalstats.attacking.escapes.foes },
	{ name: "Unarmored fights won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.unarmored_wins },
	{ name: "Best kill streak", type: "attacking", v2Getter: (data) => data.personalstats.attacking.killstreak.best },
	{ name: "Hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.success },
	{ name: "Misses", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.miss },
	{ name: "Total damage made", type: "attacking", v2Getter: (data) => data.personalstats.attacking.damage.total },
	{ name: "Best damage made", type: "attacking", v2Getter: (data) => data.personalstats.attacking.damage.best },
	{ name: "One hit kills", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.one_hit_kills },
	{ name: "Critical hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.critical },
	{ name: "Rounds fired", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.total },
	{ name: "Special ammunition used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.special },
	{ name: "Hollow point ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.hollow_point },
	{ name: "Tracer ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.tracer },
	{ name: "Piercing ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.piercing },
	{ name: "Incendiary ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.incendiary },
	{ name: "Stealth attacks", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.stealth },
	{ name: "Retaliations", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.retaliations },
	{ name: "Money mugged", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.money_mugged, format: "currency" },
	{ name: "Largest mug", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.largest_mug, format: "currency" },
	{ name: "Items looted", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.items_looted },
	{ name: "Highest level beaten", type: "attacking", v2Getter: (data) => data.personalstats.attacking.highest_level_beaten },
	{ name: "Total respect", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.respect },
	{ name: "Ranked war hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.ranked_war_hits },
	{ name: "Raid hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.raid_hits },
	{ name: "Territory wall joins", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_joins },
	{ name: "Territory clears", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_clears },
	{ name: "Territory wall time", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_time },

	// Jobs
	{
		name: "Total working stats",
		type: "jobs",
		playerGetter: (data) => data.workstats.total,
		targetGetter: (data) => data.hof.working_stats.value,
	},
	{ name: "Job points used", type: "jobs", v2Getter: (data) => data.personalstats.jobs.job_points_used },
	{ name: "Times trained by director", type: "jobs", v2Getter: (data) => data.personalstats.jobs.trains_received },

	// Trading
	{ name: "Items bought from market", type: "trading", v2Getter: (data) => data.personalstats.trading.items.bought.market },
	{ name: "Auctions won", type: "trading", v2Getter: (data) => data.personalstats.trading.items.auctions.won },
	{ name: "Items auctioned", type: "trading", v2Getter: (data) => data.personalstats.trading.items.auctions.sold },
	{ name: "Item sends", type: "trading", v2Getter: (data) => data.personalstats.trading.items.sent },
	{ name: "Trades made", type: "trading", v2Getter: (data) => data.personalstats.trading.trades },
	{ name: "Shop purchases", type: "trading", v2Getter: (data) => data.personalstats.trading.items.bought.shops },
	{ name: "Points bought", type: "trading", v2Getter: (data) => data.personalstats.trading.points.bought },
	{ name: "Points sold", type: "trading", v2Getter: (data) => data.personalstats.trading.points.sold },
	{ name: "Bazaar customers", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.customers },
	{ name: "Bazaar sales", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.sales },
	{ name: "Bazaar revenue", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.profit },
	{ name: "Item Market customers", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.customers },
	{ name: "Item Market sales", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.sales },
	{ name: "Item Market revenue", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.revenue },
	{ name: "Item Market fees paid", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.fees },

	// Jail
	{ name: "Times jailed", type: "jail", v2Getter: (data) => data.personalstats.jail.times_jailed },
	{ name: "People busted", type: "jail", v2Getter: (data) => data.personalstats.jail.busts.success },
	{ name: "Failed busts", type: "jail", v2Getter: (data) => data.personalstats.jail.busts.fails },
	{ name: "People bailed", type: "jail", v2Getter: (data) => data.personalstats.jail.bails.amount },
	{ name: "Bail fees", type: "jail", v2Getter: (data) => data.personalstats.jail.bails.fees, format: "currency" },

	// Hospital
	{ name: "Times in hospital", type: "hospital", v2Getter: (data) => data.personalstats.hospital.times_hospitalized },
	{ name: "Medical items used", type: "hospital", v2Getter: (data) => data.personalstats.hospital.medical_items_used },
	{ name: "Blood withdrawn", type: "hospital", v2Getter: (data) => data.personalstats.hospital.blood_withdrawn },
	{ name: "Revive skill", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.skill },
	{ name: "Revives given", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.revives },
	{ name: "Revives received", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.revives_received },

	// Finishing Hits
	{ name: "Heavy artillery", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.heavy_artillery },
	{ name: "Machine guns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.machine_guns },
	{ name: "Rifles", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.rifles },
	{ name: "Sub machine guns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.sub_machine_guns },
	{ name: "Shotguns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.shotguns },
	{ name: "Pistols", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.pistols },
	{ name: "Temporary weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.temporary },
	{ name: "Piercing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.piercing },
	{ name: "Slashing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.slashing },
	{ name: "Clubbing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.clubbing },
	{ name: "Mechanical weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.mechanical },
	{ name: "Hand-to-hand", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.hand_to_hand },

	// Communication
	{ name: "Mails sent", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.total },
	{ name: "Mails to friends", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.friends },
	{ name: "Mails to faction", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.faction },
	{ name: "Mails to colleagues", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.colleagues },
	{ name: "Mails to spouse", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.spouse },
	{ name: "Classified ads placed", type: "communication", v2Getter: (data) => data.personalstats.communication.classified_ads },
	{ name: "Personals placed", type: "communication", v2Getter: (data) => data.personalstats.communication.personals },

	// Criminal Offenses
	{
		name: "Total offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			(crimes) => crimes.total,
			(crimes) => crimes.offenses.total,
		),
	},
	{
		name: "Vandalism offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.vandalism,
		),
	},
	{
		name: "Theft offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.theft,
		),
	},
	{
		name: "Counterfeiting offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.counterfeiting,
		),
	},
	{
		name: "Fraud offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.fraud,
		),
	},
	{
		name: "Illicit services offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.illicit_services,
		),
	},
	{
		name: "Cybercrime offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.cybercrime,
		),
	},
	{
		name: "Extortion offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.extortion,
		),
	},
	{
		name: "Illegal production offenses",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.offenses.illegal_production,
		),
	},
	{
		name: "Organized crimes",
		type: "criminal offenses",
		v2Getter: crimesStats(
			(crimes) => crimes.organized_crimes,
			(crimes) => crimes.offenses.organized_crimes,
		),
	},
	{
		name: "Search for cash skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.search_for_cash,
		),
	},
	{
		name: "Bootlegging skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.bootlegging,
		),
	},
	{
		name: "Graffiti skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.graffiti,
		),
	},
	{
		name: "Shoplifting skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.shoplifting,
		),
	},
	{
		name: "Pickpocketing skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.pickpocketing,
		),
	},
	{
		name: "Card Skimming skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.card_skimming,
		),
	},
	{
		name: "Burglary skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.burglary,
		),
	},
	{
		name: "Hustling skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.hustling,
		),
	},
	{
		name: "Disposal skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.disposal,
		),
	},
	{
		name: "Cracking skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.cracking,
		),
	},
	{
		name: "Forgery skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.forgery,
		),
	},
	{
		name: "Scamming skill",
		type: "criminal offenses",
		v2Getter: crimesStats(
			() => 0,
			(crimes) => crimes.skills.scamming,
		),
	},

	// Bounties
	{ name: "Bounties placed", type: "bounties", v2Getter: (data) => data.personalstats.bounties.placed.amount },
	{ name: "Spent on bounties", type: "bounties", v2Getter: (data) => data.personalstats.bounties.placed.value, format: "currency" },
	{ name: "Bounties collected", type: "bounties", v2Getter: (data) => data.personalstats.bounties.collected.amount },
	{ name: "Money rewarded", type: "bounties", v2Getter: (data) => data.personalstats.bounties.collected.value, format: "currency" },
	{ name: "Bounties received", type: "bounties", v2Getter: (data) => data.personalstats.bounties.received.amount },
	{ name: "Received value", type: "bounties", v2Getter: (data) => data.personalstats.bounties.received.value, format: "currency" },

	// Items
	{ name: "Items found", type: "items", v2Getter: (data) => data.personalstats.items.found.city },
	{ name: "Items found in dump", type: "items", v2Getter: (data) => data.personalstats.items.found.dump },
	{ name: "Items trashed", type: "items", v2Getter: (data) => data.personalstats.items.trashed },
	{ name: "Books read", type: "items", v2Getter: (data) => data.personalstats.items.used.books },
	{ name: "Boosters used", type: "items", v2Getter: (data) => data.personalstats.items.used.boosters },
	{ name: "Consumables used", type: "items", v2Getter: (data) => data.personalstats.items.used.consumables },
	{ name: "Candy eaten", type: "items", v2Getter: (data) => data.personalstats.items.used.candy },
	{ name: "Alcohol drunk", type: "items", v2Getter: (data) => data.personalstats.items.used.alcohol },
	{ name: "Energy drinks drunk", type: "items", v2Getter: (data) => data.personalstats.items.used.energy_drinks },
	{ name: "Stat enhancers used", type: "items", v2Getter: (data) => data.personalstats.items.used.stat_enhancers },
	{ name: "Easter eggs found", type: "items", v2Getter: (data) => data.personalstats.items.found.easter_eggs },
	{ name: "Easter eggs used", type: "items", v2Getter: (data) => data.personalstats.items.used.easter_eggs },
	{ name: "Viruses coded", type: "items", v2Getter: (data) => data.personalstats.items.viruses_coded },

	// Travel
	{ name: "Times traveled", type: "travel", v2Getter: (data) => data.personalstats.travel.total },
	{ name: "Time spent traveling", type: "travel", v2Getter: (data) => data.personalstats.travel.time_spent },
	{ name: "Items bought abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.items_bought },
	{ name: "Hunting skill", type: "travel", v2Getter: (data) => data.personalstats.travel.hunting.skill },
	{ name: "Attacks won abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.attacks_won },
	{ name: "Defends lost abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.defends_lost },
	{ name: "Argentina", type: "travel", v2Getter: (data) => data.personalstats.travel.argentina },
	{ name: "Mexico", type: "travel", v2Getter: (data) => data.personalstats.travel.mexico },
	{ name: "United Arab Emirates", type: "travel", v2Getter: (data) => data.personalstats.travel.united_arab_emirates },
	{ name: "Hawaii", type: "travel", v2Getter: (data) => data.personalstats.travel.hawaii },
	{ name: "Japan", type: "travel", v2Getter: (data) => data.personalstats.travel.japan },
	{ name: "United Kingdom", type: "travel", v2Getter: (data) => data.personalstats.travel.united_kingdom },
	{ name: "South Africa", type: "travel", v2Getter: (data) => data.personalstats.travel.south_africa },
	{ name: "Switzerland", type: "travel", v2Getter: (data) => data.personalstats.travel.switzerland },
	{ name: "China", type: "travel", v2Getter: (data) => data.personalstats.travel.china },
	{ name: "Canada", type: "travel", v2Getter: (data) => data.personalstats.travel.canada },
	{ name: "Cayman Islands", type: "travel", v2Getter: (data) => data.personalstats.travel.cayman_islands },

	// Drugs
	{ name: "Drugs used", type: "drugs", v2Getter: (data) => data.personalstats.drugs.total },
	{ name: "Times overdosed", type: "drugs", v2Getter: (data) => data.personalstats.drugs.overdoses },
	{ name: "Rehabilitations", type: "drugs", v2Getter: (data) => data.personalstats.drugs.rehabilitations.amount },
	{ name: "Rehabilitation fees", type: "drugs", v2Getter: (data) => data.personalstats.drugs.rehabilitations.fees, format: "currency" },
	{ name: "Cannabis taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.cannabis },
	{ name: "Ecstasy taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.ecstasy },
	{ name: "Ketamine taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.ketamine },
	{ name: "LSD taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.lsd },
	{ name: "Opium taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.opium },
	{ name: "PCP taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.pcp },
	{ name: "Shrooms taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.shrooms },
	{ name: "Speed taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.speed },
	{ name: "Vicodin taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.vicodin },
	{ name: "Xanax taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.xanax },

	// Missions
	{ name: "Missions completed", type: "missions", v2Getter: (data) => data.personalstats.missions.missions },
	{ name: "Duke contracts completed", type: "missions", v2Getter: (data) => data.personalstats.missions.contracts.duke },
	{ name: "Contracts completed", type: "missions", v2Getter: (data) => data.personalstats.missions.contracts.total },
	{ name: "Mission credits earned", type: "missions", v2Getter: (data) => data.personalstats.missions.credits },

	// Racing
	{ name: "Racing skill", type: "racing", v2Getter: (data) => data.personalstats.racing.skill },
	{ name: "Racing points earned", type: "racing", v2Getter: (data) => data.personalstats.racing.points },
	{ name: "Races entered", type: "racing", v2Getter: (data) => data.personalstats.racing.races.entered },
	{ name: "Races won", type: "racing", v2Getter: (data) => data.personalstats.racing.races.won },

	// Networth
	{ name: "Networth", type: "networth", v2Getter: (data) => data.personalstats.networth.total, format: "currency" },

	// Other
	{ name: "Time played", type: "other", v2Getter: (data) => data.personalstats.other.activity.time },
	{ name: "Current activity streak", type: "other", v2Getter: (data) => data.personalstats.other.activity.streak.current },
	{ name: "Best activity streak", type: "other", v2Getter: (data) => data.personalstats.other.activity.streak.best },
	{ name: "Awards", type: "other", v2Getter: (data) => data.personalstats.other.awards },
	{ name: "Energy refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.energy },
	{ name: "Nerve refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.nerve },
	{ name: "Token refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.token },
	{ name: "Merits bought", type: "other", v2Getter: (data) => data.personalstats.other.merits_bought },
	{ name: "Days been a donator", type: "other", v2Getter: (data) => data.personalstats.other.donator_days },
	{ name: "Ranked warring wins", type: "other", v2Getter: (data) => data.personalstats.other.ranked_war_wins },
];

function crimesStats(c1Getter: (data: PersonalStatsCrimesV1) => number, c2Getter: (data: PersonalStatsCrimesV2) => number) {
	return (data: UserPersonalStatsFull) => {
		const cVersion = data.personalstats.crimes.version;
		if (cVersion === "v1") return c1Getter(data.personalstats.crimes as PersonalStatsCrimesV1);
		else if (cVersion === "v2") return c2Getter(data.personalstats.crimes as PersonalStatsCrimesV2);
		else throw new Error(`Unsupported crimes version '${cVersion}'!`);
	};
}
