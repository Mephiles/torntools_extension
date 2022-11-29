"use strict";

// [...document.querySelectorAll("#iconTray > li")].map((icon) => ({ id: parseInt(icon.id.replace("icon", "")), icon: icon.id, description: icon.getAttribute("title").substring(3, icon.getAttribute("title").length - 4) }))
const ALL_ICONS = [
	{ id: 1, icon: "icon1", description: "Online" },
	{ id: 62, icon: "icon62", description: "Idle" },
	{ id: 2, icon: "icon2", description: "Offline" },
	{ id: 6, icon: "icon6", description: "Male" },
	{ id: 7, icon: "icon7", description: "Female" },
	{ id: 87, icon: "icon87", description: "Enby" },
	{ id: 72, icon: "icon72", description: "New player" },
	{ id: 3, icon: "icon3", description: "Donator" },
	{ id: 4, icon: "icon4", description: "Subscriber" },
	{ id: 11, icon: "icon11", description: "Staff" },
	{ id: 10, icon: "icon10", description: "Committee" },
	{ id: 8, icon: "icon8", description: "Marriage" },
	{ id: 5, icon: "icon5", description: "Level 100" },
	{ id: 21, icon: "icon21", description: "Army job" },
	{ id: 22, icon: "icon22", description: "Casino job" },
	{ id: 23, icon: "icon23", description: "Medical job" },
	{ id: 24, icon: "icon24", description: "Grocer job" },
	{ id: 25, icon: "icon25", description: "Lawyer job" },
	{ id: 26, icon: "icon26", description: "Education job" },
	{ id: 73, icon: "icon73", description: "Company director" },
	{ id: 27, icon: "icon27", description: "Company employee" },
	{ id: 83, icon: "icon83", description: "Company recruit" },
	{ id: 74, icon: "icon74", description: "Faction leader / co-leader" },
	{ id: 9, icon: "icon9", description: "Faction member" },
	{ id: 81, icon: "icon81", description: "Faction recruit" },
	{ id: 75, icon: "icon75", description: "Territory war (defending)" },
	{ id: 76, icon: "icon76", description: "Territory war (assaulting)" },
	{ id: 19, icon: "icon19", description: "Education in progress" },
	{ id: 20, icon: "icon20", description: "Education completed" },
	{ id: 29, icon: "icon29", description: "Investment in progress" },
	{ id: 30, icon: "icon30", description: "Investment completed" },
	{ id: 31, icon: "icon31", description: "Cayman islands bank" },
	{ id: 32, icon: "icon32", description: "Property vault" },
	{ id: 33, icon: "icon33", description: "Loan" },
	{ id: 34, icon: "icon34", description: "Items in auction" },
	{ id: 35, icon: "icon35", description: "Items in bazaar" },
	{ id: 36, icon: "icon36", description: "Items in item market" },
	{ id: 54, icon: "icon54", description: "Points market" },
	{ id: 38, icon: "icon38", description: "Stocks owned" },
	{ id: 84, icon: "icon84", description: "Dividend collection ready" },
	{ id: 37, icon: "icon37", description: "Trade in progress" },
	{ id: 68, icon: "icon68", description: "Reading book" },
	{ id: 71, icon: "icon71", description: "Traveling" },
	{ id: 17, icon: "icon17", description: "Racing in progress" },
	{ id: 18, icon: "icon18", description: "Racing completed" },
	{ id: 85, icon: "icon85", description: "Organized crime being planned" },
	{ id: 86, icon: "icon86", description: "Organized crime ready" },
	{ id: 13, icon: "icon13", description: "Bounty" },
	{ id: 28, icon: "icon28", description: "Cashier's checks" },
	{ id: 55, icon: "icon55", description: "Auction high bidder" },
	{ id: 56, icon: "icon56", description: "Auction outbid" },
	{ id: 15, icon: "icon15", description: "Hospital" },
	{ id: 82, icon: "icon82", description: "Hospital early discharge" },
	{ id: 16, icon: "icon16", description: "Jail" },
	{ id: 70, icon: "icon70", description: "Federal jail" },
	{ id: 12, icon: "icon12", description: "Low life" },
	{ id: 39, icon: "icon39", description: "Booster cooldown (0-6hr)" },
	{ id: 40, icon: "icon40", description: "Booster cooldown (6-12hr)" },
	{ id: 41, icon: "icon41", description: "Booster cooldown (12-18hr)" },
	{ id: 42, icon: "icon42", description: "Booster cooldown (18-24hr)" },
	{ id: 43, icon: "icon43", description: "Booster cooldown (24hr+)" },
	{ id: 44, icon: "icon44", description: "Medical cooldown (0-90m)" },
	{ id: 45, icon: "icon45", description: "Medical cooldown (90-180m)" },
	{ id: 46, icon: "icon46", description: "Medical cooldown (180m-270m)" },
	{ id: 47, icon: "icon47", description: "Medical cooldown (270-360m)" },
	{ id: 48, icon: "icon48", description: "Medical cooldown (360m+)" },
	{ id: 49, icon: "icon49", description: "Drug cooldown (0-10m)" },
	{ id: 50, icon: "icon50", description: "Drug cooldown (10-60m)" },
	{ id: 51, icon: "icon51", description: "Drug cooldown (1-2hr)" },
	{ id: 52, icon: "icon52", description: "Drug cooldown (2-5hr)" },
	{ id: 53, icon: "icon53", description: "Drug cooldown (5hr+)" },
	{ id: 57, icon: "icon57", description: "Drug addiction (1-4%)" },
	{ id: 58, icon: "icon58", description: "Drug addiction (5-9%)" },
	{ id: 59, icon: "icon59", description: "Drug addiction (10-19%)" },
	{ id: 60, icon: "icon60", description: "Drug addiction (20-29%)" },
	{ id: 61, icon: "icon61", description: "Drug addiction (30%+)" },
	{ id: 63, icon: "icon63", description: "Radiation sickness (1-17%)" },
	{ id: 64, icon: "icon64", description: "Radiation sickness (18-34%)" },
	{ id: 65, icon: "icon65", description: "Radiation sickness (35-50%)" },
	{ id: 66, icon: "icon66", description: "Radiation sickness (51-67%)" },
	{ id: 67, icon: "icon67", description: "Radiation sickness (68%+)" },
	{ id: 78, icon: "icon78", description: "Upkeep due (4-6%)" },
	{ id: 79, icon: "icon79", description: "Upkeep due (6-8%)" },
	{ id: 80, icon: "icon80", description: "Upkeep due (8%+)" },
];
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
	{ class: "my_faction", text: "My Faction" },
	{ class: "recruit_citizens", text: "Recruit Citizens" },
	{ class: "competitions", text: "Competitions" },
	{ class: "community_events", text: "Community Events" },
];

const ALLOWED_BLOOD = {
	"o+": [738, 739], // 738
	"o-": [739], // 739
	"a+": [732, 733, 738, 739], // 732
	"a-": [733, 739], // 733
	"b+": [734, 735, 738, 739], // 734
	"b-": [735, 739], // 735
	"ab+": [732, 733, 734, 735, 736, 737, 738, 739], // 736
	"ab-": [733, 735, 737, 739], // 737
};

const CASINO_GAMES = ["slots", "roulette", "high-low", "keno", "craps", "bookie", "lottery", "blackjack", "poker", "r-roulete", "spin-the-wheel"];

const DRUG_INFORMATION = {
	// Cannabis
	196: {
		pros: ["Increased crime success rate", "+2-3 Nerve"],
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
		cooldown: "5 hours",
	},
};

const COMPANY_INFORMATION = {
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
			effect: "100% bonus to Erotic DVDs",
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
			effect: "25% epinephrine effect & duration",
		},
		10: {
			name: "Thrill Seeker",
			cost: "Passive",
			effect: "10% crime skill and experience gain (Temporarily Unavailable)",
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
			effect: "View someone's true level if they are level holding",
		},
	},
	"Car Dealership": {
		1: {
			name: "Test Drive",
			cost: "5",
			effect: "Racing point",
		},
		3: {
			name: "Discount parts",
			cost: "Passive",
			effect: "75% cost discount on car parts",
		},
		5: {
			name: "Salesman",
			cost: "Passive",
			effect: "No item market fees",
		},
		7: {
			name: "Two-Faced",
			cost: "Passive",
			effect: "25% fraud success & skill gain (Temporarily Unavailable)",
		},
		10: {
			name: "Getaway car",
			cost: "Passive",
			effect: "Escape button always enabled",
		},
	},
	"Clothing Store": {
		1: {
			name: "Fashion Show",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Nine to five",
			cost: "10",
			effect: "100 Endurance",
		},
		5: {
			name: "Activewear",
			cost: "Passive",
			effect: "+25% Passive Dexterity",
		},
		7: {
			name: "Secret pockets",
			cost: "Passive",
			effect: "+75% Mug Protection",
		},
		10: {
			name: "Tailoring",
			cost: "Passive",
			effect: "+20% Armor Bonus",
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
			effect: "2 extra travel items",
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
			effect: "3 extra travel items",
		},
	},
	"Cyber Cafe": {
		1: {
			name: "Ub3rg33k",
			cost: "Passive",
			effect: "50% virus coding time reduction",
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
			effect: "View someone's employment and faction history",
		},
		3: {
			name: "Deputised",
			cost: "Passive",
			effect: "Able to Arrest those who meet the required threshold after defeat",
		},
		5: {
			name: "Friend or Foe",
			cost: "100",
			effect: "See who's friended / blacklisted you (or a target)",
		},
		7: {
			name: "Watchlist",
			cost: "50",
			effect: "Anonymously extend a target's flight time by 1:30 - 2:00 hours",
		},
		10: {
			name: "Most Wanted",
			cost: "25",
			effect: "View a list of people with the highest wanted rewards",
		},
	},
	Farm: {
		1: {
			name: "Fullfillment",
			cost: "1",
			effect: "50 happiness",
		},
		3: {
			name: "Animal Instinct",
			cost: "Passive",
			effect: "25% hunting reward",
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
			effect: "25% flame-thrower damage & accuracy",
		},
		7: {
			name: "Explosives Expert",
			cost: "5",
			effect: "Random bomb parts (Temporarily Unavailable)",
		},
		10: {
			name: "Inferno",
			cost: "25",
			effect: "Random incendiary ammunition, supplying currently equipped weapons if applicable",
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
			effect: "50% reduction of happiness loss in gym",
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
		3: {
			name: "Cultivation",
			cost: "Passive",
			effect: "25% illegal production success & skill gain (Temporarily Unavailable)",
		},
		5: {
			name: "Herbal Cleansing",
			cost: "1",
			effect: "Drug addiction reduction",
		},
		7: {
			name: "Over Capacity",
			cost: "Passive",
			effect: "Buy 5 additional special flowers abroad",
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
			effect: "25% theft success rate and skill gain (Temporarily Unavailable)",
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
			effect: "50% virus coding time reduction",
		},
		3: {
			name: "Early Release",
			cost: "100",
			effect: "Money",
		},
		5: {
			name: "Gamer",
			cost: "Passive",
			effect: "100% console happiness",
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
			effect: "+1 Molotov Cocktail Temporary weapon",
		},
		3: {
			name: "Fueled",
			cost: "Passive",
			effect: "+25% bonus to Speed",
		},
		5: {
			name: "Cauterize",
			cost: "Passive",
			effect: "Occasional 20% healing during combat",
		},
		7: {
			name: "Fireproof",
			cost: "Passive",
			effect: "-50% reduction to Burning damage received",
		},
		10: {
			name: "Blaze of Glory",
			cost: "Passive",
			effect: "+50% bonus to Burning damage dealt",
		},
	},
	"Gents Strip Club": {
		1: {
			name: "Happy Ending",
			cost: "1",
			effect: "50 happy",
		},
		3: {
			name: "Dancer's Flair",
			cost: "Passive",
			effect: "25% passive dexterity",
		},
		5: {
			name: "Supple",
			cost: "Passive",
			effect: "50% tyrosine effect & duration",
		},
		7: {
			name: "Pilates",
			cost: "Passive",
			effect: "10% dexterity gym gains",
		},
		10: {
			name: "No Touching",
			cost: "Passive",
			effect: "1/4 chance to dodge melee attacks",
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
			effect: "10% consumable boost",
		},
		10: {
			name: "Canned in",
			cost: "12",
			effect: "Can of energy drink",
		},
	},
	"Gun Shop": {
		1: {
			name: "Sales Discount",
			cost: "Passive",
			effect: "20% discount on standard ammo cost",
		},
		3: {
			name: "Surplus",
			cost: "15",
			effect: "Random special ammunition, supplying currently equipped weapons if applicable",
		},
		5: {
			name: "Skilled Analysis",
			cost: "Passive",
			effect: "Target equipment and ammo is always visible",
		},
		7: {
			name: "Bandoleer",
			cost: "Passive",
			effect: "1 extra clip for guns during combat",
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
			effect: "Reduced enemy stealth",
		},
		7: {
			name: "Cutting corners",
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
			effect: "50 happy",
		},
		3: {
			name: "Hench",
			cost: "Passive",
			effect: "25% passive defense",
		},
		5: {
			name: "Hormonal",
			cost: "Passive",
			effect: "50% serotonin effect & duration",
		},
		7: {
			name: "Boxercise",
			cost: "Passive",
			effect: "10% defense gym gains",
		},
		10: {
			name: "Hardbody",
			cost: "Passive",
			effect: "30% melee damage mitigation",
		},
	},
	"Law Firm": {
		1: {
			name: "Bail Bondsman",
			cost: "Passive",
			effect: "50% decreased bail costs",
		},
		3: {
			name: "Background Check",
			cost: "10",
			effect: "View someone's stats",
		},
		5: {
			name: "Closing Argument",
			cost: "Passive",
			effect: "Easier to bust more people at once",
		},
		7: {
			name: "Loophole",
			cost: "Passive",
			effect: "20% organised crime skill",
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
			effect: "2 travel capacity",
		},
		5: {
			name: "Born Free",
			cost: "Passive",
			effect: "50% speed & dexterity when not wearing armor",
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
			effect: "50% reduction in crime experience penalties",
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
			effect: "3% life regeneration per tick",
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
			effect: "75% cost discount on car parts",
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
			effect: "50% driving skill gain",
		},
	},
	"Mining Corporation": {
		1: {
			name: "Salty",
			cost: "5",
			effect: "Salt Shaker",
		},
		3: {
			name: "Thirsty Work",
			cost: "Passive",
			effect: "30% alcohol cooldown reduction",
		},
		5: {
			name: "Rock Salt",
			cost: "1",
			effect: "Gain defense",
		},
		7: {
			name: "Essential Salts",
			cost: "Passive",
			effect: "10% maximum life",
		},
		10: {
			name: "Preserved Meat",
			cost: "25",
			effect: "Boost current life to 150% of maximum",
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
			effect: "30% increased gym experience",
		},
		5: {
			name: "High-fidelity",
			cost: "Passive",
			effect: "Reduced enemy stealth",
		},
		7: {
			name: "Deafened",
			cost: "10",
			effect: "Guaranteed stealth",
		},
		10: {
			name: "The Score",
			cost: "Passive",
			effect: "15% passive all stats",
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
			effect: "25% illicit services success & skill gain (Temporarily Unavailable)",
		},
		5: {
			name: "Suppression",
			cost: "1",
			effect: "Drug addiction reduction",
		},
		7: {
			name: "Tolerance",
			cost: "Passive",
			effect: "50% drug overdose chance reduction",
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
			effect: "Half a target's happiness",
		},
		5: {
			name: "Oil Mogul",
			cost: "3",
			effect: "Reduce bank investment time by 1 hour",
		},
		7: {
			name: "Tax Haven",
			cost: "Passive",
			effect: "10% increase of Cayman Islands interest rate",
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
			effect: "50% flash grenade intensity",
		},
		5: {
			name: "Open Arsenal",
			cost: "75",
			effect: "Primary or Secondary weapon",
		},
		7: {
			name: "Regulation",
			cost: "Passive",
			effect: "25% full set armor bonus",
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
			effect: "No item market or auction house fees",
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
			effect: "50% bottle of alcohol boost",
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
			effect: "2% life regeneration per tick",
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
			effect: "50% virus coding time reduction",
		},
		3: {
			name: "Proxy Hacking",
			cost: "25",
			effect: "Cancel a target's virus programming",
		},
		5: {
			name: "Intricate Hack",
			cost: "250",
			effect: "Steals 1-3% of a company's funds",
		},
		7: {
			name: "Hack the Planet",
			cost: "Passive",
			effect: "+ 25% computer crime success & skill gain (Temporarily Unavailable)",
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
			name: "Propaganda",
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
			effect: "View someone's stats & money",
		},
		7: {
			name: "Bad Publicity",
			cost: "Passive",
			effect: "25% extortion success rate and skill gain (Temporarily Unavailable)",
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
			effect: "Guaranteed stealth",
		},
		5: {
			name: "Masked",
			cost: "Passive",
			effect: "Cannot be targeted by spies",
		},
		7: {
			name: "Twinlike",
			cost: "Passive",
			effect: "25% forgery success rate and skill gain (Temporarily Unavailable)",
		},
		10: {
			name: "Disguised",
			cost: "Passive",
			effect: "Hidden travelling status & destination",
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
			effect: "100% console happiness",
		},
		7: {
			name: "Over Capacity",
			cost: "Passive",
			effect: "Able to bring back +5 plushies from abroad",
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
			effect: "25% hunting reward",
		},
		5: {
			name: "Special K",
			cost: "5",
			effect: "Ketamine drug",
		},
		7: {
			name: "Eye of the Tiger",
			cost: "Passive",
			effect: "70% Awareness",
		},
		10: {
			name: "Seasoned Poacher",
			cost: "Passive",
			effect: "+3.00 Accuracy",
		},
	},
};

const SETS = {
	FLOWERS: [
		{ name: "Dahlia", id: 260 },
		{ name: "Crocus", id: 263 },
		{ name: "Orchid", id: 264 },
		{ name: "Heather", id: 267 },
		{ name: "Ceibo Flower", id: 271 },
		{ name: "Edelweiss", id: 272 },
		{ name: "Peony", id: 276 },
		{ name: "Cherry Blossom", id: 277 },
		{ name: "African Violet", id: 282 },
		{ name: "Tribulus Omanense", id: 385 },
		{ name: "Banana Orchid", id: 617 },
	],
	PLUSHIES: [
		{ name: "Sheep Plushie", id: 186 },
		{ name: "Teddy Bear Plushie", id: 187 },
		{ name: "Kitten Plushie", id: 215 },
		{ name: "Jaguar Plushie", id: 258 },
		{ name: "Wolverine Plushie", id: 261 },
		{ name: "Nessie Plushie", id: 266 },
		{ name: "Red Fox Plushie", id: 268 },
		{ name: "Monkey Plushie", id: 269 },
		{ name: "Chamois Plushie", id: 273 },
		{ name: "Panda Plushie", id: 274 },
		{ name: "Lion Plushie", id: 281 },
		{ name: "Camel Plushie", id: 384 },
		{ name: "Stingray Plushie", id: 618 },
	],
};

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
};

const CHAIN_BONUSES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

const LINKS = {
	events: "https://www.torn.com/events.php#/step=all",
	messages: "https://www.torn.com/messages.php",
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	items_candy: "https://www.torn.com/item.php#candy-items",
	items_medical: "https://www.torn.com/item.php#medical-items",
	education: "https://www.torn.com/education.php#/step=main",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain",
	hospital: "https://www.torn.com/hospitalview.php",
	organizedCrimes: "https://www.torn.com/factions.php?step=your#/tab=crimes",
	gym: "https://www.torn.com/gym.php",
};

function getNextChainBonus(current) {
	return CHAIN_BONUSES.find((bonus) => bonus > current);
}

function isSellable(id) {
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
		].includes(item.id)
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
		for (let cookie of document.cookie.split("; ")) {
			cookie = cookie.split("=");
			if (cookie[0] === "rfc_v") {
				return cookie[1];
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
		case "page":
			page = getSearchParameters().get("sid");
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
		case "loader":
			const sid = getSearchParameters().get("sid");

			switch (sid) {
				case "missions":
				case "racing":
				case "attack":
					page = sid;
			}
			break;
	}

	return page;
}

function isCaptcha() {
	return !!document.find(".captcha");
}

function hasDarkMode() {
	return location.host === chrome.runtime.id ? document.body.classList.contains("dark") : document.body.classList.contains("dark-mode");
}

const darkModeObserver = new (class {
	constructor() {
		this.listeners = new Set();
		this.prevDarkModeState = null;
		this.observer = new MutationObserver(() => {
			const darkModeState = hasDarkMode();

			if (darkModeState !== this.prevDarkModeState) {
				this.prevDarkModeState = darkModeState;
				this._invokeListeners(darkModeState);
			}
		});
	}

	addListener(callback) {
		if (!this.prevDarkModeState) this.prevDarkModeState = hasDarkMode();

		this.listeners.add(callback);

		if (this.listeners.size === 1) {
			this.observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
		}
	}

	removeListener(callback) {
		this.listeners.delete(callback);

		if (this.listeners.size === 0) this.observer.disconnect();
	}

	_invokeListeners(isInDarkMode) {
		for (const listener of this.listeners.values()) {
			listener(isInDarkMode);
		}
	}
})();

function createMessageBox(content, options = {}) {
	options = {
		class: "",
		isHTML: false,
		...options,
	};

	return document.newElement({
		type: "div",
		class: `tt-message-box ${options.class}`,
		children: [
			document.newElement({
				type: "div",
				class: "tt-message-icon-wrap",
				children: [document.newElement({ type: "div", class: "tt-message-icon", children: [ttSvg()] })],
			}),
			document.newElement({
				type: "div",
				class: "tt-message-wrap",
				children: [document.newElement({ type: "div", class: "tt-message", [options.isHTML ? "html" : "text"]: content })],
			}),
		],
	});
}

const REACT_UPDATE_VERSIONS = {
	DEFAULT: "default",
	NATIVE_SETTER: "nativeSetter",
};

function updateReactInput(input, value, options = {}) {
	options = {
		version: REACT_UPDATE_VERSIONS.DEFAULT,
		...options,
	};

	switch (options.version) {
		case "complex-please-never-be-needed":
			const lastValue = input.value;
			input.value = value;
			const event = new Event("input", { bubbles: true, simulated: true });
			// Probably needs to be moved to a script tag.
			const tracker = input._valueTracker;
			// Another try can be made by setting the value tracker to null.
			if (tracker) {
				tracker.setValue(lastValue);
			}
			console.log("TT DEBUG - Updating react input.", { input, value, lastValue, tracker });
			input.dispatchEvent(event);
			break;
		case REACT_UPDATE_VERSIONS.NATIVE_SETTER:
			const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
			nativeSetter.call(input, value);

			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
		case REACT_UPDATE_VERSIONS.DEFAULT:
		default:
			input.value = value;
			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
	}
}

function isDividendStock(id) {
	if (isIntNumber(id)) return [1, 4, 5, 6, 7, 9, 10, 12, 15, 16, 17, 18, 19, 22, 24, 27, 28, 29, 31, 32, 33, 35].includes(id);

	return false;
}

function getRequiredStocks(required, increment) {
	return (Math.pow(2, increment) - 1) * required;
}

function getStockIncrement(required, stocks) {
	return Math.log2(Math.floor(stocks / required) + 1);
}

function getStockReward(reward, increment) {
	let value;
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

function getRewardValue(reward) {
	let value;
	if (reward.startsWith("$")) {
		value = parseInt(reward.replace("$", "").replaceAll(",", ""));
	} else if (reward.match(/^\d+x? /i)) {
		const rewardItem = reward.split(" ").slice(1).join(" ");

		const item = findItemsInObject(torndata.items, { name: rewardItem }, { single: true });

		if (item) value = item ? item.market_value : -1;
		else {
			let prices;

			switch (rewardItem) {
				case "Ammunition Pack":
					break;
				case "Clothing Cache":
					prices = [1057, 1112, 1113, 1114, 1115, 1116, 1117].map((id) => torndata.items[id].market_value);
					break;
				case "Random Property":
					prices = Object.values(torndata.properties)
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

			if (Array.isArray(prices)) value = prices.totalSum() / prices.length;
		}
	} else {
		value = -1;
	}

	return value;
}

function getStockBoughtPrice(stock) {
	const boughtTotal = Object.values(stock.transactions).reduce((prev, trans) => prev + trans.bought_price * trans.shares, 0);

	return { boughtTotal, boughtPrice: boughtTotal / stock.total_shares };
}

function getPageStatus() {
	const infoMessage = document.find(".content-wrapper .info-msg-cont");
	if (infoMessage && infoMessage.classList.contains("red")) {
		const message = infoMessage.textContent;

		if (message.includes("items in your inventory")) return { access: true };

		return { access: false, message: infoMessage.textContent };
	}

	if (document.find(".captcha")) return { access: false, message: "Captcha required" };
	else if (document.find(".dirty-bomb")) return { access: false, message: "Dirty bomb screen" };

	return { access: true };
}

function millisToNewDay() {
	const now = new Date();
	const newDate = new Date();
	newDate.setUTCHours(0, 0, 0);
	newDate.setUTCDate(newDate.getUTCDate() + 1);

	return newDate - now;
}

function getUserDetails() {
	let id, name;

	if (!hasAPIData()) {
		const script = document.find("script[uid][name]");
		if (!script) return { error: "Couldn't get details" };

		id = parseInt(script.getAttribute("uid"));
		name = script.getAttribute("name");
	} else {
		id = userdata.player_id;
		name = userdata.name;
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
		.find("#barEnergy [class*='bar-value___']")
		.textContent.split("/")
		.map((x) => parseInt(x));
}

function getItemEnergy(id) {
	const effect = torndata.items[id]?.effect;
	if (!effect) return false;

	const energy = effect.match(/(?<=Increases energy by )\d+/);
	if (!energy) return false;

	const value = energy[0];

	return !isNaN(value) ? parseInt(value) : false;
}

function getUsername(row) {
	let name, id, combined;

	const element = row.find(".user.name");
	if (element) {
		const title = element.find(":scope > [title]");
		if (title) {
			combined = title.getAttribute("title");

			const regex = combined.match(/(.*) \[(\d+)]/);
			name = regex[1];
			id = parseInt(regex[2]);
		} else {
			name = element.textContent;
			id = element.href.getNumber();

			combined = `${name} [${id}]`;
		}
	} else {
		const link = row.find("a[href*='profiles']");
		if (link.getAttribute("id")) {
			name = link.find("span").textContent || "";
			id = link.getAttribute("id").split("-")[0].getNumber();

			combined = name ? `${name} [${id}]` : id;
		} else {
			name = link.textContent;
			id = link.href.match(/XID=(\d*)/i)[1].getNumber();

			combined = `${name} [${id}]`;
		}
	}

	return { name, id, combined, toString: () => combined };
}

function hasFinishedEducation() {
	if (!torndata.education || !userdata.education_completed) return false;

	return Object.keys(torndata.education).every((id) => userdata.education_completed.includes(parseInt(id)));
}
