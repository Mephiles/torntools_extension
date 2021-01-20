"use strict";

// noinspection JSUnresolvedVariable
chrome = typeof browser !== "undefined" ? browser : chrome;

const ttStorage = new (class {
	get(key) {
		return new Promise((resolve) => {
			if (Array.isArray(key)) {
				chrome.storage.local.get(key, (data) => resolve(key.map((i) => data[i])));
			} else if (key) {
				chrome.storage.local.get([key], (data) => resolve(data[key]));
			} else {
				chrome.storage.local.get(null, (data) => resolve(data));
			}
		});
	}

	set(object) {
		return new Promise((resolve) => {
			chrome.storage.local.set(object, function () {
				resolve();
			});
		});
	}

	clear() {
		return new Promise((resolve) => {
			chrome.storage.local.clear(function () {
				resolve();
			});
		});
	}

	change(object) {
		return new Promise(async (resolve) => {
			for (let key of Object.keys(object)) {
				const data = recursive(await this.get(key), object[key]);

				function recursive(parent, toChange) {
					for (let key in toChange) {
						if (parent && key in parent && typeof toChange[key] === "object" && !Array.isArray(toChange[key])) {
							parent[key] = recursive(parent[key], toChange[key]);
						} else if (parent) {
							parent[key] = toChange[key];
						} else {
							parent = { [key]: toChange[key] };
						}
					}
					return parent;
				}

				await this.set({ [key]: data });
			}
			resolve();
		});
	}

	reset(key) {
		return new Promise(async (resolve) => {
			if (["attackHistory"].includes(key)) {
				await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE[key]) });

				resolve();
			} else {
				const apiKey = api ? api.torn.key : undefined;

				await this.clear();
				await this.set(getDefaultStorage(DEFAULT_STORAGE));
				await this.change({ api: { torn: { key: apiKey } } });

				console.log("Storage cleared");
				console.log("New storage", await this.get());

				resolve();
			}

			function getDefaultStorage(defaultStorage) {
				let newStorage = {};

				for (let key in defaultStorage) {
					newStorage[key] = {};

					if (typeof defaultStorage[key] === "object") {
						if (defaultStorage[key] instanceof DefaultSetting) {
							switch (typeof defaultStorage[key].defaultValue) {
								case "function":
									newStorage[key] = defaultStorage[key].defaultValue();
									break;
								case "boolean":
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
								default:
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
							}
						} else {
							newStorage[key] = getDefaultStorage(defaultStorage[key]);
						}
					}
				}

				return newStorage;
			}
		});
	}
})();

const DEFAULT_STORAGE = {
	version: {
		oldVersion: new DefaultSetting({ type: "string" }),
		showNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
	},
	api: {
		torn: {
			key: new DefaultSetting({ type: "string" }),
			online: new DefaultSetting({ type: "boolean", defaultValue: true }),
			error: new DefaultSetting({ type: "string" }),
		},
	},
	settings: {
		updateNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
		developer: new DefaultSetting({ type: "boolean", defaultValue: false }),
		formatting: {
			date: new DefaultSetting({ type: "string", defaultValue: "eu" }),
			time: new DefaultSetting({ type: "string", defaultValue: "eu" }),
		},
		notifications: {
			sound: new DefaultSetting({ type: "string", defaultValue: "default" }),
			soundCustom: new DefaultSetting({ type: "string", defaultValue: "" }),
			tts: new DefaultSetting({ type: "boolean", defaultValue: false }),
			link: new DefaultSetting({ type: "boolean", defaultValue: true }),
			volume: new DefaultSetting({ type: "number", defaultValue: 100 }),
			requireInteraction: new DefaultSetting({ type: "boolean", defaultValue: false }),
			searchOpenTab: new DefaultSetting({ type: "boolean", defaultValue: true }),
			types: {
				global: new DefaultSetting({ type: "boolean", defaultValue: () => Notification.permission === "granted" }),
				events: new DefaultSetting({ type: "boolean", defaultValue: true }),
				messages: new DefaultSetting({ type: "boolean", defaultValue: true }),
				status: new DefaultSetting({ type: "boolean", defaultValue: true }),
				traveling: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldowns: new DefaultSetting({ type: "boolean", defaultValue: true }),
				education: new DefaultSetting({ type: "boolean", defaultValue: true }),
				newDay: new DefaultSetting({ type: "boolean", defaultValue: true }),
				energy: new DefaultSetting({ type: "array", defaultValue: ["100%"] }),
				nerve: new DefaultSetting({ type: "array", defaultValue: ["100%"] }),
				happy: new DefaultSetting({ type: "array", defaultValue: ["100%"] }),
				life: new DefaultSetting({ type: "array", defaultValue: ["100%"] }),
				chainTimer: new DefaultSetting({ type: "array", defaultValue: [] }),
				chainBonus: new DefaultSetting({ type: "array", defaultValue: [] }),
				leavingHospital: new DefaultSetting({ type: "array", defaultValue: [] }),
				landing: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownDrug: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownBooster: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownMedical: new DefaultSetting({ type: "array", defaultValue: [] }),
				stocks: new DefaultSetting({ type: "object", defaultValue: {} }),
			},
		},
		apiUsage: {
			delayEssential: new DefaultSetting({ type: "number", defaultValue: 30 }),
			delayBasic: new DefaultSetting({ type: "number", defaultValue: 120 }),
			delayStakeouts: new DefaultSetting({ type: "number", defaultValue: 30 }),
			user: {
				bars: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldowns: new DefaultSetting({ type: "boolean", defaultValue: true }),
				travel: new DefaultSetting({ type: "boolean", defaultValue: true }),
				events: new DefaultSetting({ type: "boolean", defaultValue: true }),
				messages: new DefaultSetting({ type: "boolean", defaultValue: true }),
				money: new DefaultSetting({ type: "boolean", defaultValue: true }),
				refills: new DefaultSetting({ type: "boolean", defaultValue: true }),
				personalstats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stocks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				education: new DefaultSetting({ type: "boolean", defaultValue: true }),
				attacks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				networth: new DefaultSetting({ type: "boolean", defaultValue: true }),
				inventory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				merits: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		themes: {
			pages: new DefaultSetting({ type: "string", defaultValue: "default" }),
			containers: new DefaultSetting({ type: "string", defaultValue: "default" }),
		},
		hideAreas: new DefaultSetting({ type: "array", defaultValue: [] }),
		hideIcons: new DefaultSetting({ type: "array", defaultValue: [] }),
		customLinks: new DefaultSetting({ type: "array", defaultValue: [] }),
		pages: {
			global: {
				alignLeft: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideLevelUpgrade: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideQuitButtons: new DefaultSetting({ type: "boolean", defaultValue: false }),
				keepAttackHistory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				miniProfileLastAction: new DefaultSetting({ type: "boolean", defaultValue: true }),
				nukeRevive: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			chat: {
				fontSize: new DefaultSetting({ type: "number", defaultValue: 12 }),
				searchChat: new DefaultSetting({ type: "boolean", defaultValue: true }),
				blockZalgo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				completeUsernames: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlights: new DefaultSetting({ type: "array", defaultValue: [{ name: "$player", color: "#7ca900" }] }),
				titleHighlights: new DefaultSetting({ type: "array", defaultValue: [] }),
			},
			sidebar: {
				notes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightEnergy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightNerve: new DefaultSetting({ type: "boolean", defaultValue: false }),
				ocTimer: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			popup: {
				dashboard: new DefaultSetting({ type: "boolean", defaultValue: true }),
				marketSearch: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stocksOverview: new DefaultSetting({ type: "boolean", defaultValue: true }),
				defaultTab: new DefaultSetting({ type: "string", defaultValue: "dashboard" }),
				hoverBarTime: new DefaultSetting({ type: "boolean", defaultValue: false }),
				showStakeouts: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			icon: {
				global: new DefaultSetting({ type: "boolean", defaultValue: true }),
				energy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				nerve: new DefaultSetting({ type: "boolean", defaultValue: true }),
				happy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				life: new DefaultSetting({ type: "boolean", defaultValue: true }),
				chain: new DefaultSetting({ type: "boolean", defaultValue: true }),
				travel: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			home: {
				networthDetails: new DefaultSetting({ type: "boolean", defaultValue: true }),
				effectiveStats: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			items: {
				quickItems: new DefaultSetting({ type: "boolean", defaultValue: true }),
				values: new DefaultSetting({ type: "boolean", defaultValue: true }),
				drugDetails: new DefaultSetting({ type: "boolean", defaultValue: true }),
				marketLinks: new DefaultSetting({ type: "boolean", defaultValue: false }),
				highlightBloodBags: new DefaultSetting({ type: "string", defaultValue: "none" }),
				missingFlowers: new DefaultSetting({ type: "boolean", defaultValue: false }),
				missingPlushies: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			companies: {
				specialMugMoney: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
	},
	filters: {
		preferences: {
			showAdvanced: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		containers: new DefaultSetting({ type: "object", defaultValue: {} }),
	},
	userdata: new DefaultSetting({ type: "object", defaultValue: {} }),
	torndata: new DefaultSetting({ type: "object", defaultValue: {} }),
	factiondata: new DefaultSetting({ type: "object", defaultValue: {} }),
	stakeouts: new DefaultSetting({ type: "object", defaultValue: {} }),
	attackHistory: {
		fetchData: new DefaultSetting({ type: "boolean", defaultValue: true }),
		lastAttack: new DefaultSetting({ type: "number", defaultValue: 0 }),
		history: new DefaultSetting({ type: "object", defaultValue: {} }),
	},
	notes: {
		sidebar: {
			text: new DefaultSetting({ type: "string", defaultValue: "" }),
			height: new DefaultSetting({ type: "string", defaultValue: "22px" }),
		},
	},
	quick: {
		items: new DefaultSetting({ type: "array", defaultValue: [180] }),
	},
};

const CONTRIBUTORS = {
	Mephiles: {
		id: 2087524,
		name: "Mephiles",
		color: "green",
	},
	DeKleineKobini: {
		id: 2114440,
		name: "DeKleineKobini",
		color: "orange",
	},
	wootty2000: {
		id: 2344687,
		name: "wootty2000",
		color: "red",
	},
	finally: {
		id: 2060206,
		name: "finally",
		color: "purple",
	},
	Fogest: {
		id: 2254826,
		name: "Fogest",
		color: "chartreuse",
	},
	smikula: {
		name: "smikula",
		color: "#fbff09",
	},
	kontamusse: {
		id: 2408039,
		name: "kontamusse",
		color: "#58e4e4",
	},
	Natty_Boh: {
		id: 1651049,
		name: "Natty_Boh",
		color: "blue",
	},
	h4xnoodle: {
		id: 2315090,
		name: "h4xnoodle",
		color: "teal",
	},
	bandirao: {
		id: 1936821,
		name: "bandirao",
		color: "greenyellow",
	},
	Tesa: {
		id: 2639608,
		name: "Tesa",
		color: "white",
	},
};

let mobile;
let injectedXHR, injectedFetch;
let mouseX, mouseY;

let rotatingElements = {};

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => userdata.name || "", description: "Your player name." }];

const TO_MILLIS = {
	SECONDS: 1000,
	MINUTES: 1000 * 60,
	HOURS: 1000 * 60 * 60,
	DAYS: 1000 * 60 * 60 * 24,
};

const CHAIN_BONUSES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

const LINKS = {
	events: "https://www.torn.com/events.php#/step=all",
	messages: "https://www.torn.com/messages.php",
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	education: "https://www.torn.com/education.php#/step=main",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain",
	hospital: "https://www.torn.com/hospitalview.php",
	organizedCrimes: "https://www.torn.com/factions.php?step=your#/tab=crimes",
};

const CUSTOM_LINKS_PRESET = {
	"Bazaar : Management": { link: "https://www.torn.com/bazaar.php#/manage" },
	"Faction : Armory": { link: "https://www.torn.com/factions.php?step=your#/tab=armoury" },
	"Faction : Organized Crimes": { link: "https://www.torn.com/factions.php?step=your#/tab=crimes" },
	"Item Market": { link: "https://www.torn.com/imarket.php" },
	Museum: { link: "https://www.torn.com/museum.php" },
	Pharmacy: { link: "https://www.torn.com/shops.php?step=pharmacy" },
	"Points Market": { link: "https://www.torn.com/pmarket.php" },
	Raceway: { link: "https://www.torn.com/loader.php?sid=racing" },
	"Travel Agency": { link: "https://www.torn.com/travelagency.php" },
};

// noinspection SpellCheckingInspection
const API_USAGE = {
	user: {
		name: true,
		server_time: true,
		happy: {
			current: true,
			maximum: true,
			interval: true,
			ticktime: true,
			fulltime: true,
		},
		life: {
			current: true,
			maximum: true,
			interval: true,
			ticktime: true,
			fulltime: true,
		},
		energy: {
			current: true,
			maximum: true,
			interval: true,
			ticktime: true,
			fulltime: true,
		},
		nerve: {
			current: true,
			maximum: true,
			interval: true,
			ticktime: true,
			fulltime: true,
		},
		chain: {
			current: true,
			maximum: true,
			timeout: true,
			cooldown: true,
		},
		status: {
			description: true,
			state: true,
			until: true,
		},
		travel: {
			destination: true,
			timestamp: true,
			departed: true,
			time_left: true,
		},
		events: {
			"*": {
				event: true,
				seen: true,
			},
		},
		messages: {
			"*": {
				name: true,
				title: true,
				seen: true,
			},
		},
		money_onhand: true,
		cooldowns: {
			drug: true,
			medical: true,
			booster: true,
		},
		education_timeleft: true,
		education_completed: true,
		refills: {
			energy_refill_used: true,
			nerve_refill_used: true,
		},
		last_action: {
			timestamp: true,
		},
		merits: {
			"Masterful Looting": true,
		},
		inventory: {
			"*": {
				ID: true,
				type: true,
				quantity: true,
				market_price: true,
			},
		},
	},
	properties: {},
	faction: {},
	company: {},
	item_market: {},
	torn: {
		items: {
			"*": {
				name: true,
				type: true,
				market_value: true,
				circulation: true,
				image: true,
			},
		},
		education: {
			"*": {},
		},
	},
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CHAT_TITLE_COLORS = {
	blue: ["rgb(10,60,173)", "rgb(22,109,236)"],
	brown: ["rgb(109,53,4)", "rgb(146,69,4)"],
	orange: ["rgb(227,130,5)", "rgb(234,164,50)"],
	purple: ["rgb(94,7,119)", "rgb(184,9,241)"],
	red: ["rgb(123,4,4)", "rgb(255,3,3)"],
};

const THEMES = {
	default: {
		containerClass: "theme-default",
	},
	alternative: {
		containerClass: "theme-alternative",
	},
};

const ALL_ICONS = Array.from({ length: 80 }, (x, i) => `icon${i + 1}`);

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

const DRUG_INFORMATION = {
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
	197: {
		pros: ["Doubles Happy"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy & Happy"],
		},
	},
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
	199: {
		pros: ["+30% Strength", "+50% Defense", "+50 Energy", "+200-500 Happy", "+5 Nerve"],
		cons: ["-30% Speed & Dexterity"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve", "-50% Happy"],
			stats: "-30% Speed & Dexterity",
		},
	},
	200: {
		pros: ["Removes all hospital time (except Radiation Sickness) and replenishes life to 66.6%", "+50-100 Happy"],
		cooldown: "3-4 hours",
	},
	201: {
		pros: ["+20% Strength & Dexterity", "+250 Happy"],
		cooldown: "4-7 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "27 hours",
			stats: "-10x(player level) Speed (permanent)",
		},
	},
	203: {
		pros: ["+500 Happy"],
		cons: ["-20% All Battle Stats", "-25 Energy (caps at 0)"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "1h 40min",
		},
	},
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
	205: {
		pros: ["+25% All Battle Stats", "+75 Happy"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-150 Happy"],
		},
	},
	206: {
		pros: ["+250 Energy", "+75 Happy"],
		cons: ["-35% All Battle Stats"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "3 days 12 hours",
			extra: "24 hours of cooldown and increased addiction",
		},
	},
	870: {
		pros: ["Cost of Attacking & Reviving reduced to 15 Energy", "+50% Speed", "+25% Dexterity"],
		cons: ["Only works on Valentine's Day"],
		cooldown: "5 hours",
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
