"use strict";

chrome = typeof browser !== "undefined" ? browser : chrome;

const FORUM_POST = "https://www.torn.com/forums.php#/p=threads&f=67&t=16170566&b=0&a=0";

const ttStorage = new (class {
	get(key) {
		return new Promise(async (resolve) => {
			if (Array.isArray(key)) {
				const data = await this._get(key);

				resolve(key.map((i) => data[i]));
			} else if (key) {
				const data = await this._get([key]);

				resolve(data[key]);
			} else {
				const data = await this._get(null);

				resolve(data);
			}
		});
	}

	_get(key) {
		return new Promise(async (resolve) => {
			let data;
			let count = 0;
			do {
				data = await new Promise((resolve) => chrome.storage.local.get(key, (data) => resolve(data)));

				count++;
			} while (data && !Object.keys(data).length && count < 3);

			resolve(data);
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
			for (const key of Object.keys(object)) {
				const data = recursive(await this.get(key), object[key]);

				function recursive(parent, toChange) {
					for (const key in toChange) {
						if (
							parent &&
							typeof parent === "object" &&
							!Array.isArray(parent[key]) &&
							key in parent &&
							typeof toChange[key] === "object" &&
							!Array.isArray(toChange[key])
						) {
							parent[key] = recursive(parent[key], toChange[key]);
						} else if (parent && typeof parent === "object") {
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
				const newStorage = {};

				for (const key in defaultStorage) {
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

const JAIL_CONSTANTS = {
	// Activity
	online: "online",
	idle: "idle",
	offline: "offline",
	// Factions
	allFactions: "__all__",
	noFaction: "__none__",
	unknownFactions: "__unknown__",
	// Quick modes
	bust: "bust",
	bail: "bail",
	// Time
	timeMin: 0,
	timeMax: 100,
	timeStep: 1,
	// Level
	levelMin: 1,
	levelMax: 100,
	levelStep: 1,
	// Score
	scoreMin: 0,
	scoreMax: 5000,
	scoreStep: 25,
};

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
		featureDisplay: new DefaultSetting({ type: "boolean", defaultValue: true }),
		featureDisplayPosition: new DefaultSetting({ type: "string", defaultValue: "bottom-left" }),
		featureDisplayOnlyFailed: new DefaultSetting({ type: "boolean", defaultValue: false }),
		featureDisplayHideDisabled: new DefaultSetting({ type: "boolean", defaultValue: false }),
		developer: new DefaultSetting({ type: "boolean", defaultValue: false }),
		formatting: {
			date: new DefaultSetting({ type: "string", defaultValue: "eu" }),
			time: new DefaultSetting({ type: "string", defaultValue: "eu" }),
		},
		sorting: {
			abroad: new DefaultSetting({ type: "object", defaultValue: {} }),
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
			comment: new DefaultSetting({ type: "string", defaultValue: "" }),
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
				perks: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		themes: {
			pages: new DefaultSetting({ type: "string", defaultValue: "default" }),
			containers: new DefaultSetting({ type: "string", defaultValue: "default" }),
		},
		hideAreas: new DefaultSetting({ type: "array", defaultValue: [] }),
		hideIcons: new DefaultSetting({ type: "array", defaultValue: [] }),
		hideCasinoGames: new DefaultSetting({ type: "array", defaultValue: [] }),
		allyFactionsIDs: new DefaultSetting({ type: "array", defaultValue: [] }),
		customLinks: new DefaultSetting({ type: "array", defaultValue: [] }),
		pages: {
			global: {
				alignLeft: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideLevelUpgrade: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideQuitButtons: new DefaultSetting({ type: "boolean", defaultValue: false }),
				keepAttackHistory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				miniProfileLastAction: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			profile: {
				statusIndicator: new DefaultSetting({ type: "boolean", defaultValue: true }),
				idBesideProfileName: new DefaultSetting({ type: "boolean", defaultValue: true }),
				notes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showAllyWarning: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ageToWords: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			chat: {
				fontSize: new DefaultSetting({ type: "number", defaultValue: 12 }),
				searchChat: new DefaultSetting({ type: "boolean", defaultValue: true }),
				blockZalgo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				completeUsernames: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlights: new DefaultSetting({ type: "array", defaultValue: [{ name: "$player", color: "#7ca900" }] }),
				titleHighlights: new DefaultSetting({ type: "array", defaultValue: [] }),
				tradeTimer: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			sidebar: {
				notes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightEnergy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightNerve: new DefaultSetting({ type: "boolean", defaultValue: false }),
				ocTimer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				collapseAreas: new DefaultSetting({ type: "boolean", defaultValue: true }),
				settingsLink: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideGymHighlight: new DefaultSetting({ type: "boolean", defaultValue: false }),
				upkeepPropHighlight: new DefaultSetting({ type: "number", defaultValue: 0 }),
				barLinks: new DefaultSetting({ type: "boolean", defaultValue: true }),
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
			education: {
				greyOut: new DefaultSetting({ type: "boolean", defaultValue: true }),
				finishTime: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			jail: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			bank: {
				investmentInfo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				investmentDueTime: new DefaultSetting({ type: "boolean", defaultValue: true }),
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
				bookEffects: new DefaultSetting({ type: "boolean", defaultValue: true }),
				canGains: new DefaultSetting({ type: "boolean", defaultValue: true }),
				nerveGains: new DefaultSetting({ type: "boolean", defaultValue: true }),
				candyHappyGains: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			companies: {
				specials: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			travel: {
				computer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				table: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cleanFlight: new DefaultSetting({ type: "boolean", defaultValue: false }),
				travelProfits: new DefaultSetting({ type: "boolean", defaultValue: true }),
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				sortable: new DefaultSetting({ type: "boolean", defaultValue: true }),
				peopleFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			stocks: {
				acronyms: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			events: {
				easterEggs: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			hospital: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			api: {
				autoFillKey: new DefaultSetting({ type: "boolean", defaultValue: true }),
				autoDemo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				autoPretty: new DefaultSetting({ type: "boolean", defaultValue: true }),
				clickableSelections: new DefaultSetting({ type: "boolean", defaultValue: true }),
				marking: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			forums: {
				warning: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			bazaar: {
				itemsCost: new DefaultSetting({ type: "boolean", defaultValue: true }),
				worth: new DefaultSetting({ type: "boolean", defaultValue: true }),
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				maxBuyIgnoreCash: new DefaultSetting({ type: "boolean", defaultValue: false }),
				redirects: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			trade: {
				itemValues: new DefaultSetting({ type: "boolean", defaultValue: true }),
				openChat: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			displayCase: {
				worth: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			shops: {
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				maxBuyIgnoreCash: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			casino: {
				netTotal: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			racing: {
				winPercentage: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			faction: {
				csvWarReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				csvChainReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				openOc: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightOwn: new DefaultSetting({ type: "boolean", defaultValue: true }),
				availablePlayers: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			property: {
				value: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			gym: {
				specialist: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		external: {
			tornstats: new DefaultSetting({ type: "boolean", defaultValue: false }),
			yata: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
	},
	filters: {
		preferences: {
			showAdvanced: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		hospital: {
			timeStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			timeEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			faction: new DefaultSetting({ type: "string", defaultValue: "" }),
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			revivesOn: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		jail: {
			time: {
				from: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.timeMin }),
				to: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.timeMax }),
			},
			level: {
				from: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.levelMin }),
				to: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.levelMax }),
			},
			score: {
				from: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.scoreMin }),
				to: new DefaultSetting({ type: "number", defaultValue: JAIL_CONSTANTS.scoreMax }),
			},
			faction: new DefaultSetting({ type: "string", defaultValue: JAIL_CONSTANTS.allFactions }),
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		containers: new DefaultSetting({ type: "object", defaultValue: {} }),
		travel: {
			open: new DefaultSetting({ type: "boolean", defaultValue: false }),
			type: new DefaultSetting({ type: "string", defaultValue: "basic" }),
			categories: new DefaultSetting({ type: "array", defaultValue: [] }),
			countries: new DefaultSetting({ type: "array", defaultValue: [] }),
			hideOutOfStock: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		abroad: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			status: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			faction: new DefaultSetting({ type: "string", defaultValue: "" }),
			special: {
				newplayer: new DefaultSetting({ type: "string", defaultValue: "both" }),
				incompany: new DefaultSetting({ type: "string", defaultValue: "both" }),
				infaction: new DefaultSetting({ type: "string", defaultValue: "both" }),
				isdonator: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
		},
		trade: {
			hideValues: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		gym: {
			specialist1: new DefaultSetting({ type: "string", defaultValue: "none" }),
			specialist2: new DefaultSetting({ type: "string", defaultValue: "none" }),
		},
	},
	userdata: new DefaultSetting({ type: "object", defaultValue: {} }),
	torndata: new DefaultSetting({ type: "object", defaultValue: {} }),
	factiondata: new DefaultSetting({ type: "object", defaultValue: {} }),
	localdata: {
		tradeMessage: new DefaultSetting({ type: "number", defaultValue: 0 }),
	},
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
		profile: new DefaultSetting({ type: "object", defaultValue: {} }),
	},
	quick: {
		items: new DefaultSetting({ type: "array", defaultValue: [] }),
		jail: new DefaultSetting({ type: "array", defaultValue: [] }),
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
		color: "brown",
	},
	AllMight: {
		id: 1878147,
		name: "AllMight",
		color: "#ff3333",
	},
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

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => userdata.name || "", description: "Your player name." }];

const API_USAGE = {
	user: {
		bazaar: {
			"*": {
				quantity: true, // target
				market_price: true, // target
			},
		},
		display: {
			"*": {
				quantity: true, // target
				market_price: true, // target
			},
		},
		name: true,
		player_id: true,
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
			color: true,
			until: true,
		},
		travel: {
			destination: true,
			method: true,
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
			status: true,
			timestamp: true,
			relative: true,
		},
		merits: {
			"Masterful Looting": true,
		},
		inventory: {
			"*": {
				ID: true,
				name: true,
				type: true,
				quantity: true,
				equipped: true,
				market_price: true,
			},
		},
		attacks: {
			"*": {
				timestamp_ended: true,
				attacker_id: true,
				attacker_name: true,
				defender_id: true,
				defender_name: true,
				result: true,
				stealthed: true,
				respect_gain: true,
				modifiers: {
					war: true,
					retaliation: true,
					group_attack: true,
					overseas: true,
					chain_bonus: true,
				},
			},
		},
		networth: {
			pending: true,
			wallet: true,
			bank: true,
			points: true,
			cayman: true,
			vault: true,
			piggybank: true,
			items: true,
			displaycase: true,
			bazaar: true,
			// properties: true,
			stockmarket: true,
			auctionhouse: true,
			company: true,
			bookie: true,
			// loan: true,
			unpaidfees: true,
			total: true,
			// parsetime: true,
		},
		personalstats: {
			networthpending: true,
			networthwallet: true,
			networthbank: true,
			networthpoints: true,
			networthcayman: true,
			networthvault: true,
			networthpiggybank: true,
			networthitems: true,
			networthdisplaycase: true,
			networthbazaar: true,
			// networthproperties: true,
			networthstockmarket: true,
			networthauctionhouse: true,
			networthcompany: true,
			networthbookie: true,
			// networthloan: true,
			networthunpaidfees: true,
			networth: true,
		},
		stocks: {
			"*": {
				// stock_id: true,
				total_shares: true,
				benefit: {
					ready: true,
					progress: true,
					frequency: true,
				},
				dividend: {
					ready: true,
					increment: true,
					progress: true,
					frequency: true,
				},
				transactions: {
					"*": {
						shares: true,
						bought_price: true,
					},
				},
			},
		},
		enhancer_perks: true,
		job_perks: true,
		faction_perks: true,
		company_perks: true,
		book_perk: true,
		faction: {
			faction_id: true,
			faction_tag: true,
		},
		timestamp: true,
		city_bank: {
			time_left: true,
		},
	},
	properties: {},
	faction: {
		crimes: {
			"*": {
				participants: true,
				time_ready: true,
				initiated: true,
			},
		},
	},
	company: {},
	item_market: {
		bazaar: {
			"*": {
				quantity: true,
				cost: true,
			},
		},
		itemmarket: {
			"*": {
				quantity: true,
				cost: true,
			},
		},
	},
	torn: {
		items: {
			"*": {
				name: true,
				effect: true,
				type: true,
				market_value: true,
				circulation: true,
				image: true,
			},
		},
		stocks: {
			"*": {
				name: true,
				acronym: true,
				current_price: true,
				total_shares: true,
				benefit: {
					frequency: true,
					requirement: true,
					description: true,
				},
			},
		},
		education: {
			"*": {},
		},
		properties: {
			"*": {
				cost: true,
			},
		},
		bank: {
			"*": true,
		},
	},
};

const API_SELECTIONS = {
	user: [
		"attacks",
		"bars",
		"bazaar", // target
		"cooldowns",
		"display", // target
		"education",
		"events",
		"inventory",
		"merits",
		"messages",
		"money",
		"networth",
		"perks",
		"personalstats",
		"profile",
		"refills",
		"stocks",
		"timestamp",
		"travel",
	],
	properties: [],
	faction: ["crimes"],
	company: [],
	item_market: ["bazaar", "itemmarket"],
	torn: ["bank", "education", "honors", "items", "medals", "pawnshop", "properties", "stocks"],
};

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

const BOOK_DESCRIPTIONS = {
	744: "Incr. Str by 5% up to 10m upon completion.",
	745: "Incr. Spd by 5% up to 10m upon completion.",
	746: "Incr. Def by 5% up to 10m upon completion.",
	747: "Incr. Dex by 5% up to 10m upon completion.",
	748: "Incr. all working stats by 5% up to 2.5k each upon completion.",
	749: "Incr. blacklist & friend list by 100 upon completion.",
	750: "Provides a free merit reset upon completion.",
	751: "Removes a large amount of drug addiction upon completion.",
	752: "Provides a passive 25% bonus to all stats (31 days).",
	753: "Provides a passive 100% bonus to Str (31 days).",
	754: "Provides a passive 100% bonus to Def (31 days).",
	755: "Provides a passive 100% bonus to Spd (31 days).",
	756: "Provides a passive 100% bonus to Dex (31 days).",
	757: "Incr. all gym gains by 20% (31 days).",
	758: "Incr. Str gym gains by 30% (31 days).",
	759: "Incr. Def gym gains by 30% (31 days).",
	760: "Incr. Spd gym gains by 30% (31 days).",
	761: "Incr. Dex gym gains by 30% (31 days).",
	762: "Incr. crime skill & crime EXP gain by 25% (31 days).",
	763: "Incr. all EXP gain by 25% (31 days).",
	764: "Decr. all hospital times by 50% (31 days).",
	765: "Decr. all jail times by 50% (31 days).",
	766: "Decr. all travel times by 25% (31 days).",
	767: "Incr. travel items by 10 (31 days).",
	768: "Guaranteed stealth for the next 31 days.",
	769: "Large jail bust & escape boost for the next 31 days.",
	770: "Happiness can regen above maximum (31 days)",
	771: "Doubles contract credit & money rewards (31 days).",
	772: "Incr. city item spawns (31 days).",
	773: "Gain no drug addiction 31 days.",
	774: "Provides +20% energy regen (31 days).",
	775: "Doubles nerve regen (31 days).",
	776: "Doubles happiness regen (31 days).",
	777: "Doubles life regen (31 days).",
	778: "Duke will occasionally retaliate against your attackers (31 days).",
	779: "Decr. all consumable cooldowns by 50% (31 days).",
	780: "Decr. all medical cooldowns by 50% (31 days).",
	781: "Doubles alcohol effects (31 days).",
	782: "Doubles energy drink effects (31 days).",
	783: "Doubles candy effects (31 days).",
	784: "Incr. maximum energy to 250 (31 days)",
	785: "Re-use your last used book (31 days).",
	786: "Boost your employee effectiveness (31 days).",
	787: "Guaranteed escape attempt success (31 days)",
};
