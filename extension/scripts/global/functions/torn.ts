const LINKS = {
	auction: "https://www.torn.com/amarket.php",
	bank: "https://www.torn.com/bank.php",
	bazaar: "https://www.torn.com/bazaar.php",
	bounties: "https://www.torn.com/bounties.php#!p=main",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain",
	church: "https://www.torn.com/church.php",
	committee: "https://www.torn.com/committee.php",
	companies: "https://www.torn.com/companies.php",
	companyEmployees: "https://www.torn.com/companies.php#/option=employees",
	crimes: "https://www.torn.com/crimes.php",
	donator: "https://www.torn.com/donator.php",
	education: "https://www.torn.com/page.php?sid=education",
	events: "https://www.torn.com/events.php#/step=all",
	faction: "https://www.torn.com/factions.php",
	faction_oc: "https://www.torn.com/factions.php?step=your#/tab=crimes",
	gym: "https://www.torn.com/gym.php",
	home: "https://www.torn.com/index.php",
	homepage: "https://www.torn.com/index.php",
	hospital: "https://www.torn.com/hospitalview.php",
	itemmarket: "https://www.torn.com/page.php?sid=ItemMarket",
	items: "https://www.torn.com/item.php",
	items_booster: "https://www.torn.com/item.php#boosters-items",
	items_candy: "https://www.torn.com/item.php#candy-items",
	items_drug: "https://www.torn.com/item.php#drugs-items",
	items_medical: "https://www.torn.com/item.php#medical-items",
	jailview: "https://www.torn.com/jailview.php",
	jobs: "https://www.torn.com/companies.php",
	loan: "https://www.torn.com/loan.php",
	messages: "https://www.torn.com/messages.php",
	missions: "https://www.torn.com/loader.php?sid=missions",
	organizedCrimes: "https://www.torn.com/factions.php?step=your#/tab=crimes",
	pointsmarket: "https://www.torn.com/pmarket.php",
	property_upkeep: "https://www.torn.com/properties.php#/p=options&tab=upkeep",
	property_vault: "https://www.torn.com/properties.php#/p=options&tab=vault",
	raceway: "https://www.torn.com/page.php?sid=racing",
	staff: "https://www.torn.com/staff.php",
	stocks: "https://www.torn.com/page.php?sid=stocks",
	trade: "https://www.torn.com/trade.php",
	travelagency: "https://www.torn.com/page.php?sid=travel",
} as const;

// [...document.querySelectorAll("#iconTray > li")].map((icon) => ({ id: parseInt(icon.id.replace("icon", "")), icon: icon.id, description: icon.getAttribute("title").substring(3, icon.getAttribute("title").length - 4) }))
const ALL_ICONS = [
	{ id: 1, icon: "icon1", description: "Online" },
	{ id: 62, icon: "icon62", description: "Idle" },
	{ id: 2, icon: "icon2", description: "Offline" },
	{ id: 6, icon: "icon6", description: "Male" },
	{ id: 7, icon: "icon7", description: "Female" },
	{ id: 87, icon: "icon87", description: "Enby" },
	{ id: 72, icon: "icon72", description: "New player" },
	{ id: 3, icon: "icon3", description: "Donator", url: LINKS.donator },
	{ id: 4, icon: "icon4", description: "Subscriber", url: LINKS.donator },
	{ id: 11, icon: "icon11", description: "Staff", url: LINKS.staff },
	{ id: 10, icon: "icon10", description: "Committee", url: LINKS.committee },
	{ id: 8, icon: "icon8", description: "Marriage", url: LINKS.church },
	{ id: 5, icon: "icon5", description: "Level 100" },
	{ id: 21, icon: "icon21", description: "Army job", url: LINKS.jobs },
	{ id: 22, icon: "icon22", description: "Casino job", url: LINKS.jobs },
	{ id: 23, icon: "icon23", description: "Medical job", url: LINKS.jobs },
	{ id: 24, icon: "icon24", description: "Grocer job", url: LINKS.jobs },
	{ id: 25, icon: "icon25", description: "Lawyer job", url: LINKS.jobs },
	{ id: 26, icon: "icon26", description: "Education job", url: LINKS.jobs },
	{ id: 73, icon: "icon73", description: "Company director", url: LINKS.companies },
	{ id: 27, icon: "icon27", description: "Company employee", url: LINKS.companies },
	{ id: 83, icon: "icon83", description: "Company recruit", url: LINKS.companies },
	{ id: 74, icon: "icon74", description: "Faction leader / co-leader", url: LINKS.faction },
	{ id: 9, icon: "icon9", description: "Faction member", url: LINKS.faction },
	{ id: 81, icon: "icon81", description: "Faction recruit", url: LINKS.faction },
	{ id: 75, icon: "icon75", description: "Territory war (defending)", url: LINKS.faction },
	{ id: 76, icon: "icon76", description: "Territory war (assaulting)", url: LINKS.faction },
	{ id: 19, icon: "icon19", description: "Education in progress", url: LINKS.education },
	{ id: 20, icon: "icon20", description: "Education completed", url: LINKS.education },
	{ id: 29, icon: "icon29", description: "Investment in progress", url: LINKS.bank },
	{ id: 30, icon: "icon30", description: "Investment completed", url: LINKS.bank },
	{ id: 31, icon: "icon31", description: "Cayman islands bank", url: LINKS.travelagency },
	{ id: 32, icon: "icon32", description: "Property vault", url: LINKS.property_vault },
	{ id: 33, icon: "icon33", description: "Loan", url: LINKS.loan },
	{ id: 34, icon: "icon34", description: "Items in auction", url: LINKS.auction },
	{ id: 35, icon: "icon35", description: "Items in bazaar", url: LINKS.bazaar },
	{ id: 36, icon: "icon36", description: "Items in item market", url: LINKS.itemmarket },
	{ id: 54, icon: "icon54", description: "Points market", url: LINKS.pointsmarket },
	{ id: 38, icon: "icon38", description: "Stocks owned", url: LINKS.stocks },
	{ id: 84, icon: "icon84", description: "Dividend collection ready", url: LINKS.stocks },
	{ id: 37, icon: "icon37", description: "Trade in progress", url: LINKS.trade },
	{ id: 68, icon: "icon68", description: "Reading book" },
	{ id: 71, icon: "icon71", description: "Traveling", url: LINKS.homepage },
	{ id: 17, icon: "icon17", description: "Racing in progress", url: LINKS.raceway },
	{ id: 18, icon: "icon18", description: "Racing completed", url: LINKS.raceway },
	{ id: 85, icon: "icon85", description: "Organized crime being planned", url: LINKS.faction_oc },
	{ id: 86, icon: "icon86", description: "Organized crime ready", url: LINKS.faction_oc },
	{ id: 89, icon: "icon89", description: "Organized crime recruiting", url: LINKS.faction_oc },
	{ id: 90, icon: "icon90", description: "Organized crime completed", url: LINKS.faction_oc },
	{ id: 13, icon: "icon13", description: "Bounty", url: LINKS.bounties },
	{ id: 28, icon: "icon28", description: "Cashier's checks", url: LINKS.bank },
	{ id: 55, icon: "icon55", description: "Auction high bidder", url: LINKS.auction },
	{ id: 56, icon: "icon56", description: "Auction outbid", url: LINKS.auction },
	{ id: 15, icon: "icon15", description: "Hospital", url: LINKS.hospital },
	{ id: 82, icon: "icon82", description: "Hospital early discharge", url: LINKS.hospital },
	{ id: 16, icon: "icon16", description: "Jail", url: LINKS.jailview },
	{ id: 70, icon: "icon70", description: "Federal jail" },
	{ id: 12, icon: "icon12", description: "Low life", url: LINKS.hospital },
	{ id: 39, icon: "icon39", description: "Booster cooldown (0-6hr)", url: LINKS.items_booster },
	{ id: 40, icon: "icon40", description: "Booster cooldown (6-12hr)", url: LINKS.items_booster },
	{ id: 41, icon: "icon41", description: "Booster cooldown (12-18hr)", url: LINKS.items_booster },
	{ id: 42, icon: "icon42", description: "Booster cooldown (18-24hr)", url: LINKS.items_booster },
	{ id: 43, icon: "icon43", description: "Booster cooldown (24hr+)", url: LINKS.items_booster },
	{ id: 44, icon: "icon44", description: "Medical cooldown (0-90m)", url: LINKS.items_medical },
	{ id: 45, icon: "icon45", description: "Medical cooldown (90-180m)", url: LINKS.items_medical },
	{ id: 46, icon: "icon46", description: "Medical cooldown (180m-270m)", url: LINKS.items_medical },
	{ id: 47, icon: "icon47", description: "Medical cooldown (270-360m)", url: LINKS.items_medical },
	{ id: 48, icon: "icon48", description: "Medical cooldown (360m+)", url: LINKS.items_medical },
	{ id: 49, icon: "icon49", description: "Drug cooldown (0-10m)", url: LINKS.items_drug },
	{ id: 50, icon: "icon50", description: "Drug cooldown (10-60m)", url: LINKS.items_drug },
	{ id: 51, icon: "icon51", description: "Drug cooldown (1-2hr)", url: LINKS.items_drug },
	{ id: 52, icon: "icon52", description: "Drug cooldown (2-5hr)", url: LINKS.items_drug },
	{ id: 53, icon: "icon53", description: "Drug cooldown (5hr+)", url: LINKS.items_drug },
	{ id: 57, icon: "icon57", description: "Drug addiction (1-4%)", url: LINKS.travelagency },
	{ id: 58, icon: "icon58", description: "Drug addiction (5-9%)", url: LINKS.travelagency },
	{ id: 59, icon: "icon59", description: "Drug addiction (10-19%)", url: LINKS.travelagency },
	{ id: 60, icon: "icon60", description: "Drug addiction (20-29%)", url: LINKS.travelagency },
	{ id: 61, icon: "icon61", description: "Drug addiction (30%+)", url: LINKS.travelagency },
	{ id: 63, icon: "icon63", description: "Radiation sickness (1-17%)", url: LINKS.items_medical },
	{ id: 64, icon: "icon64", description: "Radiation sickness (18-34%)", url: LINKS.items_medical },
	{ id: 65, icon: "icon65", description: "Radiation sickness (35-50%)", url: LINKS.items_medical },
	{ id: 66, icon: "icon66", description: "Radiation sickness (51-67%)", url: LINKS.items_medical },
	{ id: 67, icon: "icon67", description: "Radiation sickness (68%+)", url: LINKS.items_medical },
	{ id: 78, icon: "icon78", description: "Upkeep due (4-6%)", url: LINKS.property_upkeep },
	{ id: 79, icon: "icon79", description: "Upkeep due (6-8%)", url: LINKS.property_upkeep },
	{ id: 80, icon: "icon80", description: "Upkeep due (8%+)", url: LINKS.property_upkeep },
] as const;
const ALL_AREAS = [
	{ class: "home", text: "Home" },
	{ class: "items", text: "Items" },
	{ class: "city", text: "City" },
	{ class: "job", text: "Job" },
	{ class: "gym", text: "Gym" },
	{ class: "properties", text: "Properties" },
	{ class: "education", text: "Education" },
	{ class: "crimes", text: "Crimes" },
	{ class: "missions", text: "Missions" },
	{ class: "newspaper", text: "Newspaper" },
	{ class: "jail", text: "Jail" },
	{ class: "hospital", text: "Hospital" },
	{ class: "casino", text: "Casino" },
	{ class: "forums", text: "Forums" },
	{ class: "hall_of_fame", text: "Hall of Fame" },
	{ class: "faction", text: "My Faction" },
	{ class: "recruit_citizens", text: "Recruit Citizens" },
	{ class: "competitions", text: "Competitions" },
	{ class: "community_events", text: "Community Events" },
] as const;

const ALLOWED_BLOOD = {
	"o+": [738, 739], // 738
	"o-": [739], // 739
	"a+": [732, 733, 738, 739], // 732
	"a-": [733, 739], // 733
	"b+": [734, 735, 738, 739], // 734
	"b-": [735, 739], // 735
	"ab+": [732, 733, 734, 735, 736, 737, 738, 739], // 736
	"ab-": [733, 735, 737, 739], // 737
} as const;

const CASINO_GAMES = ["slots", "roulette", "high-low", "keno", "craps", "bookie", "lottery", "blackjack", "poker", "r-roulete", "spin-the-wheel"] as const;

interface DrugDetail {
	pros: string[];
	cons?: string[];
	cooldown: string;
	overdose?: {
		bars: string[];
		hosp_time?: string;
		stats?: string;
		extra?: string;
	};
}

const DRUG_INFORMATION: { [id: number]: DrugDetail } = {
	// Cannabis
	196: {
		pros: ["+8-12 Nerve"],
		cons: ["-20% Strength", "-25% Defense", "-35% Speed"],
		cooldown: "60-90 minutes",
		overdose: {
			bars: ["-100% Energy & Nerve"],
			hosp_time: "5 hours",
			extra: "'Spaced Out' honor bar",
		},
	},
	// Ecstasy
	197: {
		pros: ["Doubles Happy"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy & Happy"],
		},
	},
	// Ketamine
	198: {
		pros: ["+50% Defense"],
		cons: ["-20% Strength & Speed"],
		cooldown: "45-60 minutes",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			stats: "-20% Strength & Speed",
			hosp_time: "16-17 hours",
			extra: "24-27 hours of cooldown",
		},
	},
	// LSD
	199: {
		pros: ["+30% Strength", "+50% Defense", "+50 Energy", "+200-500 Happy", "+5 Nerve"],
		cons: ["-30% Speed & Dexterity"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve", "-50% Happy"],
			stats: "-30% Speed & Dexterity",
		},
	},
	// Opium
	200: {
		pros: ["Removes all hospital time (except Radiation Sickness) and replenishes life to 50%", "+30% Defense"],
		cooldown: "2-3 hours",
	},
	// PCP
	201: {
		pros: ["+20% Strength & Dexterity", "+250 Happy"],
		cooldown: "4-7 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "27 hours",
			stats: "-10x(player level) Speed (permanent)",
		},
	},
	// Shrooms
	203: {
		pros: ["+500 Happy"],
		cons: ["-20% All Battle Stats", "-25 Energy (caps at 0)"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "1h 40min",
		},
	},
	// Speed
	204: {
		pros: ["+20% Speed", "+50 Happy"],
		cons: ["-20% Dexterity"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			stats: "-6x(player level) Strength & Defense (permanent)",
			hosp_time: "7h 30min",
		},
	},
	// Vicodin
	205: {
		pros: ["+25% All Battle Stats", "+75 Happy"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-150 Happy"],
		},
	},
	// Xanax
	206: {
		pros: ["+250 Energy", "+75 Happy"],
		cons: ["-35% All Battle Stats"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "3 days 12 hours",
			extra: "24 hours of cooldown and increased addiction.",
		},
	},
	// Love Juice
	870: {
		pros: ["Cost of attacking and reviving reduced by 10 energy.", "+50% Speed", "+25% Dexterity"],
		cons: ["Only works on Valentine's Day"],
		cooldown: "5-8 hours",
	},
};

/*
	Object.entries(companies)
		.map(([id, company]) => ({
			id: parseInt(id),
			name: company.name,
			specials: Object.entries(company.specials).map(([specialName, special]) => ({
				name: specialName,
				rating: special.rating_required,
				effect: special.effect,
				cost: special.cost ? special.cost.toString() : "Passive",
			})),
		}))
		.reduce((total, company) => {
			total[company.name] = company.specials.reduce((specialsTotal, special) => {
				specialsTotal[special.rating.toString()] = {
					name: special.name,
					cost: special.cost,
					effect: special.effect,
				};
				return specialsTotal;
			}, {});
			return total;
		}, {});
 */

interface CompanySpecial {
	name: string;
	cost: string;
	effect: string;
}

type CompanyStars = 1 | 3 | 5 | 7 | 10;

type CompanyInformation = Partial<Record<CompanyStars, CompanySpecial>>;

const COMPANY_INFORMATION: { [name: string]: CompanyInformation } = {
	"Adult Novelties": {
		1: {
			name: "Blackmail",
			cost: "1",
			effect: "Money",
		},
		3: {
			name: "Voyeur",
			cost: "20",
			effect: "Erotic DVD",
		},
		5: {
			name: "Party Supplies",
			cost: "500",
			effect: "Pack of Trojans",
		},
		7: {
			name: "Bondage",
			cost: "Passive",
			effect: "25% enemy speed reduction",
		},
		10: {
			name: "Indecent",
			cost: "Passive",
			effect: "100% happy gain from Erotic DVDs",
		},
	},
	"Amusement Park": {
		1: {
			name: "Dauntless",
			cost: "1",
			effect: "2 nerve",
		},
		3: {
			name: "Free Ride",
			cost: "10",
			effect: "250 happiness for target",
		},
		5: {
			name: "Unflinching",
			cost: "Passive",
			effect: "10 maximum nerve",
		},
		7: {
			name: "Adrenaline Rush",
			cost: "Passive",
			effect: "25% Epinephrine effectiveness & duration",
		},
		10: {
			name: "Thrill Seeker",
			cost: "Passive",
			effect: "10% crime exp & skill gain",
		},
	},
	"Candle Shop": {
		1: {
			name: "Warming Therapy",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Illumination",
			cost: "Passive",
			effect: "50% awareness",
		},
		5: {
			name: "Calming Therapy",
			cost: "1",
			effect: "2 nerve",
		},
		7: {
			name: "Reinvigorating Therapy",
			cost: "1",
			effect: "5 energy",
		},
		10: {
			name: "Meditation",
			cost: "250",
			effect: "View someone's true level",
		},
	},
	"Car Dealership": {
		1: {
			name: "Test Drive",
			cost: "5",
			effect: "Racing point",
		},
		3: {
			name: "Discount Parts",
			cost: "Passive",
			effect: "75% car parts cost reduction",
		},
		5: {
			name: "Salesman",
			cost: "Passive",
			effect: "Free anonymous Item Market listings",
		},
		7: {
			name: "Two-Faced",
			cost: "Passive",
			effect: "15% fraud crime exp & skill gain",
		},
		10: {
			name: "Getaway Car",
			cost: "Passive",
			effect: "Escape option always available during attacks",
		},
	},
	"Clothing Store": {
		1: {
			name: "Fashion Show",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Nine to Five",
			cost: "10",
			effect: "100 endurance",
		},
		5: {
			name: "Activewear",
			cost: "Passive",
			effect: "25% passive dexterity",
		},
		7: {
			name: "Secret Pockets",
			cost: "Passive",
			effect: "75% incoming mug reduction",
		},
		10: {
			name: "Tailoring",
			cost: "Passive",
			effect: "20% armor mitigation bonus",
		},
	},
	"Cruise Line": {
		1: {
			name: "Bursar",
			cost: "1",
			effect: "25 casino tokens",
		},
		3: {
			name: "Portage",
			cost: "Passive",
			effect: "2 travel item capacity",
		},
		5: {
			name: "R&R",
			cost: "1",
			effect: "Drug addiction reduction",
		},
		7: {
			name: "Destination Report",
			cost: "10",
			effect: "View stock analysis of all items at a selected country",
		},
		10: {
			name: "Freight",
			cost: "Passive",
			effect: "3 travel item capacity",
		},
	},
	"Cyber Cafe": {
		1: {
			name: "Ub3rg33k",
			cost: "Passive",
			effect: "50% coding time reduction",
		},
		3: {
			name: "Clone Data",
			cost: "25",
			effect: "Virus",
		},
		5: {
			name: "Proxy Hacking",
			cost: "25",
			effect: "Cancel a target's virus programming",
		},
		7: {
			name: "IP Tracing",
			cost: "25",
			effect: "View lister of anonymous bounties",
		},
		10: {
			name: "Financial Phishing",
			cost: "25",
			effect: "View details of someone's investment account",
		},
	},
	"Detective Agency": {
		1: {
			name: "References",
			cost: "2",
			effect: "View someone's employment & faction history",
		},
		3: {
			name: "Deputized",
			cost: "Passive",
			effect: "Arrest ability",
		},
		5: {
			name: "Friend or Foe",
			cost: "100",
			effect: "See who's added someone to their friend / enemy list",
		},
		7: {
			name: "Watchlist",
			cost: "50",
			effect: "Anonymously extend a target's flight time",
		},
		10: {
			name: "Most Wanted",
			cost: "25",
			effect: "View a list of highest wanted rewards",
		},
	},
	Farm: {
		1: {
			name: "Fulfillment",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Animal Instinct",
			cost: "Passive",
			effect: "25% hunting income",
		},
		5: {
			name: "Special K",
			cost: "5",
			effect: "Ketamine drug",
		},
		7: {
			name: "Fertilizer",
			cost: "100",
			effect: "Small explosive device",
		},
		10: {
			name: "Early Riser",
			cost: "1",
			effect: "7 energy",
		},
	},
	"Firework Stand": {
		1: {
			name: "Audaciousness",
			cost: "1",
			effect: "2 nerve",
		},
		3: {
			name: "Illumination",
			cost: "Passive",
			effect: "50% awareness",
		},
		5: {
			name: "Pyromania",
			cost: "Passive",
			effect: "Flamethrower damage & accuracy",
		},
		10: {
			name: "Inferno",
			cost: "25",
			effect: "Random incendiary ammunition ",
		},
	},
	"Fitness Center": {
		1: {
			name: "Healthy Mind",
			cost: "1",
			effect: "30 minute education time reduction",
		},
		3: {
			name: "Goal Oriented",
			cost: "Passive",
			effect: "50% happy loss reduction in gym",
		},
		5: {
			name: "Roid Rage",
			cost: "1",
			effect: "Strength",
		},
		7: {
			name: "Athlete",
			cost: "Passive",
			effect: "3% life regeneration per tick",
		},
		10: {
			name: "Training Regime",
			cost: "Passive",
			effect: "3% gym gains",
		},
	},
	"Flower Shop": {
		1: {
			name: "Rare Import",
			cost: "3",
			effect: "Special flower",
		},
		5: {
			name: "Herbal Cleansing",
			cost: "1",
			effect: "Drug addiction reduction",
		},
		7: {
			name: "Over Capacity",
			cost: "Passive",
			effect: "5 travel flower capacity",
		},
		10: {
			name: "Floral Contacts",
			cost: "10",
			effect: "View stock analysis of flowers in all countries",
		},
	},
	"Furniture Store": {
		1: {
			name: "Coffee Break",
			cost: "1",
			effect: "3 energy",
		},
		3: {
			name: "Heavy Lifting",
			cost: "1",
			effect: "Strength",
		},
		5: {
			name: "Removal",
			cost: "Passive",
			effect: "15% theft crime exp & skill gain",
		},
		7: {
			name: "Beefcake",
			cost: "Passive",
			effect: "25% passive strength",
		},
		10: {
			name: "Brute Force",
			cost: "Passive",
			effect: "100% fist & kick damage",
		},
	},
	"Game Shop": {
		1: {
			name: "Ub3rg33k",
			cost: "Passive",
			effect: "50% coding time reduction",
		},
		3: {
			name: "Early Release",
			cost: "100",
			effect: "Money",
		},
		5: {
			name: "Gamer",
			cost: "Passive",
			effect: "100% happy gain from Game Console",
		},
		7: {
			name: "Power Levelling",
			cost: "10",
			effect: "View progress to your next level",
		},
		10: {
			name: "Overpowered",
			cost: "1",
			effect: "1 nerve, 5 energy, 50 happiness",
		},
	},
	"Gas Station": {
		1: {
			name: "Molotov Cocktail",
			cost: "3",
			effect: "Molotov cocktail",
		},
		3: {
			name: "Fueled",
			cost: "Passive",
			effect: "25% passive speed",
		},
		5: {
			name: "Cauterize",
			cost: "Passive",
			effect: "Occasional healing during combat",
		},
		7: {
			name: "Fireproof",
			cost: "Passive",
			effect: "50% fire damage mitigation",
		},
		10: {
			name: "Blaze of Glory",
			cost: "Passive",
			effect: "50% fire damage dealt",
		},
	},
	"Gents Strip Club": {
		1: {
			name: "Happy Ending",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Dancer's Flair",
			cost: "Passive",
			effect: "25% passive dexterity",
		},
		5: {
			name: "Supple",
			cost: "Passive",
			effect: "50% Tyrosine effectiveness & duration",
		},
		7: {
			name: "Pilates",
			cost: "Passive",
			effect: "10% dexterity gym gains",
		},
		10: {
			name: "No Touching",
			cost: "Passive",
			effect: "25% chance of dodging incoming melee attacks",
		},
	},
	"Grocery Store": {
		1: {
			name: "Bagged Down",
			cost: "2",
			effect: "Bag of candy",
		},
		3: {
			name: "Fast Metabolism",
			cost: "Passive",
			effect: "10% consumable cooldown reduction",
		},
		5: {
			name: "Bottled Up",
			cost: "5",
			effect: "Bottle of alcohol",
		},
		7: {
			name: "Absorption",
			cost: "Passive",
			effect: "10% consumable gain",
		},
		10: {
			name: "Canned In",
			cost: "12",
			effect: "Can of energy drink",
		},
	},
	"Gun Shop": {
		1: {
			name: "Sales Discount",
			cost: "Passive",
			effect: "20% standard ammo cost reduction",
		},
		3: {
			name: "Surplus",
			cost: "15",
			effect: "Random special ammunition",
		},
		5: {
			name: "Skilled Analysis",
			cost: "Passive",
			effect: "Target loadout is always visible",
		},
		7: {
			name: "Bandoleer",
			cost: "Passive",
			effect: "1 extra clip for guns during attacks",
		},
		10: {
			name: "Firearms Expert",
			cost: "Passive",
			effect: "10% primary & secondary weapon damage",
		},
	},
	"Hair Salon": {
		1: {
			name: "Debate",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Gossip",
			cost: "10",
			effect: "View someone's money on hand",
		},
		5: {
			name: "Rumors",
			cost: "Passive",
			effect: "2.0 opponent stealth reduction",
		},
		7: {
			name: "Cutting Corners",
			cost: "1",
			effect: "30 minute education time reduction",
		},
		10: {
			name: "Sweeney's Revenge",
			cost: "Passive",
			effect: "20% slashing weapon damage",
		},
	},
	"Ladies Strip Club": {
		1: {
			name: "Hot Flush",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Hench",
			cost: "Passive",
			effect: "25% passive defense",
		},
		5: {
			name: "Hormonal",
			cost: "Passive",
			effect: "50% Serotonin effectiveness & duration",
		},
		7: {
			name: "Boxercise",
			cost: "Passive",
			effect: "10% defense gym gains",
		},
		10: {
			name: "Hardbody",
			cost: "Passive",
			effect: "30% incoming melee attacks damage reduction",
		},
	},
	"Law Firm": {
		1: {
			name: "Bail Bondsman",
			cost: "Passive",
			effect: "50% bail cost reduction",
		},
		3: {
			name: "Background Check",
			cost: "10",
			effect: "View someone's battle stats",
		},
		5: {
			name: "Closing Argument",
			cost: "Passive",
			effect: "Easier to bust more people at once",
		},
		7: {
			name: "Loophole",
			cost: "Passive",
			effect: "20% passive crime XP during Organized Crimes",
		},
		10: {
			name: "Educated Decisions",
			cost: "Passive",
			effect: "View success chance of potential busts",
		},
	},
	"Lingerie Store": {
		1: {
			name: "Nine to Five",
			cost: "10",
			effect: "100 endurance",
		},
		3: {
			name: "Concealment",
			cost: "Passive",
			effect: "2 travel item capacity",
		},
		5: {
			name: "Born Free",
			cost: "Passive",
			effect: "50% passive speed & dexterity when not wearing armor",
		},
		7: {
			name: "Simp",
			cost: "Passive",
			effect: "No property upkeep or staff costs",
		},
		10: {
			name: "Sex Appeal",
			cost: "Passive",
			effect: "Free business class upgrades",
		},
	},
	"Logistics Management": {
		1: {
			name: "Efficiency",
			cost: "1",
			effect: "Speed",
		},
		3: {
			name: "Organized",
			cost: "Passive",
			effect: "2 additional open mission contracts",
		},
		5: {
			name: "Repatriated",
			cost: "Passive",
			effect: "Return from abroad while in hospital",
		},
		7: {
			name: "Contraband",
			cost: "50",
			effect: "Shipment of foreign goods",
		},
		10: {
			name: "Logistics Report",
			cost: "250",
			effect: "Company productivity boost",
		},
	},
	"Meat Warehouse": {
		1: {
			name: "Blood Thirst",
			cost: "1",
			effect: "2 nerve",
		},
		3: {
			name: "Blood Splatter",
			cost: "Passive",
			effect: "50% crime penalty reduction",
		},
		5: {
			name: "Carnage",
			cost: "Passive",
			effect: "10 maximum nerve",
		},
		7: {
			name: "Huntsman",
			cost: "Passive",
			effect: "25% hunting skill gain",
		},
		10: {
			name: "Vampiric",
			cost: "Passive",
			effect: "3.0% life regeneration",
		},
	},
	"Mechanic Shop": {
		1: {
			name: "Machinist",
			cost: "5",
			effect: "Racing point",
		},
		3: {
			name: "Discount Parts",
			cost: "Passive",
			effect: "75% car parts cost reduction",
		},
		5: {
			name: "Junkyard Dog",
			cost: "10",
			effect: "Random car",
		},
		7: {
			name: "Refurbish",
			cost: "Passive",
			effect: "Lose no car parts after crashing",
		},
		10: {
			name: "Driver",
			cost: "Passive",
			effect: "50% racing skill gain",
		},
	},
	"Mining Corporation": {
		1: {
			name: "Mining Boom",
			cost: "5",
			effect: "Random excavation equipment",
		},
		3: {
			name: "Thirsty Work",
			cost: "Passive",
			effect: "30% alcohol cooldown reduction",
		},
		5: {
			name: "Rock Salt",
			cost: "1",
			effect: "Defense",
		},
		7: {
			name: "Essential Salts",
			cost: "Passive",
			effect: "10% maximum life",
		},
		10: {
			name: "Preserved Meat",
			cost: "25",
			effect: "Boosts current life to 150% of maximum",
		},
	},
	"Music Store": {
		1: {
			name: "Ambience",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Well Tuned",
			cost: "Passive",
			effect: "30% gym experience",
		},
		5: {
			name: "High-fidelity",
			cost: "Passive",
			effect: "2.0 opponent stealth reduction",
		},
		7: {
			name: "Deafened",
			cost: "10",
			effect: "Maximum stealth",
		},
		10: {
			name: "The Score",
			cost: "Passive",
			effect: "15% passive battle stats",
		},
	},
	Nightclub: {
		1: {
			name: "Criminal Connections",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Target Market",
			cost: "Passive",
			effect: "15% illicit services crime exp & skill gain",
		},
		5: {
			name: "Suppression",
			cost: "1",
			effect: "Drug addiction",
		},
		7: {
			name: "Tolerance",
			cost: "Passive",
			effect: "50% drug overdose risk reduction",
		},
		10: {
			name: "Restraint",
			cost: "Passive",
			effect: "Education is unaffected by drug addiction",
		},
	},
	"Oil Rig": {
		1: {
			name: "Danger Money",
			cost: "1",
			effect: "Money",
		},
		3: {
			name: "Embargo",
			cost: "50",
			effect: "Halve a target's happiness",
		},
		5: {
			name: "Oil Mogul",
			cost: "3",
			effect: "Reduce bank investment time by 1 hour",
		},
		7: {
			name: "Tax Haven",
			cost: "Passive",
			effect: "10% offshore bank interest",
		},
		10: {
			name: "Fat Cat",
			cost: "Passive",
			effect: "50% investment banking limit",
		},
	},
	"Private Security Firm": {
		1: {
			name: "Off the Grid",
			cost: "20",
			effect: "72 hour bounty protection",
		},
		3: {
			name: "Tactical Breach",
			cost: "Passive",
			effect: "50% Flash Grenade intensity",
		},
		5: {
			name: "Open Arsenal",
			cost: "75",
			effect: "Primary or Secondary weapon",
		},
		7: {
			name: "Regulation",
			cost: "Passive",
			effect: "25% full set armor mitigation bonus",
		},
		10: {
			name: "Mercenary",
			cost: "1",
			effect: "3 mission credits",
		},
	},
	"Property Broker": {
		1: {
			name: "Commission",
			cost: "1",
			effect: "Money",
		},
		3: {
			name: "Job Satisfaction",
			cost: "1",
			effect: "50 happiness",
		},
		5: {
			name: "Vendor",
			cost: "Passive",
			effect: "Free anonymous Item Market listings",
		},
		7: {
			name: "Insider Trading",
			cost: "150",
			effect: "Random property",
		},
		10: {
			name: "Interior Connections",
			cost: "Passive",
			effect: "10% property upgrade cost reduction",
		},
	},
	Pub: {
		1: {
			name: "Pub Lunch",
			cost: "1",
			effect: "3 energy",
		},
		3: {
			name: "Drunken Master",
			cost: "Passive",
			effect: "10% melee weapon damage",
		},
		5: {
			name: "Liquid Courage",
			cost: "25",
			effect: "Refill nerve bar",
		},
		7: {
			name: "Lightweight",
			cost: "Passive",
			effect: "50% nerve gain from alcohol",
		},
		10: {
			name: "Buzzed",
			cost: "Passive",
			effect: "15 maximum nerve",
		},
	},
	Restaurant: {
		1: {
			name: "Free Meals",
			cost: "1",
			effect: "3 energy",
		},
		3: {
			name: "Butcher",
			cost: "Passive",
			effect: "10% melee weapon damage",
		},
		5: {
			name: "Flambayed",
			cost: "50",
			effect: "Flame thrower",
		},
		7: {
			name: "Healthy Diet",
			cost: "Passive",
			effect: "2.0% life regeneration",
		},
		10: {
			name: "Professional Metabolism",
			cost: "Passive",
			effect: "25% consumable cooldown reduction",
		},
	},
	"Software Corporation": {
		1: {
			name: "Ub3rg33k",
			cost: "Passive",
			effect: "50% coding time reduction",
		},
		3: {
			name: "Proxy Hacking",
			cost: "25",
			effect: "Cancel a target's virus programming",
		},
		5: {
			name: "Intricate Hack",
			cost: "250",
			effect: "Hack a company's bank account",
		},
		7: {
			name: "Hack the Planet",
			cost: "Passive",
			effect: "15% cybercrime success & skill gain",
		},
		10: {
			name: "Corporate Espionage",
			cost: "50",
			effect: "View financial details of a company",
		},
	},
	"Sweet Shop": {
		1: {
			name: "Sweet Tooth",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Sugar Rush",
			cost: "2",
			effect: "Bag of candy",
		},
		5: {
			name: "Gluttony",
			cost: "10",
			effect: "1,000 happiness",
		},
		7: {
			name: "Energy Rush",
			cost: "15",
			effect: "Can of energy drink",
		},
		10: {
			name: "Voracious",
			cost: "30",
			effect: "4,500 happiness",
		},
	},
	"Television Network": {
		1: {
			name: "Propaganda ",
			cost: "5",
			effect: "1 faction respect",
		},
		3: {
			name: "Scoop",
			cost: "Passive",
			effect: "50% newspaper advertising cost reduction",
		},
		5: {
			name: "Inside Story",
			cost: "15",
			effect: "View someone's battle stats & money",
		},
		10: {
			name: "Press Pass",
			cost: "25",
			effect: "Receive special privileges",
		},
	},
	Theater: {
		1: {
			name: "Stagecraft",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Dramatics",
			cost: "10",
			effect: "Maximum stealth",
		},
		5: {
			name: "Masked",
			cost: "Passive",
			effect: "Cannot be targeted by spies",
		},
		7: {
			name: "Twinlike",
			cost: "Passive",
			effect: "15% counterfeiting crime exp & skill gain",
		},
		10: {
			name: "Disguised",
			cost: "Passive",
			effect: "Hidden destination & traveling status",
		},
	},
	"Toy Shop": {
		1: {
			name: "Memory Lane",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Jumble Sale",
			cost: "3",
			effect: "Special plushie",
		},
		5: {
			name: "Gamer",
			cost: "Passive",
			effect: "100% happy gain from Game Console",
		},
		7: {
			name: "Over Capacity",
			cost: "Passive",
			effect: "5 travel plushie capacity",
		},
		10: {
			name: "Toy Importer",
			cost: "10",
			effect: "View stock analysis of plushies in all countries",
		},
	},
	Zoo: {
		1: {
			name: "Fulfillment",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Animal Instinct",
			cost: "Passive",
			effect: "25% hunting income",
		},
		5: {
			name: "Special K",
			cost: "5",
			effect: "Ketamine drug",
		},
		7: {
			name: "Eye of the Tiger",
			cost: "Passive",
			effect: "70% awareness",
		},
		10: {
			name: "Seasoned Poacher",
			cost: "Passive",
			effect: "3.0 accuracy",
		},
	},
} as const;

interface SetItem {
	name: string;
	id: number;
	category: "Flower" | "Plushie";
}

const SETS = {
	FLOWERS: [
		{ name: "Dahlia", id: 260, category: "Flower" },
		{ name: "Crocus", id: 263, category: "Flower" },
		{ name: "Orchid", id: 264, category: "Flower" },
		{ name: "Heather", id: 267, category: "Flower" },
		{ name: "Ceibo Flower", id: 271, category: "Flower" },
		{ name: "Edelweiss", id: 272, category: "Flower" },
		{ name: "Peony", id: 276, category: "Flower" },
		{ name: "Cherry Blossom", id: 277, category: "Flower" },
		{ name: "African Violet", id: 282, category: "Flower" },
		{ name: "Tribulus Omanense", id: 385, category: "Flower" },
		{ name: "Banana Orchid", id: 617, category: "Flower" },
	],
	PLUSHIES: [
		{ name: "Sheep Plushie", id: 186, category: "Plushie" },
		{ name: "Teddy Bear Plushie", id: 187, category: "Plushie" },
		{ name: "Kitten Plushie", id: 215, category: "Plushie" },
		{ name: "Jaguar Plushie", id: 258, category: "Plushie" },
		{ name: "Wolverine Plushie", id: 261, category: "Plushie" },
		{ name: "Nessie Plushie", id: 266, category: "Plushie" },
		{ name: "Red Fox Plushie", id: 268, category: "Plushie" },
		{ name: "Monkey Plushie", id: 269, category: "Plushie" },
		{ name: "Chamois Plushie", id: 273, category: "Plushie" },
		{ name: "Panda Plushie", id: 274, category: "Plushie" },
		{ name: "Lion Plushie", id: 281, category: "Plushie" },
		{ name: "Camel Plushie", id: 384, category: "Plushie" },
		{ name: "Stingray Plushie", id: 618, category: "Plushie" },
	],
} as const satisfies Record<string, SetItem[]>;

const SPECIAL_FILTER_ICONS = {
	traveling: ["icon71"],
	isFedded: ["icon70"],
	fedded: ["icon70"],
	newPlayer: ["icon72"],
	onWall: ["icon75", "icon76"],
	inCompany: ["icon21", "icon22", "icon23", "icon24", "icon25", "icon26", "icon27", "icon73", "icon83"],
	inFaction: ["icon9", "icon74", "icon81"],
	isDonator: ["icon3", "icon4"],
	inHospital: ["icon15"],
	inJail: ["icon16"],
	fallen: ["icon77"],
	earlyDischarge: ["icon82"],
	isRecruit: ["icon81"],
	hasBounties: ["icon13"],
} as const;

const CHAIN_BONUSES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000] as const;

const ITEM_TYPES = [
	"Melee",
	"Secondary",
	"Primary",
	"Defensive",
	"Candy",
	"Other",
	"Special",
	"Material",
	"Clothing",
	"Jewelry",
	"Tool",
	"Medical",
	"Collectible",
	"Car",
	"Flower",
	"Booster",
	"Unused",
	"Alcohol",
	"Plushie",
	"Drug",
	"Temporary",
	"Supply Pack",
	"Enhancer",
	"Artifact",
	"Energy Drink",
	"Book",
] as const;

const WEAPON_BONUSES = [
	"Achilles",
	"Assassinate",
	"Backstab",
	"Berserk",
	"Bleed",
	"Blindside",
	"Bloodlust",
	"Comeback",
	"Conserve",
	"Cripple",
	"Crusher",
	"Cupid",
	"Deadeye",
	"Deadly",
	"Disarm",
	"Double Tap",
	"Double-edged",
	"Empower",
	"Eviscerate",
	"Execute",
	"Expose",
	"Finale",
	"Focus",
	"Frenzy",
	"Fury",
	"Grace",
	"Home Run",
	"Irradiate",
	"Motivation",
	"Paralyze",
	"Parry",
	"Penetrate",
	"Plunder",
	"Powerful",
	"Proficience",
	"Puncture",
	"Quicken",
	"Rage",
	"Revitalize",
	"Roshambo",
	"Slow",
	"Smurf",
	"Specialist",
	"Stricken",
	"Stun",
	"Suppress",
	"Sure Shot",
	"Throttle",
	"Warlord",
	"Weaken",
	"Wind-up",
	"Wither",
] as const;

const BACKUP_CALENDAR_2025: TornCalendarResponse = {
	calendar: {
		competitions: [
			{
				title: "Christmas Town",
				description:
					"Torn's very own festive theme park opens its doors to the public, with citizens able to scour both official and player-created maps to search for treasure and avoid traps!",
				start: 1766102400,
				end: 1767225599,
			},
		],
		events: [
			{
				title: "Awareness Awareness Week",
				description: "Increased awareness for one week",
				start: 1737331200,
				end: 1737935999,
			},
			{
				title: "Weekend Road Trip",
				description: "Double racing points & racing skill",
				start: 1738368000,
				end: 1738454399,
			},
			{
				title: "Valentine's Day",
				description: "Love Juice reduces the energy cost of attacking & reviving",
				start: 1739491200,
				end: 1739577599,
			},
			{
				title: "Employee Appreciation Day",
				description: "Job points received tripled & training effects tripled",
				start: 1741305600,
				end: 1741391999,
			},
			{
				title: "St Patrick's Day",
				description: "Alcohol effects are doubled & Green Stout appears in city",
				start: 1742169600,
				end: 1742255999,
			},
			{
				title: "420 Day",
				description: "Cannabis effects are tripled",
				start: 1745107200,
				end: 1745193599,
			},
			{
				title: "Museum Day",
				description: "10% bonus to museum point rewards",
				start: 1747526400,
				end: 1747612799,
			},
			{
				title: "World Blood Donor Day",
				description: "Life and cooldown penalties for drawing blood are halved",
				start: 1749859200,
				end: 1749945599,
			},
			{
				title: "World Population Day",
				description: "Level and weapon EXP gained while attacking is doubled",
				start: 1752192000,
				end: 1752278399,
			},
			{
				title: "World Tiger Day",
				description: "Hunting experience is increased by x5",
				start: 1753747200,
				end: 1753833599,
			},
			{
				title: "International Beer Day",
				description: "Beer items are five times more effective",
				start: 1754006400,
				end: 1754092799,
			},
			{
				title: "Tourism Day",
				description: "Travel capacity doubled for flights leaving during this event",
				start: 1758931200,
				end: 1759017599,
			},
			{
				title: "CaffeineCon 2025",
				description: "Energy drink effects are doubled",
				start: 1760486400,
				end: 1760572799,
			},
			{
				title: "Trick or Treat",
				description: "Dress up and attack others to fill your basket with treats",
				start: 1761350400,
				end: 1762041599,
			},
			{
				title: "World Diabetes Day",
				description: "Candy effects are tripled",
				start: 1763078400,
				end: 1763164799,
			},
			{
				title: "Black Friday",
				description: "Torn's yearly dollar sale sees many bazaars listing goods for $1",
				start: 1764288000,
				end: 1764374399,
			},
			{
				title: "Slash Wednesday",
				description: "Hospital times reduced by 75%",
				start: 1765324800,
				end: 1765411199,
			},
			{
				title: "Torn Anniversary",
				description: "Torn turns 21 years old",
				start: 1763164800,
				end: 1763251199,
			},
			{
				title: "Easter Egg Hunt",
				description:
					"A variety of different Easter eggs will appear at random throughout Torn. Pick them up to add them into your inventory, then consume them at your leisure to receive their powerful effects.",
				start: 1744848000,
				end: 1745452799,
			},
		],
	},
} as const;

const ARMOR_SETS = ["Assault", "Riot", "Dune", "Delta", "Marauder", "EOD", "Sentinel", "Vanguard"] as const;

function getNextChainBonus(current: number) {
	return CHAIN_BONUSES.find((bonus) => bonus > current);
}

function isSellable(id: number | string) {
	if (!torndata || !torndata.items) return true;

	const item = torndata.items[id];

	return (
		item &&
		!["Book", "Unused"].includes(item.type) &&
		![
			373, // Parcel
			374, // Present
			375, // Present
			376, // Present
			820, // Piggy Bank
			920, // Halloween Basket
			1003, // Halloween Basket
			1004, // Halloween Basket
			1005, // Halloween Basket
			1006, // Halloween Basket
			1007, // Halloween Basket
			1008, // Halloween Basket
			1009, // Halloween Basket
			1010, // Halloween Basket
			1011, // Halloween Basket
		].includes(parseInt(id.toString()))
	);
}

function isFlying() {
	return document.body.dataset.traveling === "true";
}

function isAbroad() {
	return !isFlying() && document.body.dataset.abroad === "true";
}

function getRFC() {
	const rfc = getCookie("rfc_v");
	if (!rfc) {
		for (const cookie of document.cookie.split("; ")) {
			const parts = cookie.split("=");
			if (parts[0] === "rfc_v") {
				return parts[1];
			}
		}
	}
	return rfc;
}

function getPage() {
	let page = location.pathname.substring(1);
	if (page.endsWith(".php")) page = page.substring(0, page.length - 4);
	else if (page.endsWith(".html")) page = page.substring(0, page.length - 3);

	switch (page) {
		case "index":
			const _page = getSearchParameters().get("page");

			if (_page === "hunting") page = "hunting";
			else if (_page === "people") page = "abroad-people";
			else page = "home";

			break;
		case "loader":
		case "page":
			const sid = getSearchParameters().get("sid").toLowerCase();

			if (sid === "list") page = getSearchParameters().get("type");
			else page = sid;
			break;
		case "hospitalview":
			page = "hospital";
			break;
		case "jailview":
			page = "jail";
			break;
		case "pmarket":
			page = "points-market";
			break;
		case "amarket":
			page = "auction";
			break;
	}

	return page;
}

function isCaptcha() {
	return !!document.querySelector(".captcha");
}

function hasDarkMode() {
	return location.host === chrome.runtime.id ? document.body.classList.contains("dark") : document.body.classList.contains("dark-mode");
}

interface MessageBoxOptions {
	class: string;
	isHTML: boolean;
}

function createMessageBox(content: string, partialOptions: Partial<MessageBoxOptions> = {}) {
	const options: MessageBoxOptions = {
		class: "",
		isHTML: false,
		...partialOptions,
	};

	return elementBuilder({
		type: "div",
		class: `tt-message-box ${options.class}`,
		children: [
			elementBuilder({
				type: "div",
				class: "tt-message-icon-wrap",
				children: [elementBuilder({ type: "div", class: "tt-message-icon", children: [ttSvg()] })],
			}),
			elementBuilder({
				type: "div",
				class: "tt-message-wrap",
				children: [
					elementBuilder({
						type: "div",
						class: "tt-message",
						[options.isHTML ? "html" : "text"]: content,
					}),
				],
			}),
		],
	});
}

enum REACT_UPDATE_VERSIONS {
	DEFAULT = "default",
	DOUBLE_DEFAULT = "doubleDefault",
	NATIVE_SETTER = "nativeSetter",
}

interface ReactInputOptions {
	version: REACT_UPDATE_VERSIONS | "complex-please-never-be-needed";
}

function updateReactInput(input: HTMLInputElement | HTMLTextAreaElement, value: string | number, partialOptions: Partial<ReactInputOptions> = {}) {
	const options: ReactInputOptions = {
		version: REACT_UPDATE_VERSIONS.DEFAULT,
		...partialOptions,
	};

	const valueString = value.toString();

	switch (options.version) {
		// case "complex-please-never-be-needed":
		// 	const lastValue = input.value;
		// 	input.value = value;
		// 	const event = new Event("input", { bubbles: true, simulated: true });
		// 	// Probably needs to be moved to a script tag.
		// 	const tracker = input._valueTracker;
		// 	// Another try can be made by setting the value tracker to null.
		// 	if (tracker) {
		// 		tracker.setValue(lastValue);
		// 	}
		// 	console.log("TT DEBUG - Updating react input.", { input, value, lastValue, tracker });
		// 	input.dispatchEvent(event);
		// 	break;
		case REACT_UPDATE_VERSIONS.NATIVE_SETTER:
			const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
			nativeSetter.call(input, valueString);

			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
		case REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT:
			input.value = valueString;
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
			break;
		case REACT_UPDATE_VERSIONS.DEFAULT:
		default:
			input.value = valueString;
			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
	}
}

function isDividendStock(id: string | number) {
	let _id: number;
	if (typeof id === "number") _id = id;
	else if (isIntNumber(id)) _id = parseInt(id);
	else return false;

	return [1, 4, 5, 6, 7, 9, 10, 12, 15, 16, 17, 18, 19, 22, 24, 27, 28, 29, 31, 32, 33, 35].includes(_id);
}

function getRequiredStocks(required: number, increment: number) {
	return (Math.pow(2, increment) - 1) * required;
}

function getStockIncrement(required: number, stocks: number) {
	return Math.log2(Math.floor(stocks / required) + 1);
}

function getStockReward(reward: string, increment: number) {
	let value: string;
	if (reward.startsWith("$")) {
		const cash = parseInt(reward.replace("$", "").replaceAll(",", "")) * increment;

		value = formatNumber(cash, { currency: true });
	} else if (reward.match(/^\d+x? /i)) {
		const splitBenefit = reward.split(" ");
		const hasX = splitBenefit[0].endsWith("x");
		const amount = parseInt(splitBenefit.shift().replace("x", "")) * increment;
		const item = splitBenefit.join(" ");

		value = `${formatNumber(amount)}${hasX ? "x" : ""} ${item}`;
	} else {
		value = "Unknown, please report this!";
	}

	return value;
}

function getRewardValue(reward: string) {
	let value: number;
	if (reward.startsWith("$")) {
		value = parseInt(reward.replace("$", "").replaceAll(",", ""));
	} else if (reward.match(/^\d+x? /i)) {
		const rewardItem = reward.split(" ").slice(1).join(" ");

		const item = findItemInObject<TornV1Item>(torndata.items, { name: rewardItem });

		if (item) value = item ? item.market_value : -1;
		else {
			let prices: number[] | undefined = undefined;

			switch (rewardItem) {
				case "Ammunition Pack":
					break;
				case "Clothing Cache":
					prices = [1057, 1112, 1113, 1114, 1115, 1116, 1117].map((id) => torndata.items[id].market_value);
					break;
				case "Random Property":
					prices = torndata.properties
						.map((property) => property.cost)
						.filter((price) => !!price)
						.map((price) => price * 0.75);
					break;
				case "points":
					value = torndata.stats.points_averagecost * 100;
					break;
				case "happiness":
				case "energy":
				case "nerve":
					break;
				default:
					value = -1;
					break;
			}

			if (prices !== undefined) value = prices.reduce((a, b) => a + b, 0) / prices.length;
		}
	} else {
		value = -1;
	}

	return value;
}

function getStockBoughtPrice(stock: UserV1Stock) {
	const boughtTotal = Object.values(stock.transactions).reduce((prev, trans) => prev + trans.bought_price * trans.shares, 0);

	return { boughtTotal, boughtPrice: boughtTotal / stock.total_shares };
}

function is2FACheckPage() {
	return !!document.querySelector(".content-wrapper.logged-out .two-factor-auth-container");
}

/*
2FA page DOM Layout, for testing.

<div class="content responsive-sidebar-container anonymous">
<div class="container" id="mainContainer"><div id="sidebarroot"></div><div class="content-wrapper logged-out winter  " role="main"><div class="content-title m-bottom10">
<h4 id="skip-to-content" class="left">Two-factor authentication</h4>
<div class="right line-h24 t-gray-6 f-normal">pod2</div>
<div class="clear"></div>
<hr class="page-head-delimiter">
</div><div class="two-factor-auth-container m-top10">
<div class="verify-block">
<i class="verify-icon-email"></i>
<span class="vertical-divider"></span>
<div class="form-wrap">
<p class="m-bottom10 form-title">A six digit code has been sent to your <span class="bold">email address</span>. Please enter this code below.</p>
<form action="/authenticate.php" method="post" id="verify-code-form" data-current-step="email" class="">
<div class="verify-code-input-wrap">
<input id="verify-code-input" class="verify-code-input input-text" name="code" data-code-type="email" type="tel" placeholder="Enter 6-digit code from email message" autocomplete="off" autofocus="">
<input type="hidden" name="codeType" value="email">
<input type="hidden" name="noAjax2FA" value="1">
<input type="hidden" name="step" value="checkCodeAndVerifyIP">
</div>
<div class="btn-wrap submit silver">
<div class="btn">
 <div class="preloader-wrap">
<div class="dzsulb-preloader preloader-fountain">
<div id="fountainG_1" class="fountainG"></div>
<div id="fountainG_2" class="fountainG"></div>
<div id="fountainG_3" class="fountainG"></div>
<div id="fountainG_4" class="fountainG"></div>
</div>
</div>
<button type="submit" class="torn-btn">
VERIFY
</button>
</div>
</div>
<a href="#" class="resend t-blue h c-pointer disabled">
Resend
<span class="otp-timeleft-wrap">(<span class="otp-timeleft hasCountdown" data-time-exp="300" aria-live="off" role="alert">76</span>)</span>
</a>
<img src="/images/v2/main/search_loader.gif?v=1528808940574" class="link-preloader">
</form>
<div class="m-top5 italic">
<span class="t-gray-9">If you're having trouble, the </span>
<a class="t-blue h c-pointer" href="/account_recovery.php">Account Recovery</a>
<span class="t-gray-9">system can be used as a last resort</span>
</div>
</div>
</div>
</div>
<div class="clear"></div>
</div>
<div class="clear"></div>
</div>
</div>*/

function getPageStatus() {
	const infoMessage = document.querySelector(".content-wrapper .info-msg-cont");
	if (infoMessage && infoMessage.classList.contains("red")) {
		const message = infoMessage.textContent;

		if (message.includes("items in your inventory")) return { access: true };
		else if (findParent(infoMessage, { class: "no-parcel-wrap" })?.style?.display === "none") return { access: true };

		return { access: false, message: infoMessage.textContent };
	}

	if (document.querySelector(".captcha")) return { access: false, message: "Captcha required" };
	else if (document.querySelector(".dirty-bomb")) return { access: false, message: "Dirty bomb screen" };
	else if (is2FACheckPage()) return { access: false, message: "2 Factor Authentication" };

	return { access: true };
}

function millisToNewDay() {
	const now = Date.now();
	const newDate = new Date();
	newDate.setUTCHours(0, 0, 0);
	newDate.setUTCDate(newDate.getUTCDate() + 1);

	return newDate.getTime() - now;
}

function getUserDetails() {
	let id: number, name: string;

	if (!hasAPIData()) {
		const script = document.querySelector("script[uid][name]");
		if (!script) return { error: "Couldn't get details" };

		id = parseInt(script.getAttribute("uid"));
		name = script.getAttribute("name");
	} else {
		id = userdata.profile.id;
		name = userdata.profile.name;
	}

	return { id, name };
}

function isOwnProfile() {
	const details = getUserDetails();

	if (details.error) return false;

	const { id, name } = details;
	const params = getSearchParameters();

	return (params.has("XID") && parseInt(params.get("XID")) === id) || (params.has("NID") && params.get("NID") === name);
}

function getUserEnergy() {
	return document
		.querySelector("[class*='bar__'][class*='energy__'] [class*='bar-value___']")
		.textContent.split("/")
		.map((x) => parseInt(x));
}

function getItemEnergy(id: number | string) {
	const effect = torndata.items[id]?.effect;
	if (!effect) return false;

	const energy = effect.match(/(?<=Increases energy by )\d+/);
	if (!energy) return false;

	const value = energy[0];

	return !isNaN(parseInt(value)) ? parseInt(value) : false;
}

function getUsername(row: Element) {
	let name: string, id: number, combined: string;

	const element = row.querySelector<HTMLLinkElement>(".user.name");
	if (element) {
		const title = element.querySelector(":scope > [title]");
		if (title) {
			combined = title.getAttribute("title");

			const regex = combined.match(/(.*) \[(\d+)]/);
			name = regex[1];
			id = parseInt(regex[2]);
		} else {
			name = element.textContent;
			id = convertToNumber(element.href);

			combined = `${name} [${id}]`;
		}
	} else {
		const link = row.querySelector<HTMLLinkElement>("a[href*='profiles']");
		if (link.getAttribute("id")) {
			name = link.querySelector("span").textContent || "";
			id = convertToNumber(link.getAttribute("id").split("-")[0]);

			combined = name ? `${name} [${id}]` : id.toString();
		} else {
			name = link.textContent;
			id = convertToNumber(link.href.match(/XID=(\d*)/i)[1]);

			combined = `${name} [${id}]`;
		}
	}

	return { name, id, combined, toString: () => combined };
}

function hasFinishedEducation() {
	if (!torndata.education || !userdata.education_completed) return false;

	return torndata.education.flatMap((e) => e.courses).every(({ id }) => userdata.education_completed.includes(id));
}

function isChatV3() {
	return !!document.getElementById("notes_settings_button");
}

let ttTopLinks: HTMLElement | undefined, ttTopLinksCreating: boolean | undefined;

async function createTTTopLinks() {
	if (ttTopLinks) {
		if (ttTopLinksCreating) {
			await requireCondition(() => !ttTopLinksCreating);
		}
		return ttTopLinks;
	}

	ttTopLinksCreating = true;
	ttTopLinks = elementBuilder({ type: "div", class: "tt-top-icons" });
	await requireElement("[class*='titleContainer___']").then((title) => {
		title.appendChild(ttTopLinks);
		ttTopLinksCreating = false;
	});
	return ttTopLinks;
}

interface TornEvent {
	name: string;
	type: keyof TornCalendarResponse["calendar"];
	isEvent: (event: TornCalendarActivity) => boolean;
}

const TORN_EVENTS = {
	EASTER_EGG_HUNT: {
		name: "Easter Egg Hunt",
		type: "events",
		isEvent(event) {
			return event.title.toLowerCase() === "Easter Egg Hunt".toLowerCase();
		},
	},
	ST_PATRICKS_DAY: {
		name: "St Patrick's Day",
		type: "events",
		isEvent(event) {
			return event.title.toLowerCase() === "St Patrick's Day".toLowerCase();
		},
	},
	INTERNATIONAL_BEER_DAY: {
		name: "International Beer Day",
		type: "events",
		isEvent(event) {
			return event.title.toLowerCase() === "International Beer Day".toLowerCase();
		},
	},
	CAFFEINE_CON: {
		name: "CaffeineCon",
		type: "events",
		isEvent(event) {
			return event.title.toLowerCase().startsWith("CaffeineCon".toLowerCase());
		},
	},
	WORLD_DIABETES_DAY: {
		name: "World Diabetes Day",
		type: "events",
		isEvent(event) {
			return event.title.toLowerCase() === "World Diabetes Day".toLowerCase();
		},
	},
} as const satisfies { [key: string]: TornEvent };

function isEventActive(calendarEvent: TornEvent, useLocalStart = true) {
	const calendar: TornCalendarResponse["calendar"] = hasAPIData() ? torndata.calendar : BACKUP_CALENDAR_2025.calendar;

	if (!(calendarEvent.type in calendar)) throw new Error(`Invalid calendar type '${calendarEvent.type}'!`);

	const tornEvent = calendar[calendarEvent.type].find(calendarEvent.isEvent);
	if (!tornEvent) return false;

	const start = new Date(tornEvent.start * 1000 - TO_MILLIS.DAYS);
	const end = new Date(tornEvent.end * 1000 + TO_MILLIS.DAYS);

	if (useLocalStart && hasAPIData()) {
		const timeParts = userdata.calendar.start_time.split(" ")[0].split(":");
		const hours = parseInt(timeParts[0]);
		const minutes = parseInt(timeParts[1]);

		start.setUTCHours(hours);
		start.setUTCMinutes(minutes);
		end.setUTCHours(hours);
		end.setUTCMinutes(minutes);
	}

	const now = new Date();

	return now > start && now < end;
}

const HOSP_REASONS: {
	name: string;
	display: string;
	display_sentence?: string;
	keywords: string[];
	important?: boolean;
}[] = [
	{
		name: "overdosed",
		display: "Overdosed",
		display_sentence: "after overdosing",
		keywords: ["overdosed", "collapsed after taking", "collapsed while smoking"],
		important: true,
	},
	{
		name: "hospitalized",
		display: "Hospitalized",
		display_sentence: "after being hospitalized",
		keywords: ["hospitalized"],
		important: true,
	},
	{
		name: "mugged",
		display: "Mugged",
		display_sentence: "after being mugged",
		keywords: ["mugged"],
		important: true,
	},
	{
		name: "attacked",
		display: "Attacked",
		display_sentence: "after being attacked",
		keywords: ["attacked"],
		important: true,
	},
	{
		name: "lost",
		display: "Lost",
		keywords: ["lost"],
	},
	{
		name: "crashed",
		display: "Crashed",
		keywords: ["crashed"],
	},
	{
		name: "oc 1 failure",
		display: "OC 1 Failure",
		keywords: [
			"thrown at a wall",
			"nudist rebels",
			"shot in the back",
			"exploded",
			"swat marksman",
			"taken down by members",
			"taken down by guards",
			"attempted robbery",
			"derailed",
			"attempting to take down a president",
			"dropped by swiss guards",
		],
	},
	{
		name: "crimes 1 failure",
		display: "Crimes 1 Failure",
		keywords: [
			"trying to rob",
			"drive-by shooting",
			"third degree burns",
			"hitman mission",
			"arson attempt",
			"mauled by a guard dog",
			"shot while resisting arrest",
		],
	},
	{
		name: "crimes 2 failure",
		display: "Crimes 2 Failure",
		keywords: ["gunshot wound", "primary blast"],
	},
	{
		name: "sed",
		display: "SED",
		display_sentence: "after using a SED",
		keywords: ["nasty surprise"],
		important: true,
	},
	{
		name: "blood_bag",
		display: "Blood Bag",
		display_sentence: "after using a wrong blood bag",
		keywords: ["acute hemolytic transfusion reaction"],
		important: true,
	},
	{
		name: "ipecac_syrup",
		display: "Ipecac Syrup",
		display_sentence: "after ingesting Ipecac Syrup",
		keywords: ["ipecac syrup"],
		important: true,
	},
	{
		name: "radiation_poisoning",
		display: "Radiation Poisoning",
		keywords: ["radiation poisoning"],
	},
] as const;

function getHospitalizationReason(details: string) {
	details = details.toLowerCase();

	return HOSP_REASONS.find((_reason) => _reason.keywords.some((keyword) => details.includes(keyword)));
}

function getSidebarData() {
	return Object.entries(sessionStorage)
		.filter(([key]) => /sidebarData\d+/.test(key))
		.map(([, value]) => JSON.parse(value))
		.find(() => true);
}

const MAX_MISSIONS = {
	Duke: 3,
	DEFAULT: 3,
} as const;

function getSidebarArea(): Node | null {
	const areasTitle = findElementWithText("h2", "Areas");
	if (!areasTitle) return null;

	return areasTitle;
}

const TAX_RATES = {
	salesTaxPercentage: 5,
	sellAnonymouslyPercentage: 10,
} as const;
