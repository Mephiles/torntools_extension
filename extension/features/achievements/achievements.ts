import "./achievements.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings, stockdata, torndata, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { checkDevice, elementBuilder, findElementWithText, mobile, tablet } from "@/utils/common/functions/dom";
import { requireElement, requireSidebar } from "@/utils/common/functions/requires";
import { formatNumber, formatTime } from "@/utils/common/functions/formatting";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { countTimers } from "@/utils/common/functions/timers";
import type { TornV1Stock } from "@/utils/common/functions/api-v1.types";
import { getPage } from "@/utils/common/functions/torn";

type Achievement = {
	name: string;
	group?: string;
	type?: string;
	stats: () => number;
	detection?: {
		keyword?: string;
		include?: string[];
		exclude?: string[];
		goals?: { score: number; type: "honors" | "medals"; id: number }[];
	};
	requirements: { pages: string[]; condition?: () => boolean };
};

interface EnrichedGoal {
	score: number;
	completed: boolean;
	count: number;
}
type EnrichedAchievement = Achievement & { goals: EnrichedGoal[]; current: number; completed: boolean };

const ACHIEVEMENTS: Achievement[] = [
	{
		name: "Perks",
		stats: () =>
			userdata.education_perks.length +
			userdata.enhancer_perks.length +
			userdata.faction_perks.length +
			userdata.job_perks.length +
			userdata.book_perks.length +
			userdata.merit_perks.length +
			userdata.property_perks.length +
			userdata.stock_perks.length,
		detection: { keyword: "personal perks" },
		requirements: { pages: ["home"] },
	},
	{ name: "Current activity streak", stats: () => userdata.personalstats.other.activity.streak.current, requirements: { pages: ["home"] } },
	{
		name: "Best activity streak",
		stats: () => userdata.personalstats.other.activity.streak.best,
		detection: { keyword: "online every day" },
		requirements: { pages: ["home"] },
	},
	{ name: "Awards", stats: () => userdata.personalstats.other.awards, detection: { keyword: "total awards" }, requirements: { pages: ["home", "awards"] } },
	{
		name: "Married (days)",
		stats: () => userdata.profile.spouse?.days_married ?? 0,
		detection: { keyword: "stay married" },
		requirements: { pages: ["home", "church"] },
	},
	{
		name: "Points sold",
		stats: () => userdata.personalstats.trading.points.sold,
		detection: { keyword: "points on the market" },
		requirements: { pages: ["home", "points-market"] },
	},
	{
		name: "Activity",
		stats: () => Math.floor(userdata.personalstats.other.activity.time / (TO_MILLIS.HOURS / TO_MILLIS.SECONDS)),
		detection: { keyword: "activity" },
		requirements: { pages: ["home"] },
	},
	{
		name: "Bazaar buyers",
		stats: () => userdata.personalstats.trading.bazaar.customers,
		detection: { keyword: "customers buy from your bazaar" },
		requirements: { pages: ["home", "bazaar"] },
	},
	{
		name: "Stock payouts",
		stats: () => userdata.personalstats.investments.stocks.payouts,
		detection: { keyword: "payouts" },
		requirements: { pages: ["home", "stocks"] },
	},
	{
		name: "Donator (days)",
		stats: () => userdata.personalstats.other.donator_days,
		detection: { keyword: "donator" },
		requirements: { pages: ["home", "donator"] },
	},
	{
		name: "Energy refills",
		group: "refills",
		stats: () => userdata.personalstats.other.refills.energy,
		detection: { keyword: "refill", include: ["energy"] },
		requirements: { pages: ["home", "points"] },
	},
	{
		name: "Nerve refills",
		group: "refills",
		stats: () => userdata.personalstats.other.refills.nerve,
		detection: { keyword: "refill", include: ["nerve"] },
		requirements: { pages: ["home", "points"] },
	},
	{
		name: "Casino refills",
		group: "refills",
		stats: () => userdata.personalstats.other.refills.token,
		detection: { keyword: "refill", include: ["casino"] },
		requirements: { pages: ["home", "points"] },
	},
	{ name: "Networth", stats: () => userdata.personalstats.networth.total, detection: { keyword: "networth" }, requirements: { pages: ["home"] } },
	{
		name: "Bounties collected",
		stats: () => userdata.personalstats.bounties.collected.amount,
		detection: { keyword: "bounties", include: ["collect"] },
		requirements: { pages: ["bounties"] },
	},
	{
		name: "Bounties collected (money)",
		stats: () => userdata.personalstats.bounties.collected.value,
		detection: { keyword: "bounty", include: ["earn", "hunting"] },
		requirements: { pages: ["bounties"] },
	},
	{
		name: "Donations",
		stats: () => {
			const description = document.querySelector("#church-donate .desc > p:first-child > span");
			if (!description) return -1;
			return parseInt(description.textContent.substring(1).replaceAll(",", ""));
		},
		detection: { keyword: "church" },
		requirements: { pages: ["church"] },
	},
	{
		name: "City finds",
		stats: () => userdata.personalstats.items.found.city,
		detection: { keyword: "city", include: ["find", "items"] },
		requirements: { pages: ["city"] },
	},
	{
		name: "Dump finds",
		stats: () => userdata.personalstats.items.found.dump,
		detection: { keyword: "dump", exclude: ["market value"] },
		requirements: { pages: ["dump"] },
	},
	{
		name: "Complete courses",
		stats: () => userdata.education_completed.length,
		detection: { keyword: "education courses" },
		requirements: { pages: ["education"] },
	},
	{
		name: "Biology Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(42) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 53 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Business Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(13) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 54 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Combat Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(87) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 55 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "ICT Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(62) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 56 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "General Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(121) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 58 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Fitness Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(111) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 59 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "History Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(21) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 60 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Law Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(102) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 61 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Mathematics Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(33) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 62 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Psychology Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(69) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 63 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Defense Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(42) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 57 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Sports Bachelor",
		type: "bachelor",
		stats: () => (userdata.education_completed.includes(51) ? 1 : 0),
		detection: { goals: [{ score: 1, type: "honors", id: 64 }] },
		requirements: { pages: ["education"] },
	},
	{
		name: "Respect",
		stats: () => userdata.personalstats.attacking.faction.respect,
		detection: { keyword: "respect", include: ["earn"], exclude: ["hit"] },
		requirements: { pages: ["factions"] },
	},
	{
		name: "Revives",
		stats: () => userdata.personalstats.hospital.reviving.revives,
		detection: { keyword: "revive", exclude: ["within", "someone"] },
		requirements: { pages: ["hospital"] },
	},
	{
		name: "Hospital visits",
		stats: () => userdata.personalstats.hospital.times_hospitalized,
		detection: { keyword: "go to hospital" },
		requirements: { pages: ["hospital"] },
	},
	{
		name: "Cannabis",
		type: "drugs",
		stats: () => userdata.personalstats.drugs.cannabis,
		detection: { keyword: "cannabis", include: ["use"] },
		requirements: { pages: ["item"] },
	},
	{ name: "Ecstasy", type: "drugs", stats: () => userdata.personalstats.drugs.ecstasy, detection: { keyword: "ecstasy" }, requirements: { pages: ["item"] } },
	{
		name: "Ketamine",
		type: "drugs",
		stats: () => userdata.personalstats.drugs.ketamine,
		detection: { keyword: "ketamine" },
		requirements: { pages: ["item"] },
	},
	{ name: "LSD", type: "drugs", stats: () => userdata.personalstats.drugs.lsd, detection: { keyword: "lsd" }, requirements: { pages: ["item"] } },
	{ name: "Opium", type: "drugs", stats: () => userdata.personalstats.drugs.opium, detection: { keyword: "opium" }, requirements: { pages: ["item"] } },
	{ name: "Shrooms", type: "drugs", stats: () => userdata.personalstats.drugs.shrooms, detection: { keyword: "shrooms" }, requirements: { pages: ["item"] } },
	{
		name: "Speed",
		type: "drugs",
		stats: () => userdata.personalstats.drugs.speed,
		detection: { keyword: "speed", exclude: ["gain"] },
		requirements: { pages: ["item"] },
	},
	{ name: "PCP", type: "drugs", stats: () => userdata.personalstats.drugs.pcp, detection: { keyword: "pcp" }, requirements: { pages: ["item"] } },
	{ name: "Xanax", type: "drugs", stats: () => userdata.personalstats.drugs.xanax, detection: { keyword: "xanax" }, requirements: { pages: ["item"] } },
	{ name: "Vicodin", type: "drugs", stats: () => userdata.personalstats.drugs.vicodin, detection: { keyword: "vicodin" }, requirements: { pages: ["item"] } },
	{ name: "Viruses", stats: () => userdata.personalstats.items.viruses_coded, detection: { keyword: "viruses" }, requirements: { pages: ["item"] } },
	{
		name: "Fill blood",
		stats: () => userdata.personalstats.hospital.blood_withdrawn,
		detection: { keyword: "blood", include: ["fill"] },
		requirements: { pages: ["item"] },
	},
	{
		name: "Items dumped",
		stats: () => userdata.personalstats.items.trashed,
		detection: { keyword: "items", include: ["trash"] },
		requirements: { pages: ["item"] },
	},
	{ name: "Alcohol used", stats: () => userdata.personalstats.items.used.alcohol, detection: { keyword: "alcohol" }, requirements: { pages: ["item"] } },
	{ name: "Candy used", stats: () => userdata.personalstats.items.used.candy, detection: { keyword: "candy" }, requirements: { pages: ["item"] } },
	{
		name: "Medicals used",
		stats: () => userdata.personalstats.hospital.medical_items_used,
		detection: { keyword: "medical items", include: ["use"] },
		requirements: { pages: ["item"] },
	},
	{
		name: "Energy drinks used",
		stats: () => userdata.personalstats.items.used.energy_drinks,
		detection: { keyword: "energy drink" },
		requirements: { pages: ["item"] },
	},
	{ name: "Books read", stats: () => userdata.personalstats.items.used.books, detection: { keyword: "books" }, requirements: { pages: ["item"] } },
	{ name: "Jail visits", stats: () => userdata.personalstats.jail.times_jailed, detection: { keyword: "go to jail" }, requirements: { pages: ["jail"] } },
	{ name: "Busts", stats: () => userdata.personalstats.jail.busts.success, detection: { keyword: "bust" }, requirements: { pages: ["jail"] } },
	{ name: "Bails", stats: () => userdata.personalstats.jail.bails.amount, detection: { keyword: "bails" }, requirements: { pages: ["jail"] } },
	{
		name: "Attacks won",
		stats: () => userdata.personalstats.attacking.attacks.won,
		detection: { keyword: "attacks", include: ["win"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Defends won",
		stats: () => userdata.personalstats.attacking.defends.won,
		detection: { keyword: "defend", exclude: ["achieve", "someone", "and"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Assists",
		stats: () => userdata.personalstats.attacking.attacks.assist,
		detection: { keyword: "assist", include: ["attacks"], goals: [{ score: 1, type: "honors", id: 639 }] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Stealthed",
		stats: () => userdata.personalstats.attacking.attacks.stealth,
		detection: { keyword: "stealthed attacks" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Stalemates",
		stats: () => userdata.personalstats.attacking.defends.stalemate + userdata.personalstats.attacking.attacks.stalemate,
		detection: { keyword: "stalemate" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Escapes",
		stats: () => userdata.personalstats.attacking.escapes.player,
		detection: { keyword: "escape", include: ["successfully", "foes"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Enemy Escapes",
		stats: () => userdata.personalstats.attacking.escapes.foes,
		detection: { keyword: "escape", include: ["enemies"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Unarmored wins",
		stats: () => userdata.personalstats.attacking.unarmored_wins,
		detection: { keyword: "unarmored" },
		requirements: { pages: ["missions"] },
	},
	{ name: "Current killstreak", type: "killstreak", stats: () => userdata.personalstats.attacking.killstreak.current, requirements: { pages: ["missions"] } },
	{
		name: "Best streak",
		type: "killstreak",
		stats: () => userdata.personalstats.attacking.killstreak.best,
		detection: { keyword: "streak", exclude: ["high-low"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Total hits",
		stats: () => userdata.personalstats.attacking.hits.success,
		detection: { keyword: "hits", exclude: ["critical", "finishing", "single chain"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Critical hits",
		stats: () => userdata.personalstats.attacking.hits.critical,
		detection: { keyword: "critical" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Best damage",
		stats: () => userdata.personalstats.attacking.damage.best,
		detection: { keyword: "damage", include: ["deal at least"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "One hit kills",
		stats: () => userdata.personalstats.attacking.hits.one_hit_kills,
		detection: { keyword: "one hit", include: ["kills"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Rounds fired",
		stats: () => userdata.personalstats.attacking.ammunition.total,
		detection: { keyword: "rounds", include: ["fire"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Special ammunition fired",
		stats: () => userdata.personalstats.attacking.ammunition.special,
		detection: { keyword: "special ammunition", include: ["use"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Hollow point rounds fired",
		stats: () => userdata.personalstats.attacking.ammunition.hollow_point,
		detection: { keyword: "hollow point rounds", include: ["use"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Piercing rounds fired",
		stats: () => userdata.personalstats.attacking.ammunition.piercing,
		detection: { keyword: "piercing rounds", include: ["use"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Incendiary rounds fired",
		stats: () => userdata.personalstats.attacking.ammunition.incendiary,
		detection: { keyword: "incendiary rounds", include: ["use"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Tracer rounds fired",
		stats: () => userdata.personalstats.attacking.ammunition.tracer,
		detection: { keyword: "tracer rounds", include: ["use"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Clubbing hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.clubbing,
		detection: { keyword: "clubbing" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Pistol hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.pistols,
		detection: { keyword: "pistols" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Rifle hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.rifles,
		detection: { keyword: "rifles" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Shotgun hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.shotguns,
		detection: { keyword: "shotguns" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Piercing hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.piercing,
		detection: { keyword: "piercing", include: ["weapons"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Slashing hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.slashing,
		detection: { keyword: "slashing" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Heavy hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.heavy_artillery,
		detection: { keyword: "heavy artillery" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "SMG hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.sub_machine_guns,
		detection: { keyword: "smgs" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Machine gun hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.machine_guns,
		detection: { keyword: "machine guns" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Fists or kick hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.hand_to_hand,
		detection: { keyword: "fists or kick" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Mechanical hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.mechanical,
		detection: { keyword: "mechanical weapons" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Temporary hits",
		type: "finishing hits",
		stats: () => userdata.personalstats.finishing_hits.temporary,
		detection: { keyword: "temporary weapons" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Largest mug",
		stats: () => userdata.personalstats.attacking.networth.largest_mug,
		detection: { keyword: "mugging", include: ["make", "single"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Mission credits",
		stats: () => userdata.personalstats.missions.credits,
		detection: { keyword: "credits", include: ["mission"] },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Contracts",
		stats: () => userdata.personalstats.missions.contracts.total,
		detection: { keyword: "contracts" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Races won",
		stats: () => userdata.personalstats.racing.races.won,
		detection: { keyword: "races", include: ["win"], exclude: ["single car"] },
		requirements: { pages: ["racing"] },
	},
	{
		name: "Racing skill",
		stats: () => userdata.personalstats.racing.skill,
		detection: { keyword: "racing", include: ["skill"] },
		requirements: { pages: ["racing"] },
	},
	{
		name: "Points",
		stats: () => userdata.personalstats.racing.points,
		detection: { keyword: "racing", include: ["points"] },
		requirements: { pages: ["racing"] },
	},
	{ name: "Argentina", stats: () => userdata.personalstats.travel.argentina, detection: { keyword: "argentina" }, requirements: { pages: ["travel"] } },
	{ name: "Canada", stats: () => userdata.personalstats.travel.canada, detection: { keyword: "canada" }, requirements: { pages: ["travel"] } },
	{ name: "Caymans", stats: () => userdata.personalstats.travel.cayman_islands, detection: { keyword: "cayman" }, requirements: { pages: ["travel"] } },
	{ name: "China", stats: () => userdata.personalstats.travel.china, detection: { keyword: "china" }, requirements: { pages: ["travel"] } },
	{
		name: "UAE",
		stats: () => userdata.personalstats.travel.united_arab_emirates,
		detection: { keyword: "united arab emirates" },
		requirements: { pages: ["travel"] },
	},
	{ name: "Hawaii", stats: () => userdata.personalstats.travel.hawaii, detection: { keyword: "hawaii" }, requirements: { pages: ["travel"] } },
	{ name: "Japan", stats: () => userdata.personalstats.travel.japan, detection: { keyword: "japan" }, requirements: { pages: ["travel"] } },
	{ name: "UK", stats: () => userdata.personalstats.travel.united_kingdom, detection: { keyword: "kingdom" }, requirements: { pages: ["travel"] } },
	{ name: "Mexico", stats: () => userdata.personalstats.travel.mexico, detection: { keyword: "mexico" }, requirements: { pages: ["travel"] } },
	{
		name: "South Africa",
		stats: () => userdata.personalstats.travel.south_africa,
		detection: { keyword: "south africa" },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Switzerland",
		stats: () => userdata.personalstats.travel.switzerland,
		detection: { keyword: "switzerland" },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Times traveled",
		stats: () => userdata.personalstats.travel.total,
		detection: { keyword: "travel", exclude: ["to"] },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Days traveled",
		stats: () => Math.floor(userdata.personalstats.travel.time_spent / (TO_MILLIS.DAYS / TO_MILLIS.SECONDS)),
		detection: { keyword: "spend", include: ["days", "air"] },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Items bought abroad",
		stats: () => userdata.personalstats.travel.items_bought,
		detection: { keyword: "import", include: ["items"] },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Strength",
		stats: () => userdata.battlestats.strength.value,
		detection: { keyword: "strength", include: ["gain"] },
		requirements: { pages: ["gym"] },
	},
	{ name: "Speed", stats: () => userdata.battlestats.speed.value, detection: { keyword: "speed", include: ["gain"] }, requirements: { pages: ["gym"] } },
	{
		name: "Defense",
		stats: () => userdata.battlestats.defense.value,
		detection: { keyword: "defense", include: ["gain"] },
		requirements: { pages: ["gym"] },
	},
	{
		name: "Dexterity",
		stats: () => userdata.battlestats.dexterity.value,
		detection: { keyword: "dexterity", include: ["gain"] },
		requirements: { pages: ["gym"] },
	},
	{ name: "Total", stats: () => userdata.battlestats.total, detection: { keyword: "total stats" }, requirements: { pages: ["gym"] } },
	{
		name: "Manual labor",
		type: "workstats",
		stats: () => userdata.workstats.manual_labor,
		detection: { keyword: "manual labor" },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Intelligence",
		type: "workstats",
		stats: () => userdata.workstats.intelligence,
		detection: { keyword: "intelligence" },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Endurance",
		type: "workstats",
		stats: () => userdata.workstats.endurance,
		detection: { keyword: "endurance", exclude: ["challenge"] },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Highest stat",
		type: "workstats",
		stats: () => Math.max(userdata.workstats.manual_labor, userdata.workstats.intelligence, userdata.workstats.endurance),
		detection: { keyword: "any working stat" },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Damage",
		stats: () => userdata.personalstats.attacking.damage.total,
		detection: { keyword: "total damage" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "100% weapon EXP",
		stats: () => userdata.weaponexp.filter((weapon) => weapon.exp === 100).length,
		detection: { keyword: "100% exp" },
		requirements: { pages: ["missions"] },
	},
	{
		name: "Days in faction",
		stats: () => userdata.faction?.days_in_faction ?? 0,
		detection: { keyword: "days in a single faction" },
		requirements: { pages: ["factions"] },
	},
	{
		name: "Auctions",
		stats: () => userdata.personalstats.trading.items.auctions.won,
		detection: { keyword: "auctions" },
		requirements: { pages: ["auction"] },
	},
	{
		name: "Defeat abroad",
		stats: () => userdata.personalstats.travel.attacks_won,
		detection: { keyword: "abroad", include: ["defeat"] },
		requirements: { pages: ["travel"] },
	},
	{
		name: "Hunting skill",
		stats: () => userdata.skills.find(({ slug }) => slug === "hunting")?.level ?? 0,
		detection: { keyword: "hunting", include: ["skill"] },
		requirements: { pages: ["home", "travel"] },
	},
	{
		name: "Job points",
		stats: () => userdata.personalstats.jobs.job_points_used,
		detection: { keyword: "job points" },
		requirements: { pages: ["companies"] },
	},
	{
		name: "Stock profit",
		stats: () => userdata.personalstats.investments.stocks.profits,
		detection: { keyword: "total profit" },
		requirements: { pages: ["stocks"] },
	},
	{
		name: "Stock loss",
		stats: () => userdata.personalstats.investments.stocks.losses,
		detection: { keyword: "total losses" },
		requirements: { pages: ["stocks"] },
	},
	{
		name: "Stock investment",
		stats: () =>
			userdata.stocks
				.map(stock => stock.shares * (stockdata[stock.id] as TornV1Stock).current_price).reduce((total, value) => total + value, 0),
		detection: { keyword: "stock market", include: ["invest"] },
		requirements: { pages: ["stocks"] },
	},
	{
		name: "Age",
		stats: () => userdata.profile.age,
		detection: {
			goals: [
				{ score: 365, type: "medals", id: 225 },
				{ score: 730, type: "medals", id: 226 },
				{ score: 1095, type: "medals", id: 227 },
				{ score: 1460, type: "medals", id: 228 },
				{ score: 1825, type: "medals", id: 229 },
				{ score: 2190, type: "medals", id: 230 },
				{ score: 2555, type: "medals", id: 231 },
				{ score: 2920, type: "medals", id: 232 },
				{ score: 3285, type: "medals", id: 234 },
				{ score: 3650, type: "medals", id: 235 },
			],
		},
		requirements: { pages: ["home"] },
	},
	{
		name: "Level",
		stats: () => userdata.profile.level,
		detection: {
			goals: [
				{ score: 5, type: "medals", id: 34 },
				{ score: 10, type: "medals", id: 35 },
				{ score: 10, type: "honors", id: 18 },
				{ score: 15, type: "medals", id: 36 },
				{ score: 20, type: "medals", id: 37 },
				{ score: 25, type: "medals", id: 38 },
				{ score: 30, type: "medals", id: 39 },
				{ score: 35, type: "medals", id: 40 },
				{ score: 40, type: "medals", id: 41 },
				{ score: 45, type: "medals", id: 42 },
				{ score: 50, type: "medals", id: 43 },
				{ score: 50, type: "honors", id: 259 },
				{ score: 55, type: "medals", id: 44 },
				{ score: 60, type: "medals", id: 45 },
				{ score: 65, type: "medals", id: 46 },
				{ score: 70, type: "medals", id: 47 },
				{ score: 75, type: "medals", id: 48 },
				{ score: 75, type: "honors", id: 13 },
				{ score: 80, type: "medals", id: 49 },
				{ score: 85, type: "medals", id: 50 },
				{ score: 90, type: "medals", id: 51 },
				{ score: 95, type: "medals", id: 52 },
				{ score: 100, type: "medals", id: 53 },
				{ score: 100, type: "honors", id: 264 },
				{ score: 100, type: "honors", id: 265 },
			],
		},
		requirements: { pages: ["home"] },
	},
];

async function showAchievements() {
	await requireSidebar();

	let achievements = getRelevantAchievements(getPage());

	if (!settings.scripts.achievements.completed) {
		achievements = achievements.filter((achievement) => !achievement.completed);
	}

	if (!achievements.length) {
		removeAchievements();
		return;
	}

	displayContainer(achievements);

	function getRelevantAchievements(page: string): EnrichedAchievement[] {
		return ACHIEVEMENTS.filter(
			(achievement) =>
				(!achievement.requirements.pages || achievement.requirements.pages.includes(page)) &&
				(!achievement.requirements.condition || achievement.requirements.condition())
		)
			.map<EnrichedAchievement>((achievement) => {
				const goals: EnrichedGoal[] = [];
				let current: number;
				let completed: boolean;

				try {
					current = achievement.stats();
				} catch (error) {
					console.error(`Achievement "${achievement.name}" failed to calculate its score.`, error);
					current = -1;
				}

				if (achievement.detection) {
					let { keyword, include, exclude, goals: detectedGoals } = achievement.detection;
					if (!include) include = [];
					if (!exclude) exclude = [];

					if (keyword) {
						for (const type of ["honors", "medals"] as ("honors" | "medals")[]) {
							const merits = torndata[type];

							for (const merit of merits) {
								const description = merit.description.toLowerCase();
								if (!description.includes(keyword)) continue;

								if (include.length && !include.every((incl) => description.includes(incl))) continue;
								if (exclude.length && exclude.some((excl) => description.includes(excl))) continue;

								let desc = description;
								desc = desc.split("for at least")[0]; // remove 'day' numbers from networth
								desc = desc.replace(/\D|\d+%/g, ""); // replace all non-numbers and percentages

								const score = parseInt(desc) || null;
								if (score === null || isNaN(score)) continue;

								// Remove duplicates.
								const duplicate = goals.find((goal) => goal.score === score);
								if (duplicate) {
									duplicate.count++;
									continue;
								}

								goals.push({
									score,
									completed: !!userdata[type].find((a: any) => a.id === merit.id),
									count: 1,
								});
							}
						}
					}

					if (detectedGoals) {
						goals.push(...detectedGoals.map(({ score, type, id }) => ({ score, completed: !!userdata[type].find((a) => a.id === id), count: 1 })));
					}

					goals.sort((a, b) => a.score - b.score);
					completed = goals.every((goal) => goal.completed);
				}

				return {
					...achievement,
					goals,
					current,
					completed,
				};
			})
			.sort((a, b) => {
				const groupA = (a.group ?? a.name).toUpperCase();
				const groupB = (b.group ?? b.name).toUpperCase();

				if (groupA !== groupB) return groupA.localeCompare(groupB);
				return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
			});
	}

	function displayContainer(achievements: EnrichedAchievement[]) {
		const { content, options } = createContainer("Awards", {
			applyRounding: false,
			contentBackground: false,
			compact: true,
			previousElement: findElementWithText<Element>("h2", "Areas").closest("[class*='sidebar-block_']"),
		});
		showTimer();

		const tooltipContent = elementBuilder({ type: "div", class: "tt-achievement-tooltip-content" });
		const tooltip = elementBuilder({
			type: "div",
			class: "tt-achievement-tooltip",
			children: [elementBuilder({ type: "div", class: "tt-achievement-tooltip-arrow" }), tooltipContent],
		});
		document.body.appendChild(tooltip);

		for (const achievement of achievements) {
			const hasGoals = achievement.goals && achievement.goals.length > 0;

			const dataset: { [key: string]: any } = { score: achievement.current };
			let text: string;
			if (achievement.completed) text = "Completed!";
			else if (hasGoals) {
				const nextGoal = achievement.goals.find((goal) => !goal.completed);
				text = `${formatNumber(achievement.current, { shorten: true })}/${formatNumber(nextGoal?.score || achievement.current, { shorten: true })}`;
			} else {
				text = formatNumber(achievement.current, { shorten: true });
			}

			if (hasGoals) dataset.goals = achievement.goals.map(({ score, completed }) => ({ score, completed }));

			const pill = elementBuilder({
				type: "div",
				class: `pill tt-award ${achievement.completed ? "completed" : ""}`,
				text: `${achievement.name}: ${text}`,
				attributes: { tabindex: "-1" },
				dataset,
			});

			if (hasGoals) {
				if (!mobile && !tablet) {
					pill.addEventListener("mouseenter", showTooltip);
					pill.addEventListener("mouseleave", hideTooltip);
				}

				pill.addEventListener("focus", showTooltip);
				pill.addEventListener("blur", hideTooltip);
			}

			content.appendChild(pill);
		}

		function showTimer() {
			const timer = elementBuilder({
				type: "span",
				class: "tt-awards-time-ago",
				text: formatTime({ milliseconds: userdata.dateBasic }, { type: "ago", short: true }),
				dataset: {
					seconds: Math.floor(userdata.dateBasic / TO_MILLIS.SECONDS),
					timeSettings: { type: "ago", short: true },
				},
			});
			options.appendChild(timer);
			countTimers.push(timer);
		}

		function showTooltip(event: Event) {
			const target = event.target as HTMLElement;
			if (target.classList.contains("active")) return;

			const active = document.querySelector(".tt-award.active");
			if (active) active.classList.remove("active");

			target.classList.add("active");

			const position = target.getBoundingClientRect();
			const positionBody = document.body.getBoundingClientRect();
			tooltip.style.left = `${position.x + 172 + 7}px`;
			tooltip.style.top = `${position.y + Math.abs(positionBody.y) + 6}px`;
			tooltip.style.display = "block";
			tooltipContent.innerHTML = "";

			const progress = elementBuilder({ type: "ol", class: "awards-progress" });

			const score = parseInt(target.dataset.score);
			const goals = JSON.parse(target.dataset.goals);

			let addedScore = false;
			for (const goal of goals) {
				if (goal.score > score && !addedScore) {
					progress.appendChild(getNode(score, false, true));
					addedScore = true;
				}

				if (goal.score !== score) {
					progress.appendChild(getNode(goal.score, goal.completed, false));
				}
			}
			if (!addedScore) {
				progress.appendChild(getNode(score, false, true));
			}

			tooltipContent.appendChild(progress);

			function getNode(score: number, isCompleted: boolean, isActive: boolean) {
				return elementBuilder({
					type: "li",
					class: `${isCompleted ? "is-completed" : ""} ${isActive ? "is-current" : ""}`,
					children: [elementBuilder({ type: "span", text: formatNumber(score, { shorten: 3, decimals: 1 }) })],
				});
			}
		}

		function hideTooltip(event: Event) {
			if (document.activeElement === event.target) return;
			(event.target as Element).classList.remove("active");

			tooltip.style.display = "none";
		}
	}
}

function removeAchievements() {
	removeContainer("Awards");
}

export default class AchievementsFeature extends Feature {
	constructor() {
		super("Achievements", "achievements", ExecutionTiming.IMMEDIATELY);
	}

	async requirements() {
		await requireElement("body");
		const devices = await checkDevice();
		if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

		if (
			!hasAPIData() ||
			!settings.apiUsage.user.personalstats ||
			!settings.apiUsage.user.perks ||
			!settings.apiUsage.user.medals ||
			!settings.apiUsage.user.honors ||
			!settings.apiUsage.user.crimes ||
			!settings.apiUsage.user.battlestats ||
			!settings.apiUsage.user.workstats ||
			!settings.apiUsage.user.skills ||
			!settings.apiUsage.user.weaponexp
		)
			return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.achievements.show;
	}

	async execute() {
		await showAchievements();
	}

	cleanup() {
		removeAchievements();
	}

	storageKeys() {
		return ["settings.scripts.achievements.show", "settings.scripts.achievements.completed"];
	}
}
