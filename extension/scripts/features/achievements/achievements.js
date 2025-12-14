const ACHIEVEMENTS = [
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
			const description = document.find("#church-donate .desc > p:first-child > span");
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
	{ name: "Strength", stats: () => userdata.strength, detection: { keyword: "strength", include: ["gain"] }, requirements: { pages: ["gym"] } },
	{ name: "Speed", stats: () => userdata.speed, detection: { keyword: "speed", include: ["gain"] }, requirements: { pages: ["gym"] } },
	{ name: "Defense", stats: () => userdata.defense, detection: { keyword: "defense", include: ["gain"] }, requirements: { pages: ["gym"] } },
	{ name: "Dexterity", stats: () => userdata.dexterity, detection: { keyword: "dexterity", include: ["gain"] }, requirements: { pages: ["gym"] } },
	{ name: "Total", stats: () => userdata.total, detection: { keyword: "total stats" }, requirements: { pages: ["gym"] } },
	{
		name: "Manual labor",
		type: "workstats",
		stats: () => userdata.manual_labor,
		detection: { keyword: "manual labor" },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Intelligence",
		type: "workstats",
		stats: () => userdata.intelligence,
		detection: { keyword: "intelligence" },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Endurance",
		type: "workstats",
		stats: () => userdata.endurance,
		detection: { keyword: "endurance", exclude: ["challenge"] },
		requirements: { pages: ["education", "companies"] },
	},
	{
		name: "Highest stat",
		type: "workstats",
		stats: () => Math.max(userdata.manual_labor, userdata.intelligence, userdata.endurance),
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
		stats: () => userdata.hunting,
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

	// Both Crimes versions
	{ name: "Total crimes", stats: () => userdata.criminalrecord.total, detection: { keyword: "criminal offenses" }, requirements: { pages: ["crimes"] } },

	// Crimes 1.0
	{
		name: "Illegal products",
		stats: () => userdata.criminalrecord.selling_illegal_products,
		detection: { keyword: "bootlegging", include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Theft",
		stats: () => userdata.criminalrecord.theft,
		detection: { keyword: "theft", exclude: ["auto"], include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Drug dealing",
		stats: () => userdata.criminalrecord.drug_deals,
		detection: { keyword: "drug dealing", include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Computer",
		stats: () => userdata.criminalrecord.computer_crimes,
		detection: { keyword: "computer", include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Murder",
		stats: () => userdata.criminalrecord.murder,
		detection: { keyword: "murder", include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Auto theft",
		stats: () => userdata.criminalrecord.auto_theft,
		detection: { keyword: "theft", include: ["auto", "crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Fraud",
		stats: () => userdata.criminalrecord.fraud_crimes,
		detection: { keyword: "fraud", include: ["crimes"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Other crimes",
		stats: () => userdata.criminalrecord.other,
		detection: { keyword: "other crimes" },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},
	{
		name: "Org. crimes",
		stats: () => userdata.personalstats.crimes.organized_crimes,
		detection: { keyword: "organized crimes" },
		requirements: { pages: ["factions"], condition: () => userdata.personalstats.crimes.version === "v1" },
	},

	// Crimes 2.0
	{
		name: "Fraud",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.fraud,
		detection: { keyword: "fraud", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Theft",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.theft,
		detection: { keyword: "theft", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Vandalism",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.vandalism,
		detection: { keyword: "vandalism", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Counterfeiting",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.counterfeiting,
		detection: { keyword: "counterfeiting", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Illicit Service",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.illicit_services,
		detection: { keyword: "illicit service", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Cybercrime",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.cybercrime,
		detection: { keyword: "cybercrime", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Extortion",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.extortion,
		detection: { keyword: "extortion", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Illegal Production",
		group: "crime total",
		stats: () => userdata.personalstats.crimes.offenses.illegal_production,
		detection: { keyword: "illegal production", include: ["offenses"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Search for Cash Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.search_for_cash,
		detection: { keyword: "search for cash", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Bootlegging Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.bootlegging,
		detection: { keyword: "bootlegging", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Graffiti Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.graffiti,
		detection: { keyword: "graffiti", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Shoplifting Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.shoplifting,
		detection: { keyword: "shoplifting", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Card Skimming Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.card_skimming,
		detection: { keyword: "card skimming", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Burglary Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.burglary,
		detection: { keyword: "burglary", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Pickpocketing Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.pickpocketing,
		detection: { keyword: "pickpocketing", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Hustling Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.hustling,
		detection: { keyword: "hustling", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Disposal Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.disposal,
		detection: { keyword: "disposal", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Cracking Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.cracking,
		detection: { keyword: "cracking", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Forgery Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.forgery,
		detection: { keyword: "forgery", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Scamming Skill",
		group: "crime skill",
		stats: () => userdata.personalstats.crimes.skills.scamming,
		detection: { keyword: "scamming", include: ["skill"] },
		requirements: { pages: ["crimes"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
	{
		name: "Org. crimes",
		stats: () => userdata.personalstats.crimes.offenses.organized_crimes,
		detection: { keyword: "organized crimes" },
		requirements: { pages: ["factions"], condition: () => userdata.personalstats.crimes.version === "v2" },
	},
];

// noinspection JSUnusedGlobalSymbols
function validateAchievements() {
	const EXPLICITLY_IGNORED_MEDALS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
	const EXPLICITLY_IGNORED_HONORS = [
		3, 5, 8, 9, 10, 12, 14, 19, 21, 26, 156, 167, 212, 213, 214, 215, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 228, 230, 231, 233, 234, 235, 237,
		246, 253, 254, 255, 256, 257, 258, 263, 269, 274, 275, 276, 277, 278, 279, 280, 281, 283, 284, 288, 294, 297, 298, 306, 308, 309, 311, 312, 313, 315,
		316, 317, 318, 321, 322, 326, 327, 330, 338, 367, 371, 375, 380, 395, 406, 414, 417, 427, 431, 437, 443, 459, 475, 476, 477, 478, 481, 488, 491, 500,
		513, 519, 527, 544, 545, 548, 605, 608, 611, 615, 617, 627, 631, 641, 665, 670, 676, 678, 699, 700, 716, 717, 719, 729, 730, 731, 734, 739, 743, 781,
		827, 828, 838, 839, 843, 845, 851, 853, 860, 863, 869, 870, 871, 882, 888, 896, 902, 916, 951, 955, 964, 966, 969, 1007, 1012, 1031, 1032, 1038, 1054,
		1076, 1097, 1106, 1129, 1136, 1166,
	];

	const nonMatchingMedals = torndata.medals
		.filter(({ id, ...medal }) => ACHIEVEMENTS.every((a) => !matchesAchievement(a, medal, id, "medals")))
		.filter(({ id }) => !EXPLICITLY_IGNORED_MEDALS.includes(id));
	const nonMatchingHonors = torndata.honors
		.filter(({ id, ...honor }) => ACHIEVEMENTS.every((a) => !matchesAchievement(a, honor, id, "honors")))
		.filter((honor) => "rarity" in honor)
		.filter(({ id }) => !EXPLICITLY_IGNORED_HONORS.includes(id));

	return { nonMatchingMedals, nonMatchingHonors };

	function matchesAchievement(achievement, merit, id, type) {
		if (achievement.detection) {
			let { keyword, include, exclude, goals } = achievement.detection;
			if (goals && goals.some((g) => g.type === type && id === g.id)) {
				return true;
			}

			if (!include) include = [];
			if (!exclude) exclude = [];

			const description = merit.description.toLowerCase();
			if (
				description.includes(keyword) &&
				(!include.length || include.every((incl) => description.includes(incl))) &&
				(!exclude.length || !exclude.some((excl) => description.includes(excl)))
			) {
				return true;
			}
		}

		return false;
	}
}
