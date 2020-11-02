console.log("TT - Loading global functions.");

/*
 * Declare some variables.
 */

chrome = typeof browser !== "undefined" ? browser : chrome;

const ttConsole = new ttCustomConsole();

const HIGHLIGHT_PLACEHOLDERS = {
	$player: {
		value: () => userdata.name,
		description: "Your player name.",
	},
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DRUG_INFORMATION = {
	cannabis: {
		pros: ["Increased crime success rate", "+2-3 Nerve"],
		cons: ["-20% Strength", "-25% Defense", "-35% Speed"],
		cooldown: "60-90 minutes",
		overdose: {
			bars: ["-100% Energy & Nerve"],
			hosp_time: "5 hours",
			extra: "'Spaced Out' honor bar",
		},
	},
	ecstasy: {
		pros: ["Doubles Happy"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy & Happy"],
		},
	},
	ketamine: {
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
	lsd: {
		pros: ["+30% Strength", "+50% Defense", "+50 Energy", "+200-500 Happy", "+5 Nerve"],
		cons: ["-30% Speed & Dexterity"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve", "-50% Happy"],
			stats: "-30% Speed & Dexterity",
		},
	},
	opium: {
		pros: ["Removes all hospital time (except Radiation Sickness) and replenishes life by 66.6%", "+50-100 Happy"],
		cooldown: "3-4 hours",
	},
	pcp: {
		pros: ["+20% Strength & Dexterity", "+250 Happy"],
		cooldown: "4-7 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "27 hours",
			stats: "-10x(player level) Speed (permanent)",
		},
	},
	shrooms: {
		pros: ["+500 Happy"],
		cons: ["-20% All Battle Stats", "-25 Energy (caps at 0)"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "1h 40min",
		},
	},
	speed: {
		pros: ["+20% Speed", "+50 Happy"],
		cons: ["-20% Dexterity"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			stats: "-6x(player level) Strength & Defense (permanent)",
			hosp_time: "7h 30min",
		},
	},
	vicodin: {
		pros: ["+25% All Battle Stats", "+75 Happy"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-150 Happy"],
		},
	},
	xanax: {
		pros: ["+250 Energy", "+75 Happy"],
		cons: ["-35% All Battle Stats"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "3 days 12 hours",
			extra: "24 hours of cooldown and increased addiction",
		},
	},
	love_juice: {
		pros: ["Cost of Attacking & Reviving reduced to 15 Energy", "+50% Speed", "+25% Dexterity"],
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
			effect: "1 nerve",
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
	"Cruise Line Agency": {
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
			effect: "1 nerve",
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
			name: "Happy Hour",
			cost: "1",
			effect: "Money",
		},
		3: {
			name: "Free Drinks",
			cost: "1",
			effect: "1 nerve",
		},
		5: {
			name: "High Heels",
			cost: "500",
			effect: "Pair of high heels",
		},
		7: {
			name: "Dancer's flair",
			cost: "Passive",
			effect: "25% passive dexterity",
		},
		10: {
			name: "Aspiring Workout",
			cost: "Passive",
			effect: "10% dexterity gym gains",
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
			name: "Happy Hour",
			cost: "1",
			effect: "Money",
		},
		3: {
			name: "Free Drinks",
			cost: "1",
			effect: "1 nerve",
		},
		5: {
			name: "Thong",
			cost: "300",
			effect: "Thong",
		},
		7: {
			name: "Hench",
			cost: "Passive",
			effect: "25% passive defense",
		},
		10: {
			name: "Aspiring Workout",
			cost: "Passive",
			effect: "10% defense gym gains",
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
			name: "Lingerie Party",
			cost: "1",
			effect: "Experience",
		},
		3: {
			name: "Nine to Five",
			cost: "10",
			effect: "100 endurance",
		},
		5: {
			name: "Concealment",
			cost: "Passive",
			effect: "2 extra travel items",
		},
		7: {
			name: "Born Free",
			cost: "Passive",
			effect: "50% dexterity when not wearing armor",
		},
		10: {
			name: "Free as the Wind Blows",
			cost: "Passive",
			effect: "50% speed when not wearing armor",
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
			effect: "Increases available open contracts from 3 to 5",
		},
		5: {
			name: "Repatriated",
			cost: "Passive",
			effect: "Allows traveling back to Torn from abroad while in hospital",
		},
		7: {
			name: "Contraband",
			cost: "50",
			effect: "Large quantity of a foreign item",
		},
		10: {
			name: "Logistics Report",
			cost: "250",
			effect: "Targeted company productivity boost",
		},
	},
	"Meat Warehouse": {
		1: {
			name: "Blood Thirst",
			cost: "1",
			effect: "1 nerve",
		},
		3: {
			name: "Butcher",
			cost: "Passive",
			effect: "10% melee weapon damage",
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

const THEME_CLASSES = {
	default: {
		title: "title-green",
	},
	alternative: {
		title: "title-black",
	},
};

const CHAIN_BONUSES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

const STORAGE = {
	// app settings
	api_key: undefined,
	proxy_key: undefined,
	updated: "force_true",
	api: {
		count: 0,
		limit: 60,
		online: true,
		error: "",
	},
	extensions: {},
	new_version: {},
	api_history: {
		torn: [],
		yata: [],
		tornstats: [],
		torntools: [],
		nukefamily: [],
	},

	// userdata
	itemlist: {},
	torndata: {},
	userdata: {},
	oc: {}, // organized crimes
	notifications_custom: undefined,

	// script data
	personalized: {},
	mass_messages: {
		active: false,
		list: [],
		index: 0,
		subject: undefined,
		message: undefined,
	},
	loot_times: {},
	yata: {},
	travel_market: [],
	networth: {
		previous: {
			value: undefined,
			date: undefined,
		},
		current: {
			value: undefined,
			date: undefined,
		},
	},
	target_list: {
		last_target: "-1",
		show: true,
		targets: {},
	},
	vault: {
		user: {
			initial_money: 0,
			current_money: 0,
		},
		partner: {
			initial_money: 0,
			current_money: 0,
		},
		total_money: 0,
		initialized: false,
		last_transaction: undefined,
	},
	stock_alerts: {},
	loot_alerts: {},
	allies: [],
	custom_links: [],
	chat_highlight: {
		$player: "#7ca900",
	},
	hide_icons: [],
	hide_areas: [],
	quick: {
		items: [],
		crimes: [],
	},
	notes: {
		text: undefined,
		height: undefined,
	},
	profile_notes: {
		profiles: {},
	},
	travel_items: 5,
	stakeouts: {},
	filters: {
		preset_data: {
			factions: {
				default: "",
				data: [],
			},
		},
		travel: {
			table_type: "basic",
			open: false,
			item_type: ["plushie", "flower", "drug", "other"],
			country: "all",
		},
		profile_stats: {
			auto_fetch: true,
			relative_values: false,
			chosen_stats: [],
		},
		hospital: {
			activity: [],
			faction: "",
			time: [],
			level: [],
		},
		jail: {
			activity: [],
			faction: "",
			time: [],
			level: [],
			score: [],
		},
		faction: {
			activity: [],
			level: [],
			status: [],
			last_action: [],
			special: {
				isfedded: "both",
				newplayer: "both",
				onwall: "both",
				incompany: "both",
				isdonator: "both",
			},
		},
		user_list: {
			activity: [],
			level: [],
			special: {
				isfedded: "both",
				traveling: "both",
				newplayer: "both",
				onwall: "both",
				incompany: "both",
				infaction: "both",
				isdonator: "both",
			},
		},
		overseas: {
			activity: [],
			status: [],
			level: [],
			special: {
				isfedded: "both",
				newplayer: "both",
				onwall: "both",
				incompany: "both",
				infaction: "both",
				isdonator: "both",
			},
		},
		bounties: {},
		faction_armory: {},
		container_open: {},
		stock_exchange: {
			portfolio: {
				forecast: [],
				worth: [],
				name: "",
				profitLoss: [],
				listedOnly: false,
			},
			market: {
				forecast: [],
				worth: [],
				name: "",
			},
		},
		crimes: {
			safeCrimes: false,
		},
		competition: {
			level: [],
			special: {
				isfedded: "both",
				newplayer: "both",
				incompany: "both",
				infaction: "both",
				isdonator: "both",
			},
		},
		abroadItems: {
			profitOnly: false,
			categories: [],
		},
	},
	sorting: {
		profile: [],
		abroadItems: {
			column: "default",
			order: "asc",
		},
	},
	cache: {
		profileStats: {},
		spyReport: {},
		battleStatsEstimate: {},
	},

	// user settings
	settings: {
		update_notification: true,
		notifications_tts: false,
		notifications_sound: "1",
		notifications_volume: 1,
		notifications_link: true,
		icon_bars: {
			show: true,
			energy: true,
			nerve: true,
			happy: true,
			life: true,
			chain: true,
			travel: true,
		},
		clean_flight: false,
		// "remove_info_boxes": false,
		theme: "default",
		force_tt: true,
		check_extensions: true,
		developer: false,
		font_size: "12px",
		inactivity_alerts_faction: {
			// "432000000": "#ffc8c8",  // 5 days
			// "259200000": "#fde5c8"  // 3 days
		},
		inactivity_alerts_company: {
			// "432000000": "#ffc8c8",  // 5 days
			// "259200000": "#fde5c8"  // 3 days
		},
		notifications: {
			global: true,
			events: true,
			messages: true,
			status: true,
			traveling: true,
			cooldowns: true,
			education: true,
			new_day: true,
			energy: ["100%"],
			nerve: ["100%"],
			happy: ["100%"],
			life: ["100%"],
			hospital: [],
			landing: [],
			chain: [],
			chain_count: [],
			drugs: [],
		},
		format: {
			date: "eu",
			time: "eu",
		},
		tabs: {
			market: true,
			stocks: true,
			calculator: true,
			info: true,
			default: "info",
		},
		achievements: {
			show: true,
			completed: true,
		},
		pages: {
			trade: {
				item_values: true,
				total_value: true,
			},
			home: {
				battle_stats: true,
				networth: true,
			},
			missions: {
				rewards: true,
			},
			city: {
				items: true,
				items_value: true,
				closed_highlight: true,
			},
			profile: {
				friendly_warning: true,
				show_id: true,
				loot_times: true,
				status_indicator: true,
				notes: true,
			},
			racing: {
				upgrades: true,
			},
			gym: {
				estimated_energy: true,
				disable_strength: false,
				disable_speed: false,
				disable_defense: false,
				disable_dexterity: false,
				specialty_gym_1: "",
				specialty_gym_2: "",
			},
			shop: {
				profits: true,
			},
			casino: {
				global: true,
				hilo: true,
				blackjack: true,
			},
			items: {
				values: true,
				drug_details: true,
				itemmarket_links: false,
				highlight_bloodbags: "none",
			},
			travel: {
				profits: true,
				destination_table: true,
				cooldown_warnings: true,
				destination_table_last_country: true,
			},
			api: {
				key: true,
				pretty: true,
				marking: false,
				autoDemo: true,
			},
			faction: {
				oc_time: true,
				armory: true,
				oc_advanced: true,
				announcements_page_full: false,
				info_page_full: false,
				armory_worth: false,
				member_info: false,
				banking_tools: true,
			},
			properties: {
				vault_sharing: true,
			},
			stockexchange: {
				acronyms: true,
				advanced: true,
			},
			bazaar: {
				worth: false,
				max_buy_ignore_cash: false,
			},
			company: {
				member_info: false,
			},
			global: {
				vault_balance: false,
				vault_balance_own: false,
				notes: true,
				hide_upgrade: false,
				align_left: false,
				find_chat: true,
				autocomplete_chat: true,
				hide_chat: false,
				show_toggle_chat: true,
				collapse_areas: false,
				oc_time: true,
				hide_leave: false,
				block_zalgo: true,
				refill_energy: true,
				refill_nerve: false,
				miniprofile_last_action: true,
				enable_central_revive: false,
			},
			jail: {
				quick_bail: false,
				quick_bust: false,
			},
			itemmarket: {
				market_value: "",
			},
			forums: {
				hide_threads: {},
				hide_posts: {},
			},
		},
		scripts: {
			stats_estimate: {
				global: true,
				profile: true,
				userlist: false,
				abroad: false,
				hall_of_fame: false,
				bounties: false,
				enemies_list: false,
				faction_wars: false,
				faction_members: false,
				competition: false,

				delay: 1500,
				cached_only: false,
				cached_only_show: false,
				max_level: 100,
			},
			no_confirm: {
				global: true,
				item_market: false,
				revives: false,
				item_equip: true,
				trades: false,
			},
		},
	},
};

const TO_MILLIS = {
	SECONDS: 1000,
	MINUTES: 1000 * 60,
	HOURS: 1000 * 60 * 60,
	DAYS: 1000 * 60 * 60 * 24,
};

const ACTIVITY_FILTER_DICT = {
	online: "icon1_",
	idle: "icon62_",
	offline: "icon2_",
};
const SPECIAL_FILTER_DICT = {
	isfedded: ["icon70_"],
	traveling: ["icon71_"],
	newplayer: ["icon72_"],
	onwall: ["icon75_", "icon76_"],
	incompany: ["icon21_", "icon22_", "icon23_", "icon24_", "icon25_", "icon26_", "icon27_", "icon73_"],
	infaction: ["icon9_", "icon74_", "icon81_"],
	isdonator: ["icon3_", "icon4_"],
};

let notificationLinkRelations = {};

const RANKS = {
	"Absolute beginner": 1,
	Beginner: 2,
	Inexperienced: 3,
	Rookie: 4,
	Novice: 5,
	"Below average": 6,
	Average: 7,
	Reasonable: 8,
	"Above average": 9,
	Competent: 10,
	"Highly competent": 11,
	Veteran: 12,
	Distinguished: 13,
	"Highly distinguished": 14,
	Professional: 15,
	Star: 16,
	Master: 17,
	Outstanding: 18,
	Celebrity: 19,
	Supreme: 20,
	Idolised: 21,
	Champion: 22,
	Heroic: 23,
	Legendary: 24,
	Elite: 25,
	Invincible: 26,
};

const RANK_TRIGGERS = {
	level: [2, 6, 11, 26, 31, 50, 71, 100],
	crimes: [100, 5000, 10000, 20000, 30000, 50000],
	networth: [5000000, 50000000, 500000000, 5000000000, 50000000000],

	stats: ["under 2k", "2k - 25k", "20k - 250k", "200k - 2.5m", "2m - 25m", "20m - 250m", "over 200m"],
};

const FORMATTER_NO_DECIMALS = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});
const FORMATTER_VALUES = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 3,
});
const FORMATTER_PERCENTAGE = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 2,
});

const REGEX_COMBINING_SYMBOL = /([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g;

let injectedXHR = false;
let injectedFetch = false;

/*
 * Add prototype functions.
 */

Document.prototype.findAll = function (type) {
	return this.querySelectorAll(type);
};
Element.prototype.findAll = function (type) {
	return this.querySelectorAll(type);
};

Document.prototype.new = function (newElement) {
	if (typeof newElement == "string") {
		return this.createElement(newElement);
	} else if (typeof newElement == "object") {
		let el = this.createElement(newElement.type);

		if (newElement.id) {
			el.id = newElement.id;
		}
		if (newElement.class) {
			el.setAttribute("class", newElement.class);
		}
		if (newElement.text) {
			el.innerText = newElement.text;
		}
		if (newElement.html) {
			el.innerHTML = newElement.html;
		}
		if (newElement.value) {
			el.value = newElement.value;
		}
		if (newElement.href) {
			el.href = newElement.href;
		}
		if (newElement.children) {
			for (let child of newElement.children) {
				el.appendChild(child);
			}
		}

		for (let attr in newElement.attributes) {
			el.setAttribute(attr, newElement.attributes[attr]);
		}

		return el;
	}
};

Document.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};
Element.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};

String.prototype.replaceAll = function (text, replace) {
	let str = this.toString();

	if (typeof text === "string") {
		while (str.includes(text)) {
			str = str.replace(text, replace);
		}
	} else if (typeof text === "object") {
		if (Array.isArray(text)) {
			for (let t of text) {
				str = str.replaceAll(t, replace);
			}
		}
	}

	return str;
};

/*
 * Load some functions.
 */

const infoBox = {
	newRow: function (key, value, attr = {}) {
		// process

		let li = doc.new({ type: "li", id: attr.id ? attr.id : "", class: attr.last ? "last" : "" });
		if (attr.heading) {
			li.innerText = key;

			li.classList.add("tt-box-section-heading");
			li.classList.add("tt-title");
			li.classList.add(THEME_CLASSES[DB.settings.theme].title);
		} else {
			let span_left = doc.new({ type: "span", class: "divider" });
			let span_left_inner = doc.new({
				type: "span",
				text: key,
				attributes: { style: "background-color: transparent;" },
			});
			let span_right = doc.new({ type: "span", class: "desc" });
			let span_right_inner = doc.new({ type: "span", text: value, attributes: { style: "padding-left: 3px;" } });

			span_left.appendChild(span_left_inner);
			span_right.appendChild(span_right_inner);
			li.appendChild(span_left);
			li.appendChild(span_right);
		}

		return li;
	},
};

const navbar = {
	newSection: function (name, attribute = {}) {
		let parent = doc.find("#sidebarroot");
		let newDiv = createNewBlock(name, attribute);
		let nextElement = attribute.next_element || findSection(parent, attribute.next_element_heading);

		if (!nextElement) {
			if (attribute.last) {
				parent.appendChild(newDiv);
			}
		} else {
			nextElement.parentElement.insertBefore(newDiv, nextElement);
		}

		return newDiv;

		function createNewBlock(name, attr = {}) {
			let collapsed = false;
			if (filters.container_open.navbar && filters.container_open.navbar[name]) {
				collapsed = filters.container_open.navbar[name];
			}

			let sidebarBlock = doc.new({ type: "div", class: "sidebar-block___1Cqc2 tt-nav-section" });
			sidebarBlock.innerHTML = `
                <div class="content___kMC8x">
                    <div class="areas___2pu_3">
                        <div class="toggle-block___13zU2">
                            <div class="tt-title tt-nav ${THEME_CLASSES[settings.theme].title} ${
				collapsed === true || collapsed === undefined ? "collapsed" : ""
			}">
                                <div class="title-text">${name}</div>
                                <div class="tt-options"></div>
                                <i class="tt-title-icon fas fa-caret-down"></i></div>
                            <div class="toggle-content___3XKOC tt-content"></div>
                        </div>
                    </div>
                </div>
            `;

			if (!attr.header_only) {
				sidebarBlock.find(".tt-title").onclick = function () {
					sidebarBlock.find(".tt-title").classList.toggle("collapsed");
					let collapsed = sidebarBlock.find(".tt-title").classList.contains("collapsed");

					ttStorage.change({ filters: { container_open: { navbar: { [name]: collapsed } } } });
				};
			}

			return sidebarBlock;
		}

		function findSection(parent, heading) {
			for (let head of parent.findAll("h2")) {
				if (head.innerText === heading) {
					return head.parentElement.parentElement.parentElement;
				}
			}
			return undefined;
		}
	},
	newCell: function (text, attribute = {}) {
		let sidebar = doc.find("#sidebarroot");

		if (!attribute.parent_element && attribute.parent_heading) {
			attribute.parent_element = (function () {
				for (let el of sidebar.findAll("h2")) {
					if (el.firstChild.nodeValue === attribute.parent_heading) {
						return el.parentElement;
					}
				}
				return undefined;
			})();
		}

		let toggleContent = attribute.parent_element.find(".toggle-content___3XKOC");
		let newCellBlock = createNewCellBlock(text, attribute);

		if (attribute.first) toggleContent.insertBefore(newCellBlock, toggleContent.firstElementChild);
		else toggleContent.appendChild(newCellBlock);

		return newCellBlock;

		function createNewCellBlock(text, attr) {
			let div = doc.new({ type: "div", class: "area-desktop___2YU-q" });

			div.innerHTML = `
                <div class="area-row___34mEZ tt-cell">
                    <a class="desktopLink___2dcWC ${attr.class || ""}" ${attr.href ? `href='${attr.href}'` : ""} target="${attr.link_target || ""}">
                        <span>${text}</span>
                    </a>
                </div>
            `;

			return div;
		}
	},
};

const content = {
	newContainer: function (name, attr = {}) {
		// process
		if (attr.next_element_heading) {
			attr.next_element = content.findContainer(attr.next_element_heading);
		}

		let parent_element;
		if (attr.next_element) {
			parent_element = attr.next_element.parentElement;
		} else if (attr.adjacent_element) {
			parent_element = attr.adjacent_element;
		} else {
			parent_element = doc.find(".content-wrapper");
		}

		let new_div = createNewContainer(name, attr);

		if (attr.first) parent_element.insertBefore(new_div, parent_element.find(".content-title").nextElementSibling);
		else if (attr.next_element) parent_element.insertBefore(new_div, attr.next_element);
		else if (attr.adjacent_element) parent_element.insertAdjacentElement(attr.adjacent_element_position || "afterend", new_div);
		else parent_element.appendChild(new_div);

		return new_div;

		function createNewContainer(name, attr) {
			let collapsed = filters.container_open[getCurrentPage() + (attr.collapseId || "")];

			let div = doc.new({ type: "div" });
			if (attr.id) div.id = attr.id;
			if (attr["_class"]) div.setClass(attr["_class"]);

			let containerClasses = ["m-top10", "tt-title", THEME_CLASSES[settings.theme].title];
			if (attr.header_only) containerClasses.push("no-content");
			if (attr.all_rounded) containerClasses.push("all-rounded");

			if (collapsed === true || collapsed === undefined) {
				containerClasses.push("collapsed");

				if (attr.all_rounded !== false && !attr.header_only) containerClasses.push("all-rounded");
			} else {
				containerClasses.push("top-rounded");
			}

			div.innerHTML = `
                <div class="${containerClasses.join(" ")}">
                    <div class="title-text">${name}</div>
                    <div class="tt-options"></div>
                    <i class="tt-title-icon fas fa-caret-down"></i>
                </div>
                <div class="cont-gray bottom-rounded content tt-content ${attr.dragzone ? "tt-dragzone" : ""}"></div>
            `;

			if (attr.dragzone) {
				let content = div.find(".content");
				content.addEventListener("dragover", onDragOver);
				content.addEventListener("drop", function (event) {
					onDrop(event);
				});
				content.addEventListener("dragenter", onDragEnter);
				content.addEventListener("dragleave", onDragLeave);
			}

			if (!attr.header_only) {
				div.find(".tt-title").onclick = function () {
					const title = div.find(".tt-title");

					title.classList.toggle("collapsed");
					let collapsed = title.classList.contains("collapsed");

					if (attr.all_rounded !== false) {
						if (collapsed) {
							title.classList.add("all-rounded");
							title.classList.remove("top-rounded");
						} else {
							title.classList.remove("all-rounded");
							title.classList.add("top-rounded");
						}
					}

					ttStorage.change({ filters: { container_open: { [getCurrentPage() + (attr.collapseId || "")]: collapsed } } });
				};
			}

			return div;
		}
	},
	findContainer: function (name) {
		let headings = doc.findAll(".content-wrapper .title-black");

		for (let heading of headings) {
			if (heading.innerText === name) return heading.parentElement.parentElement;
		}

		return undefined;
	},
};

/*
 * Load some normal functions.
 */

function isFlying() {
	return new Promise((resolve) => {
		let checker = setInterval(function () {
			let page_heading = doc.find("#skip-to-content");
			if (page_heading) {
				if (page_heading.innerText === "Traveling") {
					resolve(true);
					return clearInterval(checker);
				} else if (page_heading.innerText === "Error") {
					for (let msg of doc.findAll(".msg")) {
						if (msg.innerText === "You cannot access this page while traveling!") {
							resolve(true);
							return clearInterval(checker);
						} else if (msg.innerText.indexOf("You are in") > -1) {
							console.log("here1");
							resolve(true);
							return clearInterval(checker);
						}
					}
				} else {
					for (let msg of doc.findAll(".msg")) {
						if (msg.innerText.indexOf("You are in") > -1) {
							resolve(false);
							return clearInterval(checker);
						}
					}
				}
			}

			if (userdata && userdata.travel && userdata.travel.time_left > 0) {
				resolve(true);
				return clearInterval(checker);
			} else {
				resolve(false);
				return clearInterval(checker);
			}
		}, 100);
	});
}

function isAbroad() {
	return new Promise((resolve) => {
		let counter = 0;
		let checker = setInterval(function () {
			if (doc.find("#travel-home")) {
				resolve(true);
				return clearInterval(checker);
			} else if (doc.find(".header") && doc.find(".header").classList[doc.find(".header").classList.length - 1] !== "responsive-sidebar-header") {
				resolve(true);
				return clearInterval(checker);
			} else if (doc.find("#skip-to-content") && doc.find("#skip-to-content").innerText === "Preferences") {
				resolve(false);
				return clearInterval(checker);
			} else if (doc.find("#sidebarroot h2") && doc.find("#sidebarroot h2").innerText === "Information") {
				resolve(false);
				return clearInterval(checker);
			} else {
				for (let msg of doc.findAll(".msg")) {
					if (msg.innerText === "You can't access this page while abroad.") {
						resolve(true);
						return clearInterval(checker);
					} else if (msg.innerText.indexOf("You are in") > -1) {
						resolve(true);
						return clearInterval(checker);
					}
				}
			}

			if (counter >= 50) {
				resolve(false);
				return clearInterval(checker);
			} else {
				counter++;
			}
		}, 100);
	});
}

function shouldDisable() {
	return extensions.doctorn === true && !settings.force_tt;
}

function getCookie(cname) {
	const name = cname + "=";

	for (let cookie of decodeURIComponent(document.cookie).split(";")) {
		cookie = cookie.trimLeft();

		if (cookie.includes(name)) {
			return cookie.substring(name.length);
		}
	}
	return "";
}

function getRFC() {
	const rfc = getCookie("rfc_v");
	if (!rfc) {
		const cookies = document.cookie.split("; ");
		for (let i in cookies) {
			let cookie = cookies[i].split("=");
			if (cookie[0] === "rfc_v") {
				return cookie[1];
			}
		}
	}
	return rfc;
}

function addRFC(url) {
	url = url || "";
	url += (url.split("?").length > 1 ? "&" : "?") + "rfcv=" + getRFC();
	return url;
}

function romanToArabic(roman) {
	if (!isNaN(parseInt(roman))) return roman;

	let dict = {
		I: 1,
		II: 2,
		III: 3,
		IV: 4,
		V: 5,
		VI: 6,
		VII: 7,
		VIII: 8,
		IX: 9,
		X: 10,
		XI: 11,
		XII: 12,
		XIII: 13,
		XIV: 14,
		XV: 15,
	};

	return dict[roman];
}

function arabicToRoman(arabic) {
	let dict = {
		1: "I",
		2: "II",
		3: "III",
		4: "IV",
		5: "V",
		6: "VI",
		7: "VII",
		8: "VIII",
		9: "IX",
		10: "X",
		11: "XI",
		12: "XII",
		13: "XIII",
		14: "XIV",
		15: "XV",
	};
	return dict[arabic];
}

function usingChrome() {
	return navigator.userAgent.includes("Chrome");
}

function usingFirefox() {
	return navigator.userAgent.includes("Firefox");
}

function usingYandex() {
	return navigator.userAgent.includes("YaBrowser");
}

function getSearchParameters() {
	return new URL(window.location).searchParams;
}

function getHashParameters() {
	let hash = window.location.hash;

	if (hash.startsWith("#/")) hash = hash.substring(2);
	else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

	if (!hash.startsWith("!")) hash = "?" + hash;

	return new URLSearchParams(hash);
}

function isOverflownX(element) {
	return element.scrollWidth > element.clientWidth;
}

function isOverflownY(element) {
	return element.scrollHeight > element.clientHeight;
}

function capitalize(text, everyWord = false) {
	if (!everyWord) return text[0].toUpperCase() + text.slice(1);

	return text
		.trim()
		.split(" ")
		.map((word) => capitalize(word))
		.join(" ")
		.trim();
}

function lastInList(item, list) {
	return list[list.length - 1] === item;
}

function toSeconds(time) {
	time = time.toLowerCase();
	let seconds = 0;

	if (time.includes("h")) {
		seconds += parseInt(time.split("h")[0].trim()) * 3600;
		time = time.split("h")[1];
	}
	if (time.includes("m")) {
		seconds += parseInt(time.split("m")[0].trim()) * 60;
		time = time.split("m")[1];
	}
	if (time.includes("s")) {
		seconds += parseInt(time.split("s")[0].trim());
	}

	return seconds;
}

function numberWithCommas(x, shorten = true, formatter) {
	if (shorten) {
		let words;
		if (shorten === true || shorten === 1) {
			words = {
				thousand: "k",
				million: "mil",
				billion: "bill",
			};
		} else {
			words = {
				thousand: "k",
				million: "m",
				billion: "b",
			};
		}

		if (Math.abs(x) >= 1e9) {
			if (Math.abs(x) % 1e9 === 0) return (x / 1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + words.billion;
			else return (x / 1e9).toFixed(3) + words.billion;
		} else if (Math.abs(x) >= 1e6) {
			if (Math.abs(x) % 1e6 === 0) return x / 1e6 + words.million;
			else return (x / 1e6).toFixed(3) + words.million;
		} else if (Math.abs(x) >= 1e3) {
			if (Math.abs(x) % 1e3 === 0) return x / 1e3 + words.thousand;
		}
	}

	if (formatter) {
		return formatter.format(x);
	}

	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function timeAgo(time) {
	switch (typeof time) {
		case "number":
			break;
		case "string":
			time = +new Date(time);
			break;
		case "object":
			if (time.constructor === Date) time = time.getTime();
			break;
		default:
			time = +new Date();
	}

	let seconds = (+new Date() - time) / 1000,
		token = "ago",
		list_choice = 1;

	if (seconds === 0) return "Just now";

	if (seconds < 0) {
		seconds = Math.abs(seconds);
		token = "from now";
		list_choice = 2;
	}

	const formats = [
		[60, "sec", 1], // 60
		[120, "1min ago", "1min from now"], // 60*2
		[3600, "min", 60], // 60*60, 60
		[7200, "1h ago", "1h from now"], // 60*60*2
		[86400, "h", 3600], // 60*60*24, 60*60
		[172800, "Yesterday", "Tomorrow"], // 60*60*24*2
		[604800, "d", 86400], // 60*60*24*7, 60*60*24
		[1209600, "Last week", "Next week"], // 60*60*24*7*4*2
		[2419200, "w", 604800], // 60*60*24*7*4, 60*60*24*7
		[4838400, "Last month", "Next month"], // 60*60*24*7*4*2
		[29030400, "mon", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
		[58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
		[2903040000, "y", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
		[5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
		[58060800000, "cen", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
	];
	for (let format of formats) {
		if (seconds < format[0]) {
			if (typeof format[2] == "string") return format[list_choice];
			else return Math.floor(seconds / format[2]) + "" + format[1] + " " + token;
		}
	}
	return time;
}

function setBadge(text, attributes = {}) {
	const types = {
		default: { text: "" },
		error: { text: "error", color: "#FF0000" },
		update_available: { text: "new", color: "#e0dd11" },
		update_installed: { text: "new", color: "#0ad121" },
		new_message: { text: () => attributes.count.toString(), color: "#84af03" },
		new_event: { text: () => attributes.count.toString(), color: "#009eda" },
	};

	const badge = types[text];

	if (!badge) {
		chrome.browserAction.setBadgeText({ text: text || "" });
		if (attributes.color) chrome.browserAction.setBadgeBackgroundColor({ color: attributes.color });
	} else {
		if (badge.text) chrome.browserAction.setBadgeText({ text: (typeof badge.text === "function" ? badge.text() : badge.text) || "" });
		if (badge.color) chrome.browserAction.setBadgeBackgroundColor({ color: badge.color });
	}
}

function getBadgeText() {
	return new Promise((resolve) => chrome.browserAction.getBadgeText({}, (text) => resolve(text)));
}

function secondsToHours(x) {
	return Math.floor(x / 60 / 60); // seconds, minutes
}

function secondsToDays(x) {
	return Math.floor(x / 60 / 60 / 24); // seconds, minutes, hours
}

function dateParts(date) {
	let data = [date.getDate(), date.getMonth() + 1, date.getFullYear(), date.getHours(), date.getMinutes(), date.getSeconds()];

	return data.map((value) => toMultipleDigits(value, 2));
}

function rotateElement(element, degrees) {
	let startDegrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;

	if (startDegrees !== 0 && startDegrees % 360 === 0) {
		startDegrees = 0;
		element.style.transform = `rotate(${startDegrees}deg)`;
	} else if (startDegrees > 360) {
		startDegrees = startDegrees % 360;
		element.style.transform = `rotate(${startDegrees}deg)`;
	}

	const totalDegrees = startDegrees + degrees;
	const step = 1000 / degrees;

	let rotater = setInterval(function () {
		const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
		let newRotation = currentRotation + step;

		if (currentRotation < totalDegrees && newRotation > totalDegrees) {
			newRotation = totalDegrees;
			clearInterval(rotater);
		}

		element.style.transform = `rotate(${newRotation}deg)`;
	}, 1);
}

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function timeUntil(milliseconds, attributes = {}) {
	milliseconds = parseFloat(milliseconds);
	if (milliseconds < 0) return -1;

	let days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
	let hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	let minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
	let seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

	switch (attributes.max_unit) {
		case "h":
			hours = hours + days * 24;
			days = undefined;
			break;
		// case "m":
		//     minutes = minutes + days*24 + hours*60;
		//     days = undefined;
		//     hours = undefined;
		//     break;
		// case "s":
		//     seconds = seconds + days*24 + hours*60 + minutes*60;
		//     days = undefined;
		//     hours = undefined;
		//     minutes = undefined;
		//     break;
		default:
			break;
	}

	let time_left;

	if (days) {
		time_left = `${days}d ${hours}h ${minutes}m ${seconds}s`;
	} else if (hours) {
		time_left = `${hours}h ${minutes}m ${seconds}s`;
	} else if (minutes) {
		time_left = `${minutes}m ${seconds}s`;
	} else if (seconds) {
		time_left = `${seconds}s`;
	} else if (milliseconds === 0) {
		time_left = "0s";
	}

	if (attributes.hide_nulls) {
		time_left += " ";

		while (time_left !== time_left.replace(/\s[0][A-Za-z]\s/, " ")) {
			time_left = time_left.replace(/\s[0][A-Za-z]\s/, " ");
		}
	}

	return time_left.trim();
}

function formatDate([day, month, year], formatting) {
	day = toMultipleDigits(day);
	month = toMultipleDigits(month);

	switch (formatting) {
		case "us":
			return year ? `${month}/${day}/${year}` : `${month}/${day}`;
		case "eu":
			return year ? `${day}.${month}.${year}` : `${day}.${month}`;
		default:
			return formatting([day, month, year], "eu");
	}
}

function formatTime([hours, minutes, seconds], formatting) {
	let pm = hours >= 12;
	hours = toMultipleDigits(hours);
	minutes = toMultipleDigits(minutes);
	seconds = toMultipleDigits(seconds);

	switch (formatting) {
		case "us":
			hours = hours % 12;
			if (hours === 0) hours = 12;
			hours = toMultipleDigits(hours);

			return seconds ? `${hours}:${minutes}:${seconds} ${pm ? "PM" : "AM"}` : `${hours}:${minutes} ${pm ? "PM" : "AM"}`;
		case "eu":
			return seconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
		default:
			return formatting([day, month, year], "eu");
	}
}

function toMultipleDigits(number, digits = 2) {
	if (number === undefined) return undefined;
	return number.toString().length < digits ? toMultipleDigits(`0${number}`, digits) : number;
}

function findItemsInList(list, attributes = {}, single = false) {
	let arr = [];
	if (!list || Object.keys(attributes).length === 0) return arr;

	for (let item of list) {
		let fitsAll = true;

		for (let attribute in attributes) {
			// noinspection EqualityComparisonWithCoercionJS
			if (item[attribute] != attributes[attribute]) fitsAll = false;
		}

		if (fitsAll) {
			arr.push(item);
			if (single) break;
		}
	}

	return arr;
}

function findItemsInObject(object, attributes = {}, single = false) {
	let arr = [];
	if (!object || Object.keys(attributes).length === 0) return arr;

	for (let id in object) {
		const item = object[id];
		let fitsAll = true;

		for (let attribute in attributes) {
			// noinspection EqualityComparisonWithCoercionJS
			if (item[attribute] != attributes[attribute]) fitsAll = false;
		}

		if (fitsAll) {
			arr.push({
				id,
				...item,
			});

			if (single) break;
		}
	}

	return arr;
}

function hasParent(element, attributes = {}) {
	if (!element.parentElement) return false;

	if (attributes.class && element.parentElement.classList.contains(attributes.class)) return true;
	if (attributes.id && element.parentElement.id === attributes.id) return true;

	return hasParent(element.parentElement, attributes);
}

function findParent(element, attributes = {}) {
	if (!element || !element.parentElement) return undefined;

	if (attributes.class && element.parentElement.classList.contains(attributes.class)) return element.parentElement;
	if (attributes.id && element.parentElement.id === attributes.id) return element.parentElement;
	if (attributes.has_attribute && element.parentElement.getAttribute(attributes.has_attribute) !== null) return element.parentElement;

	return findParent(element.parentElement, attributes);
}

function sort(table, col, type) {
	let order = "desc";

	let columnHeader = table.find(`:scope>.row div:nth-child(${col})`);
	if (columnHeader.find("i.fa-caret-up")) columnHeader.find("i.fa-caret-up").setClass("fas fa-caret-down");
	else if (columnHeader.find("i.fa-caret-down")) {
		columnHeader.find("i.fa-caret-down").setClass("fas fa-caret-up");
		order = "asc";
	} else {
		// old header
		const currentI = table.find(".row i");
		if (currentI) currentI.remove();

		// new header
		columnHeader.appendChild(
			doc.new({
				type: "i",
				class: "fas fa-caret-down",
			})
		);
	}

	let rows = [];

	if (!table.find(".body .row")) {
		rows = [];
	} else if (!table.find(`.body .row div:nth-child(${col})`).getAttribute("priority")) {
		rows = [...table.findAll(".body>.row")];
		rows = sortRows(rows, order, type);
	} else {
		let priorities = [];
		for (let item of table.findAll(`.body>.row div:nth-child(${col})`)) {
			let priority = item.getAttribute("priority");

			if (!priorities[parseInt(priority) - 1]) priorities[parseInt(priority) - 1] = [];
			priorities[parseInt(priority) - 1].push(item.parentElement);
		}

		for (let priority of priorities) {
			if (priority === undefined) continue;

			rows = [...rows, ...sortRows(priority, order, type)];
		}
	}

	let body = doc.new("div");

	for (let row of rows) body.appendChild(row);

	table.find(".body").innerHTML = body.innerHTML;

	function sortRows(rows, order, type) {
		if (order === "asc") {
			rows.sort(function (a, b) {
				const helper = sortHelper(a, b);

				return helper.a - helper.b;
			});
		} else if (order === "desc") {
			rows.sort(function (a, b) {
				const helper = sortHelper(a, b);

				return helper.b - helper.a;
			});
		}

		return rows;

		function sortHelper(elementA, elementB) {
			let isDate = false;
			let valueA, valueB;
			if (type === "value") {
				valueA = elementA.find(`*:nth-child(${col})`).getAttribute("value");
				valueB = elementB.find(`*:nth-child(${col})`).getAttribute("value");

				isDate = elementA.find(`*:nth-child(${col})`).getAttribute("type") === "date";
			} else if (type === "text") {
				valueA = [...elementA.children][col - 1].innerText;
				valueB = [...elementB.children][col - 1].innerText;
			}

			let a, b;
			if (isDate && Date.parse(valueA) && Date.parse(valueB)) {
				a = Date.parse(valueA);
				b = Date.parse(valueB);
			} else if (isNaN(parseFloat(valueA))) {
				if (valueA.indexOf("$") > -1) {
					a = parseFloat(valueA.replace("$", "").replace(/,/g, ""));
					b = parseFloat(valueB.replace("$", "").replace(/,/g, ""));
				} else {
					a = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					b = 0;
				}
			} else {
				a = parseFloat(valueA);
				b = parseFloat(valueB);
			}

			return { a, b };
		}
	}
}

function requireNavbar() {
	return requireElement("#sidebar");
}

function requireContent() {
	return requireElement(".box-title, #equipped-weapons, div.title-black[role=heading]");
}

function requireMessageBox() {
	return requireElement(".info-msg-cont");
}

function requireElement(selector, attributes = {}) {
	attributes = {
		parent: doc,
		...attributes,
	};

	return requireCondition(() => (attributes.invert && !attributes.parent.find(selector)) || (!attributes.invert && attributes.parent.find(selector)), {
		delay: attributes.delay,
	});
}

function requirePlayerList(listClass) {
	return new Promise((resolve) => {
		let checker = setInterval(function () {
			if (
				!(
					(doc.find(`${listClass}>*`) && doc.find(`${listClass}>*`).classList.contains("ajax-placeholder")) ||
					doc.find(`${listClass}>* .ajax-placeholder`)
				) &&
				doc.find(`${listClass}`) &&
				doc.find(`${listClass}`).firstElementChild
			) {
				resolve(true);
				return clearInterval(checker);
			}
		});
	});
}

function requireCondition(condition, attributes = {}) {
	attributes = {
		delay: 10,
		...attributes,
	};

	return new Promise((resolve) => {
		let checker = setInterval(function () {
			if (condition()) {
				resolve(true);
				return clearInterval(checker);
			}
		}, attributes.delay);
	});
}

function flashColor(element, type, speed, min = 0, max = 1) {
	let [r, g, b, a] = element.style.backgroundColor
		.split("(")[1]
		.split(")")[0]
		.split(",")
		.map((x) => parseFloat(x.trim()));

	let interval;
	switch (speed) {
		case "slow":
			interval = 35;
			break;
		case "fast":
			interval = 20;
			break;
		default:
			break;
	}

	let increase = a === min;
	setInterval(function () {
		if (a <= min) {
			increase = true;
		} else if (a >= max) {
			increase = false;
		}

		if (increase) {
			a += 0.01;
		} else {
			a -= 0.01;
		}

		switch (type) {
			case "background":
				element.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
				break;
			default:
				break;
		}
	}, interval);
}

function loadingPlaceholder(element, display) {
	if (display) {
		if (element.find(".tt-loading-placeholder")) {
			element.find(".tt-loading-placeholder").classList.add("active");
		} else {
			element.appendChild(
				doc.new({
					type: "img",
					class: "ajax-placeholder m-top10 m-bottom10 tt-loading-placeholder active",
					attributes: { src: "https://www.torn.com/images/v2/main/ajax-loader.gif" },
				})
			);
		}
	} else {
		element.find(".tt-loading-placeholder").classList.remove("active");
	}
}

function saveSortingOrder(parent, page) {
	let names = [];
	for (let section of parent.findAll(":scope>.tt-section")) {
		names.push(section.getAttribute("name"));
	}

	ttStorage.change({ sorting: { [page]: names } });
}

function sortSections(parent, page) {
	let names = sorting[page];

	for (let name of names) {
		let section = parent.find(`.tt-section[name='${name}']`);
		if (section) parent.appendChild(section);
	}
}

const notificationPlayer = new Audio();
notificationPlayer.autoplay = false;
notificationPlayer.preload = true;

let notificationSound = null;

function getNotificationSound(id) {
	return new Promise((resolve) => {
		if (id == -1) {
			resolve(-1);
		} else if (id == 0) {
			resolve(0);
		} else if (!Number.isNaN(Number.parseInt(id))) {
			resolve(`audio/notification${id}.wav`);
		} else {
			ttStorage.get("notifications_custom", (sound) => {
				resolve(sound);
			});
		}
	});
}

function notifyUser(title, message, url) {
	ttStorage.get("settings", async function (settings) {
		const notificationOptions = {
			type: "basic",
			iconUrl: "images/icon128.png",
			title,
			message,
		};

		if (notificationSound != settings.notifications_sound) {
			//avoid reloading sounds
			let sound = await getNotificationSound(settings.notifications_sound);
			if (sound && !Number.isInteger(sound)) {
				notificationPlayer.src = sound;
			}

			notificationSound = settings.notifications_sound;
		}

		notificationPlayer.volume = settings.notifications_volume;

		if ((notificationSound == -1 || notificationSound != 0) && hasSilentSupport()) notificationOptions.silent = true;

		chrome.notifications.create(notificationOptions, function (id) {
			notificationLinkRelations[id] = url;
			console.log("   Notified!", notificationOptions);

			if (notificationSound != -1 && notificationSound != 0) notificationPlayer.play();
		});

		if (settings.notifications_tts) {
			console.log("READING TTS");

			window.speechSynthesis.speak(new SpeechSynthesisUtterance(title));
			window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
		}
	});
}

function loadConfirmationPopup(options) {
	return new Promise((resolve, reject) => {
		const customElements = {};
		const markdownConverter = new showdown.Converter();

		doc.find(".tt-black-overlay").classList.add("active");
		doc.find(".tt-confirmation-popup").classList.add("active");

		doc.find("body").classList.add("tt-unscrollable");

		doc.find(".tt-confirmation-popup .title").innerText = options.title;

		let markdown = markdownConverter.makeHtml(options.message);

		// Custom convert
		const textareas = markdown.match(/TEXTAREA=(.*)$/gm) || [];
		for (let textarea of textareas) {
			const id = textarea.split("=")[1].replace("]", "");
			customElements[id] = { type: "textarea" };
			markdown = markdown.replace(`[TEXTAREA=${id}]`, `<textarea id='${id}'></textarea>`);
		}

		doc.find(".tt-confirmation-popup .message").innerHTML = markdown;

		doc.find(".tt-confirmation-popup .actions .button.green").onclick = () => {
			doc.find(".tt-black-overlay").classList.remove("active");
			doc.find(".tt-confirmation-popup").classList.remove("active");

			doc.find("body").classList.remove("tt-unscrollable");

			// Fill custom elements
			for (let key in customElements) {
				customElements[key] = doc.find(`${customElements[key].type}[id='${key}']`).value;
			}

			return resolve(customElements);
		};
		doc.find(".tt-confirmation-popup .actions .button.red").onclick = () => {
			doc.find(".tt-black-overlay").classList.remove("active");
			doc.find(".tt-confirmation-popup").classList.remove("active");

			doc.find("body").classList.remove("tt-unscrollable");

			return reject();
		};
	});
}

function onDragOver(event) {
	event.preventDefault();
}

function onDragEnter() {
	if (doc.find("#ttQuick .temp.item")) {
		doc.find("#ttQuick .temp.item").style.opacity = "1";
	}
}

function onDragLeave() {
	if (doc.find("#ttQuick .temp.item")) {
		doc.find("#ttQuick .temp.item").style.opacity = "0.2";
	}
}

function onDrop(event) {
	let tempElement = doc.find("#ttQuick .temp.item");
	tempElement.classList.remove("temp");
	doc.find("#ttQuick .content").style.maxHeight = doc.find("#ttQuick .content").scrollHeight + "px";

	// Firefox opens new tab when dropping item
	event.preventDefault();
	event.dataTransfer.clearData();
}

function calculateEstimateBattleStats(rank, level, totalCrimes, networth) {
	const triggersLevel = RANK_TRIGGERS.level.filter((x) => x <= level).length;
	const triggersCrimes = RANK_TRIGGERS.crimes.filter((x) => x <= totalCrimes).length;
	const triggersNetworth = RANK_TRIGGERS.networth.filter((x) => x <= networth).length;

	const triggersStats = RANKS[rank] - triggersLevel - triggersCrimes - triggersNetworth - 1;

	return RANK_TRIGGERS.stats[triggersStats] || "N/A";
}

function injectXHR() {
	if (injectedXHR) return;

	doc.find("head").appendChild(
		doc.new({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/js/injectXHR.js") },
		})
	);
	injectedXHR = true;
}

function addXHRListener(callback) {
	injectXHR();

	window.addEventListener("tt-xhr", callback);
}

function injectFetch() {
	if (injectedFetch) return;

	doc.find("head").appendChild(
		doc.new({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/js/injectFetch.js") },
		})
	);
	injectedFetch = true;
}

function addFetchListener(callback) {
	injectFetch();

	window.addEventListener("tt-fetch", callback);
}

function sleep(millis) {
	return new Promise((resolve) => setTimeout(resolve, millis));
}

function handleTornProfileData(data) {
	let response = {};

	const rankSpl = data.rank.split(" ");
	let rank = rankSpl[0];
	if (rankSpl[1][0] === rankSpl[1][0].toLowerCase()) rank += " " + rankSpl[1];

	const level = data.level;
	const totalCrimes = data.criminalrecord ? data.criminalrecord.total : 0;
	const networth = data.personalstats ? data.personalstats.networth : 0;

	response.stats = {
		...data.personalstats,
		...data.criminalrecord,
		level: data.level,
	};
	response.battleStatsEstimate = calculateEstimateBattleStats(rank, level, totalCrimes, networth);

	return response;
}

function hasClass(node, className) {
	return node && node.classList && node.classList.contains(className);
}

function hasCachedEstimate(userId) {
	return cache && cache.battleStatsEstimate && cache.battleStatsEstimate[userId];
}

function estimateStats(userId, isIndividual = false, listCount = 0, level) {
	return new Promise(async (resolve, reject) => {
		if (hasCachedEstimate(userId)) {
			return resolve({
				estimate: cache.battleStatsEstimate[userId].data,
				cached: true,
			});
		} else {
			if (level && settings.scripts.stats_estimate.max_level && settings.scripts.stats_estimate.max_level < level)
				return reject({ message: "Too high of a level.", show: false });

			if (!isIndividual && settings.scripts.stats_estimate.cached_only)
				return reject({ message: "No cached result found!", show: settings.scripts.stats_estimate.cached_only_show });

			if (!isIndividual) await sleep(listCount * settings.scripts.stats_estimate.delay);

			fetchApi_v2("torn", { section: "user", objectid: userId, selections: "profile,personalstats,crimes" })
				.then((result) => {
					const estimate = handleTornProfileData(result).battleStatsEstimate;

					cacheEstimate(userId, new Date().getTime(), estimate, result.last_action);

					return resolve({
						estimate,
						cached: false,
						apiResult: result,
						show: true,
					});
				})
				.catch(({ error }) => {
					reject({ message: error, show: true });
				});
		}
	});
}

function estimateStatsInList(listSelector, userHandler) {
	console.log("Estimating stats in a list.", doc.findAll(listSelector).length);

	new Promise((resolve) => {
		let estimateCount = 0;

		for (let person of doc.findAll(listSelector)) {
			const response = userHandler(person);
			if (!response) continue;
			const { userId, level } = response;
			if (!userId) continue;

			let container;
			if (person.nextElementSibling && person.nextElementSibling.classList && person.nextElementSibling.classList.contains("tt-userinfo-container")) {
				container = person.nextElementSibling;
				container.innerHTML = "";
			} else {
				container = doc.new({ type: "li", class: "tt-userinfo-container" });
				person.parentElement.insertBefore(container, person.nextElementSibling);
			}
			if (person.classList.contains("filter-hidden")) container.classList.add("filter-hidden");

			let row;
			if (container.find(".tt-userinfo-row--statsestimate")) {
				row = container.find(".tt-userinfo-row--statsestimate");
				row.childNodes.forEach((child) => child.remove());
			} else {
				row = doc.new({ type: "section", class: "tt-userinfo-row tt-userinfo-row--statsestimate" });
				container.appendChild(row);
			}

			if (!hasCachedEstimate(userId)) estimateCount++;

			// TODO - Enable if there ever comes a native filter for other pages.
			/*
				new MutationObserver((mutations, observer) => {
					container.style.display = tableRow.style.display === "none" ? "none" : "block";
				}).observe(tableRow, { attributes: true, attributeFilter: ["style"] });
			*/

			loadingPlaceholder(row, true);
			estimateStats(userId, false, estimateCount, level)
				.then((result) => {
					loadingPlaceholder(row, false);
					row.appendChild(
						doc.new({
							type: "span",
							text: `Stat Estimate: ${result.estimate}`,
						})
					);
				})
				.catch((error) => {
					loadingPlaceholder(row, false);

					if (error.show) {
						row.appendChild(
							doc.new({
								type: "span",
								class: "tt-userinfo-message",
								text: error.message,
								attributes: { color: "error" },
							})
						);
					} else {
						row.remove();
						if (container.children.length === 0) container.remove();
					}
				})
				.then(() => resolve());
		}
	}).then(() => console.log("Estimated stats."));
}

function cacheEstimate(userId, timestamp, estimate, lastAction) {
	let days = 7;

	if (estimate === RANK_TRIGGERS.stats[RANK_TRIGGERS.stats.length - -1]) days = 31;
	else if (lastAction && new Date().getTime() - new Date(lastAction.timestamp).getTime() > TO_MILLIS.DAYS * 180) days = 31;

	console.log(`Caching result for '${userId}' for ${days} days.`, estimate);

	cache.battleStatsEstimate[userId] = {
		timestamp,
		ttl: TO_MILLIS.DAYS * days,
		data: estimate,
	};
	ttStorage.change({
		cache: {
			battleStatsEstimate: {
				[userId]: {
					timestamp,
					ttl: TO_MILLIS.DAYS * days,
					data: estimate,
				},
			},
		},
	});
}

function fetchApi_v2(
	location,
	options = {
		/*section, objectid, selections, proxyFail, action, target, postData, from*/
	}
) {
	return new Promise(async (resolve, reject) => {
		ttStorage.get(["api_key", "proxy_key"], ([api_key, proxy_key]) => {
			const URLs = {
				torn: "https://api.torn.com/",
				yata__v0: "https://yata.alwaysdata.net/",
				yata__v1: "https://yata.alwaysdata.net/api/v1/",
				"torn-proxy": "https://torn-proxy.com/",
				tornstats: "https://www.tornstats.com/",
				// 'tornstats': 'https://www.torn-proxy.com/tornstats/',
				torntools: "https://torntools.gregork.com/",
				nukefamily: "https://www.nukefamily.org/",
			};

			const proxyFail = options.proxyFail;
			const ogLocation = location;
			if ((location === "torn" || location === "tornstats") && !proxyFail && proxy_key && proxy_key.length === 32) location = "torn-proxy";
			const base = URLs[location];
			let section;
			if (ogLocation === "tornstats" && location === "torn-proxy") {
				section = "tornstats/" + options.section;
			} else if (location !== "tornstats" && location !== "nukefamily") {
				section = options.section + "/";
			} else {
				section = options.section;
			}
			const objectid = options.objectid ? options.objectid + "?" : "?";
			const selections = options.selections || "";
			const apiKey = api_key;
			const proxyKey = proxy_key;

			let full_url;
			if (location === "torntools" || location === "nukefamily") {
				full_url = `${base}${section || ""}`;
			} else if (proxyKey || apiKey) {
				full_url = `${base}${section}${objectid}${selections ? "selections=" + selections : ""}${
					location !== "yata" ? (proxyKey && !proxyFail ? `&key=${proxyKey}` : `&key=${apiKey}`) : ""
				}`;
				for (let param of ["action", "target", "from"]) {
					if (options[param] === undefined) continue;
					full_url += `&${param}=${options[param]}`;
				}
			} else {
				console.log("NO API KEY IS SET. ABORTING FETCH.");
				return reject({ error: "NO API KEY IS SET. ABORTING FETCH." });
			}
			// console.log('new fetch', full_url);

			let parameters = {};

			if (options.method === "POST") {
				parameters = {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(options.postData),
				};
			}

			fetch(full_url, parameters)
				.then(async (response) => {
					let result = {};
					try {
						result = await response.json();
						console.log("result", result);
					} catch (err) {
						console.log("response", response);
						if (response.status === 200) {
							result.success = true;
						} else {
							result.error = "Unknown error";
						}
					}

					logFetch(
						ogLocation,
						((options) => {
							if (location === "torn-proxy") options.proxy = true;
							return options;
						})(options)
					);

					if (result.error) {
						// Torn Proxy
						if (result.proxy) {
							// Revoked key
							if (result.code === 2) {
								return reject({ error: "Proxy Key has been revoked." });
							} else {
								options.proxyFail = true;
								return fetchApi_v2(ogLocation, options);
							}
						}
						// TornTools
						else if (location === "torntools") {
							return reject(result);
						}
						// Torn API
						else {
							// API offline
							if (result.error.code === 9) {
								console.log("API SYSTEM OFFLINE");
								setBadge("error");

								ttStorage.change({ api: { online: false, error: result.error.error } }, function () {
									return reject({ error: result.error.error });
								});
							} else {
								console.log("API ERROR:", result.error.error);

								ttStorage.change({ api: { online: true, error: result.error.error } }, function () {
									return reject({ error: result.error.error });
								});
							}
						}
					} else {
						try {
							if (ogLocation === "torn" && isNaN(await getBadgeText())) {
								setBadge("");
							}
						} catch (err) {
							console.log("Unable to get Badge.");
						}

						if (ogLocation === "torn") {
							ttStorage.change({ api: { online: true, error: "" } }, function () {
								return resolve(result);
							});
						} else {
							return resolve(result);
						}
					}
				})
				.catch((result) => {
					// const result = await response.json();
					console.log("result", result);

					if (result.error) {
						// Torn Proxy
						if (result.proxy) {
							// Revoked key
							if (result.code === "2") {
								return reject({ error: "Proxy Key has been revoked." });
							} else {
								options.proxyFail = true;
								return fetchApi_v2(location, options);
							}
						}
						// TornTools
						else if (location === "torntools") {
							return reject(result);
						}
						// Torn API
						else {
							// API offline
							if (result.error.code === 9) {
								console.log("API SYSTEM OFFLINE");
								setBadge("error");

								ttStorage.change({ api: { online: false, error: result.error.error } }, function () {
									return reject({ error: result.error.error });
								});
							} else {
								console.log("API ERROR:", result);

								ttStorage.change({ api: { online: true, error: result.error.error } }, function () {
									return reject({ error: result.error.error });
								});
							}
						}
					}
				});
		});
	});

	function logFetch(location, options = {}) {
		ttStorage.get("api_history", (api_history) => {
			const section = options.section ? options.section + "/" : "";
			const objectid = options.objectid ? options.objectid + "?" : "?";
			const selections = options.selections || "";
			const action = options.action;
			const target = options.target;

			let type = "other";

			switch (location) {
				case "torn-proxy" || "torn":
					if (selections.includes("personalstats")) type = objectid === "" ? "userdata" : "profile_stats";
					else if (selections.length && section === "user") type = "stakeouts";
					break;
				case "tornstats":
					if (action === "spy") type = "spy";
					else if (action === "crimes") type = "OC info";
					else if (action === "getStatGraph") type = "Gym Stats";
					break;
				case "yata":
					if (section === "loot/timings") type = "Loot timings";
					else if (section === "bazaar/abroad/export") type = "Travel data (pull)";
					else if (section === "bazaar/abroad/import") type = "Travel data (push)";
					break;
			}

			location = location.split("__")[0];
			api_history[location].push({
				date: new Date().toString(),
				location: location,
				section: section,
				objectid: objectid,
				selections: selections,
				action: action,
				target: target,
				type: type,
			});
			ttStorage.set({ api_history: api_history });
		});
	}
}

// Uses fetchApi_v2
function fetchRelay(location, options) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ action: "fetch-relay", location: location, options: options }, (response) => {
			if (response.error) return reject(response);
			return resolve(response);
		});
	});
}

function hasSilentSupport() {
	return !usingFirefox() && (!navigator.userAgent.includes("Mobile Safari") || usingYandex());
}
