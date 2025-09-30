"use strict";

// noinspection JSUnresolvedReference
chrome = typeof browser !== "undefined" ? browser : chrome;

const FORUM_POST = "https://www.torn.com/forums.php#/p=threads&f=67&t=16243863";

const ttStorage = new (class {
	get(key) {
		return new Promise(async (resolve) => {
			if (Array.isArray(key)) {
				const data = await new Promise((resolve) => chrome.storage.local.get(key, (data) => resolve(data)));

				resolve(key.map((i) => data[i]));
			} else if (key) {
				const data = await new Promise((resolve) => chrome.storage.local.get([key], (data) => resolve(data)));

				resolve(data[key]);
			} else {
				const data = await new Promise((resolve) => chrome.storage.local.get(null, (data) => resolve(data)));

				resolve(data);
			}
		});
	}

	set(object) {
		return new Promise((resolve) => chrome.storage.local.set(object, () => resolve()));
	}

	remove(key) {
		if (!key) return Promise.reject("No key provided");

		return new Promise(async (resolve) => chrome.storage.local.remove(Array.isArray(key) ? key : [key], () => resolve()));
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
					// eslint-disable-line no-inner-declarations
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
							const value = toChange[key];

							if (value === undefined || value === null) delete parent[key];
							else parent[key] = value;
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
			if (["attackHistory", "stakeouts"].includes(key)) {
				await this.set({ [key]: getDefaultStorage(DEFAULT_STORAGE)[key] });

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

	async getSize() {
		let size;

		if (chrome.storage.local.getBytesInUse) size = await new Promise((resolve) => chrome.storage.local.getBytesInUse((data) => resolve(data)));
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
})();

const ttCache = new (class {
	constructor() {
		this.cache = {};
	}

	set cache(value) {
		this._cache = value || {};
	}

	get cache() {
		return this._cache;
	}

	get(section, key) {
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return this.hasValue(section, key) ? this.cache[section][key].value : undefined;
		else return this.hasValue(key) ? this.cache[key].value : undefined;
	}

	async remove(section, key) {
		if (!key) {
			key = section;
			section = null;
		}

		if ((section && !this.hasValue(section, key)) || (!section && !this.hasValue(key))) {
			// Nothing to delete.
			return;
		}

		if (section) delete this.cache[section][key];
		else delete this.cache[key];

		await ttStorage.set({ cache: this.cache });
	}

	hasValue(section, key) {
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return section in this.cache && key in this.cache[section] && this.cache[section][key].timeout > Date.now();
		else return key in this.cache && this.cache[key].timeout > Date.now();
	}

	async set(object, ttl, section) {
		const timeout = Date.now() + ttl;
		if (section) {
			if (!(section in this.cache)) this.cache[section] = {};

			for (const [key, value] of Object.entries(object)) {
				this.cache[section][key] = { value, timeout };
			}
		} else {
			for (const [key, value] of Object.entries(object)) {
				this.cache[key] = { value, timeout };
			}
		}

		await ttStorage.set({ cache: this.cache });
	}

	clear() {
		ttStorage.set({ cache: {} }).then(() => (this.cache = {}));
	}

	async refresh() {
		let hasChanged = false;
		const now = Date.now();

		refreshObject(this.cache);

		for (const section in this.cache) {
			if (!Object.keys(this.cache[section]).length) delete this.cache[section];
		}

		if (hasChanged) await ttStorage.set({ cache: this.cache });

		function refreshObject(object) {
			for (const key in object) {
				const value = object[key];

				if ("timeout" in value) {
					if (value.timeout > now) continue;

					hasChanged = true;
					delete object[key];
				} else {
					refreshObject(value);
				}
			}
		}
	}
})();

const ttUsage = new (class {
	constructor() {
		this.usage = {};
	}

	async add(location) {
		const minute = (Date.now() / TO_MILLIS.MINUTES).dropDecimals();
		if (!(minute in this.usage)) this.usage[minute] = {};
		if (!(location in this.usage[minute])) this.usage[minute][location] = 0;

		this.usage[minute][location] += 1;
		await ttStorage.set({ usage: this.usage });
	}

	async refresh() {
		const last24HrsMinute = ((Date.now() - 24 * TO_MILLIS.HOURS) / TO_MILLIS.MINUTES).dropDecimals();

		Object.keys(this.usage).forEach((minute) => {
			if (minute < last24HrsMinute) delete this.usage[minute];
		});

		await ttStorage.set({ usage: this.usage });
	}

	async clear() {
		this.usage = {};
		await ttStorage.set({ usage: {} });
	}
})();

const DEFAULT_STORAGE = {
	version: {
		current: new DefaultSetting({ type: "string", defaultValue: () => chrome.runtime.getManifest().version }),
		oldVersion: new DefaultSetting({ type: "string" }),
		showNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
	},
	api: {
		torn: {
			key: new DefaultSetting({ type: "string" }),
			online: new DefaultSetting({ type: "boolean", defaultValue: true }),
			error: new DefaultSetting({ type: "string" }),
		},
		tornstats: {
			key: new DefaultSetting({ type: "string" }),
		},
		yata: {
			key: new DefaultSetting({ type: "string" }),
		},
		ffScouter: {
			key: new DefaultSetting({ type: "string" }),
		},
	},
	settings: {
		updateNotice: new DefaultSetting({ type: "boolean", defaultValue: true }),
		featureDisplay: new DefaultSetting({ type: "boolean", defaultValue: true }),
		featureDisplayPosition: new DefaultSetting({ type: "string", defaultValue: "bottom-left" }),
		featureDisplayOnlyFailed: new DefaultSetting({ type: "boolean", defaultValue: false }),
		featureDisplayHideDisabled: new DefaultSetting({ type: "boolean", defaultValue: false }),
		featureDisplayHideEmpty: new DefaultSetting({ type: "boolean", defaultValue: true }),
		developer: new DefaultSetting({ type: "boolean", defaultValue: false }),
		formatting: {
			tct: new DefaultSetting({ type: "boolean", defaultValue: false }),
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
				chainTimerEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				chainBonusEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				leavingHospitalEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				landingEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldownDrugEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldownBoosterEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldownMedicalEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				chainTimer: new DefaultSetting({ type: "array", defaultValue: [] }),
				chainBonus: new DefaultSetting({ type: "array", defaultValue: [] }),
				leavingHospital: new DefaultSetting({ type: "array", defaultValue: [] }),
				landing: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownDrug: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownBooster: new DefaultSetting({ type: "array", defaultValue: [] }),
				cooldownMedical: new DefaultSetting({ type: "array", defaultValue: [] }),
				stocks: new DefaultSetting({ type: "object", defaultValue: {} }),
				npcsGlobal: new DefaultSetting({ type: "boolean", defaultValue: true }),
				npcs: new DefaultSetting({ type: "array", defaultValue: [] }),
				npcPlannedEnabled: new DefaultSetting({ type: "boolean", defaultValue: true }),
				npcPlanned: new DefaultSetting({ type: "array", defaultValue: [] }),
			},
		},
		apiUsage: {
			comment: new DefaultSetting({ type: "string", defaultValue: "TornTools" }),
			delayEssential: new DefaultSetting({ type: "number", defaultValue: 30 }),
			delayBasic: new DefaultSetting({ type: "number", defaultValue: 120 }),
			delayStakeouts: new DefaultSetting({ type: "number", defaultValue: 30 }),
			user: {
				bars: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldowns: new DefaultSetting({ type: "boolean", defaultValue: true }),
				travel: new DefaultSetting({ type: "boolean", defaultValue: true }),
				newevents: new DefaultSetting({ type: "boolean", defaultValue: true }),
				newmessages: new DefaultSetting({ type: "boolean", defaultValue: true }),
				refills: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stocks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				education: new DefaultSetting({ type: "boolean", defaultValue: true }),
				networth: new DefaultSetting({ type: "boolean", defaultValue: true }),
				inventory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				jobpoints: new DefaultSetting({ type: "boolean", defaultValue: true }),
				merits: new DefaultSetting({ type: "boolean", defaultValue: true }),
				perks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				icons: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ammo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				battlestats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				crimes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				workstats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				skills: new DefaultSetting({ type: "boolean", defaultValue: true }),
				weaponexp: new DefaultSetting({ type: "boolean", defaultValue: true }),
				properties: new DefaultSetting({ type: "boolean", defaultValue: true }),
				calendar: new DefaultSetting({ type: "boolean", defaultValue: true }),
				organizedcrime: new DefaultSetting({ type: "boolean", defaultValue: true }),
				personalstats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				attacks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				money: new DefaultSetting({ type: "boolean", defaultValue: true }),
				honors: new DefaultSetting({ type: "boolean", defaultValue: true }),
				medals: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		themes: {
			pages: new DefaultSetting({ type: "string", defaultValue: "default" }),
			containers: new DefaultSetting({ type: "string", defaultValue: "default" }),
		},
		hideIcons: new DefaultSetting({ type: "array", defaultValue: [] }),
		hideCasinoGames: new DefaultSetting({ type: "array", defaultValue: [] }),
		hideStocks: new DefaultSetting({ type: "array", defaultValue: [] }),
		alliedFactions: new DefaultSetting({ type: "array", defaultValue: [] }),
		customLinks: new DefaultSetting({ type: "array", defaultValue: [] }),
		employeeInactivityWarning: new DefaultSetting({ type: "array", defaultValue: [] }),
		factionInactivityWarning: new DefaultSetting({ type: "array", defaultValue: [] }),
		userAlias: new DefaultSetting({ type: "object", defaultValue: {} }),
		csvDelimiter: new DefaultSetting({ type: "string", defaultValue: ";" }),
		pages: {
			global: {
				alignLeft: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideLevelUpgrade: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideQuitButtons: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideTutorials: new DefaultSetting({ type: "boolean", defaultValue: false }),
				keepAttackHistory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				miniProfileLastAction: new DefaultSetting({ type: "boolean", defaultValue: true }),
				reviveProvider: new DefaultSetting({ type: "string", defaultValue: "" }),
				pageTitles: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stackingMode: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			profile: {
				avgpersonalstats: new DefaultSetting({ type: "boolean", defaultValue: false }),
				statusIndicator: new DefaultSetting({ type: "boolean", defaultValue: true }),
				idBesideProfileName: new DefaultSetting({ type: "boolean", defaultValue: true }),
				notes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showAllyWarning: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ageToWords: new DefaultSetting({ type: "boolean", defaultValue: true }),
				disableAllyAttacks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				box: new DefaultSetting({ type: "boolean", defaultValue: true }),
				boxStats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				boxSpy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				boxStakeout: new DefaultSetting({ type: "boolean", defaultValue: true }),
				boxAttackHistory: new DefaultSetting({ type: "boolean", defaultValue: true }),
				boxFetch: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			chat: {
				fontSize: new DefaultSetting({ type: "number", defaultValue: 12 }),
				searchChat: new DefaultSetting({ type: "boolean", defaultValue: true }),
				blockZalgo: new DefaultSetting({ type: "boolean", defaultValue: true }),
				completeUsernames: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlights: new DefaultSetting({ type: "array", defaultValue: [{ name: "$player", color: "#7ca900" }] }),
				titleHighlights: new DefaultSetting({ type: "array", defaultValue: [] }),
				tradeTimer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideChatButton: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideChat: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			sidebar: {
				notes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightEnergy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightNerve: new DefaultSetting({ type: "boolean", defaultValue: false }),
				ocTimer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				oc2Timer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				oc2TimerPosition: new DefaultSetting({ type: "boolean", defaultValue: false }),
				oc2TimerLevel: new DefaultSetting({ type: "boolean", defaultValue: true }),
				factionOCTimer: new DefaultSetting({ type: "boolean", defaultValue: false }),
				collapseAreas: new DefaultSetting({ type: "boolean", defaultValue: true }),
				settingsLink: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideGymHighlight: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideNewspaperHighlight: new DefaultSetting({ type: "boolean", defaultValue: false }),
				upkeepPropHighlight: new DefaultSetting({ type: "number", defaultValue: 0 }),
				barLinks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				pointsValue: new DefaultSetting({ type: "boolean", defaultValue: true }),
				npcLootTimes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				npcLootTimesService: new DefaultSetting({ type: "string", defaultValue: "tornstats" }),
				cooldownEndTimes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				companyAddictionLevel: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showJobPointsToolTip: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			popup: {
				dashboard: new DefaultSetting({ type: "boolean", defaultValue: true }),
				marketSearch: new DefaultSetting({ type: "boolean", defaultValue: true }),
				bazaarUsingExternal: new DefaultSetting({ type: "boolean", defaultValue: true }),
				calculator: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stocksOverview: new DefaultSetting({ type: "boolean", defaultValue: true }),
				notifications: new DefaultSetting({ type: "boolean", defaultValue: true }),
				defaultTab: new DefaultSetting({ type: "string", defaultValue: "dashboard" }),
				hoverBarTime: new DefaultSetting({ type: "boolean", defaultValue: false }),
				showStakeouts: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showIcons: new DefaultSetting({ type: "boolean", defaultValue: true }),
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
				energyWarning: new DefaultSetting({ type: "boolean", defaultValue: true }),
				medicalLife: new DefaultSetting({ type: "boolean", defaultValue: true }),
				openedSupplyPackValue: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideRecycleMessage: new DefaultSetting({ type: "boolean", defaultValue: false }),
				hideTooManyItemsWarning: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			crimes: {
				quickCrimes: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			companies: {
				idBesideCompanyName: new DefaultSetting({ type: "boolean", defaultValue: false }),
				specials: new DefaultSetting({ type: "boolean", defaultValue: true }),
				autoStockFill: new DefaultSetting({ type: "boolean", defaultValue: true }),
				employeeEffectiveness: new DefaultSetting({ type: "number", defaultValue: 18 }),
			},
			travel: {
				computer: new DefaultSetting({ type: "boolean", defaultValue: true }),
				table: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cleanFlight: new DefaultSetting({ type: "boolean", defaultValue: false }),
				travelProfits: new DefaultSetting({ type: "boolean", defaultValue: true }),
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				sortable: new DefaultSetting({ type: "boolean", defaultValue: true }),
				peopleFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				landingTime: new DefaultSetting({ type: "boolean", defaultValue: true }),
				flyingTime: new DefaultSetting({ type: "boolean", defaultValue: true }),
				itemFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				energyWarning: new DefaultSetting({ type: "boolean", defaultValue: true }),
				cooldownWarnings: new DefaultSetting({ type: "boolean", defaultValue: true }),
				autoTravelTableCountry: new DefaultSetting({ type: "boolean", defaultValue: false }),
				autoFillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				efficientRehab: new DefaultSetting({ type: "boolean", defaultValue: true }),
				efficientRehabSelect: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			stocks: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				acronyms: new DefaultSetting({ type: "boolean", defaultValue: true }),
				valueAndProfit: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			competitions: {
				easterEggs: new DefaultSetting({ type: "boolean", defaultValue: false }),
				easterEggsAlert: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			events: {
				worth: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			hospital: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			auction: {
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
				menu: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hidePosts: new DefaultSetting({ type: "object", defaultValue: {} }),
				hideThreads: new DefaultSetting({ type: "object", defaultValue: {} }),
				highlightPosts: new DefaultSetting({ type: "object", defaultValue: {} }),
				highlightThreads: new DefaultSetting({ type: "object", defaultValue: {} }),
				ignoredThreads: new DefaultSetting({ type: "object", defaultValue: {} }),
				debugInfoBtn: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			bazaar: {
				itemsCost: new DefaultSetting({ type: "boolean", defaultValue: true }),
				worth: new DefaultSetting({ type: "boolean", defaultValue: true }),
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
				maxBuyIgnoreCash: new DefaultSetting({ type: "boolean", defaultValue: false }),
				highlightSubVendorItems: new DefaultSetting({ type: "boolean", defaultValue: false }),
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
				profit: new DefaultSetting({ type: "boolean", defaultValue: true }),
				filters: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			casino: {
				netTotal: new DefaultSetting({ type: "boolean", defaultValue: true }),
				blackjack: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlow: new DefaultSetting({ type: "boolean", defaultValue: false }),
				highlowMovement: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			racing: {
				winPercentage: new DefaultSetting({ type: "boolean", defaultValue: true }),
				upgrades: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			faction: {
				idBesideFactionName: new DefaultSetting({ type: "boolean", defaultValue: false }),
				csvRaidReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				csvRankedWarReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				csvWarReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				csvChainReport: new DefaultSetting({ type: "boolean", defaultValue: true }),
				csvChallengeContributions: new DefaultSetting({ type: "boolean", defaultValue: true }),
				openOc: new DefaultSetting({ type: "boolean", defaultValue: true }),
				highlightOwn: new DefaultSetting({ type: "boolean", defaultValue: true }),
				availablePlayers: new DefaultSetting({ type: "boolean", defaultValue: true }),
				recommendedNnb: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ocNnb: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ocTimes: new DefaultSetting({ type: "boolean", defaultValue: true }),
				ocLastAction: new DefaultSetting({ type: "boolean", defaultValue: true }),
				banker: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showFullInfobox: new DefaultSetting({ type: "boolean", defaultValue: true }),
				foldableInfobox: new DefaultSetting({ type: "boolean", defaultValue: true }),
				numberMembers: new DefaultSetting({ type: "boolean", defaultValue: true }),
				warFinishTimes: new DefaultSetting({ type: "boolean", defaultValue: false }),
				memberFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				armoryFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				armoryWorth: new DefaultSetting({ type: "boolean", defaultValue: true }),
				upgradeRequiredRespect: new DefaultSetting({ type: "boolean", defaultValue: true }),
				memberInfo: new DefaultSetting({ type: "boolean", defaultValue: false }),
				rankedWarFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				quickItems: new DefaultSetting({ type: "boolean", defaultValue: true }),
				stakeout: new DefaultSetting({ type: "boolean", defaultValue: true }),
				showFactionSpy: new DefaultSetting({ type: "boolean", defaultValue: true }),
				oc2Filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
				warnCrime: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			property: {
				value: new DefaultSetting({ type: "boolean", defaultValue: true }),
				happy: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			gym: {
				specialist: new DefaultSetting({ type: "boolean", defaultValue: true }),
				disableStats: new DefaultSetting({ type: "boolean", defaultValue: true }),
				graph: new DefaultSetting({ type: "boolean", defaultValue: true }),
				steadfast: new DefaultSetting({ type: "boolean", defaultValue: true }),
				progress: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			missions: {
				hints: new DefaultSetting({ type: "boolean", defaultValue: true }),
				rewards: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			attack: {
				bonusInformation: new DefaultSetting({ type: "boolean", defaultValue: true }),
				timeoutWarning: new DefaultSetting({ type: "boolean", defaultValue: true }),
				fairAttack: new DefaultSetting({ type: "boolean", defaultValue: true }),
				weaponExperience: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hideAttackButtons: new DefaultSetting({ type: "array", defaultValue: [] }),
			},
			city: {
				items: new DefaultSetting({ type: "boolean", defaultValue: true }),
				combineDuplicates: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			joblist: {
				specials: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			bounties: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			userlist: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			itemmarket: {
				highlightCheapItems: new DefaultSetting({ type: "number|empty", defaultValue: "" }),
				leftBar: new DefaultSetting({ type: "boolean", defaultValue: false }),
				fillMax: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			competition: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			museum: {
				autoFill: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			enemies: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			friends: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			targets: {
				filter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			crimes2: {
				burglaryFilter: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		scripts: {
			noConfirm: {
				itemEquip: new DefaultSetting({ type: "boolean", defaultValue: true }),
				tradeAccept: new DefaultSetting({ type: "boolean", defaultValue: false }),
				pointsMarketRemove: new DefaultSetting({ type: "boolean", defaultValue: false }),
				pointsMarketBuy: new DefaultSetting({ type: "boolean", defaultValue: false }),
				abroadItemBuy: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			achievements: {
				show: new DefaultSetting({ type: "boolean", defaultValue: true }),
				completed: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			lastAction: {
				factionMember: new DefaultSetting({ type: "boolean", defaultValue: false }),
				companyOwn: new DefaultSetting({ type: "boolean", defaultValue: false }),
				companyOther: new DefaultSetting({ type: "boolean", defaultValue: false }),
			},
			statsEstimate: {
				global: new DefaultSetting({ type: "boolean", defaultValue: true }),
				delay: new DefaultSetting({ type: "number", defaultValue: 1500 }),
				cachedOnly: new DefaultSetting({ type: "boolean", defaultValue: true }),
				displayNoResult: new DefaultSetting({ type: "boolean", defaultValue: false }),
				maxLevel: new DefaultSetting({ type: "number", defaultValue: 100 }),
				profiles: new DefaultSetting({ type: "boolean", defaultValue: true }),
				enemies: new DefaultSetting({ type: "boolean", defaultValue: true }),
				hof: new DefaultSetting({ type: "boolean", defaultValue: true }),
				attacks: new DefaultSetting({ type: "boolean", defaultValue: true }),
				userlist: new DefaultSetting({ type: "boolean", defaultValue: true }),
				bounties: new DefaultSetting({ type: "boolean", defaultValue: true }),
				factions: new DefaultSetting({ type: "boolean", defaultValue: true }),
				wars: new DefaultSetting({ type: "boolean", defaultValue: true }),
				abroad: new DefaultSetting({ type: "boolean", defaultValue: true }),
				competition: new DefaultSetting({ type: "boolean", defaultValue: true }),
				rankedWars: new DefaultSetting({ type: "boolean", defaultValue: true }),
				targets: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
			ffScouter: {
				miniProfile: new DefaultSetting({ type: "boolean", defaultValue: true }),
				profile: new DefaultSetting({ type: "boolean", defaultValue: true }),
				attack: new DefaultSetting({ type: "boolean", defaultValue: true }),
				factionList: new DefaultSetting({ type: "boolean", defaultValue: true }),
				gauge: new DefaultSetting({ type: "boolean", defaultValue: true }),
			},
		},
		external: {
			tornstats: new DefaultSetting({ type: "boolean", defaultValue: false }),
			yata: new DefaultSetting({ type: "boolean", defaultValue: false }),
			prometheus: new DefaultSetting({ type: "boolean", defaultValue: false }),
			lzpt: new DefaultSetting({ type: "boolean", defaultValue: false }),
			tornw3b: new DefaultSetting({ type: "boolean", defaultValue: false }),
			ffScouter: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
	},
	filters: {
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
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			faction: new DefaultSetting({ type: "string", defaultValue: "All" }),
			timeStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			timeEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 1 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			scoreStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			scoreEnd: new DefaultSetting({ type: "number", defaultValue: 5000 }),
		},
		containers: new DefaultSetting({ type: "object", defaultValue: {} }),
		travel: {
			open: new DefaultSetting({ type: "boolean", defaultValue: false }),
			type: new DefaultSetting({ type: "string", defaultValue: "basic" }),
			categories: new DefaultSetting({ type: "array", defaultValue: [] }),
			countries: new DefaultSetting({ type: "array", defaultValue: [] }),
			hideOutOfStock: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		abroadPeople: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			status: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			faction: new DefaultSetting({ type: "string", defaultValue: "" }),
			special: {
				newPlayer: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inCompany: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inFaction: new DefaultSetting({ type: "string", defaultValue: "both" }),
				isDonator: new DefaultSetting({ type: "string", defaultValue: "both" }),
				hasBounties: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		abroadItems: {
			categories: new DefaultSetting({ type: "array", defaultValue: [] }),
			profitOnly: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		trade: {
			hideValues: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		gym: {
			specialist1: new DefaultSetting({ type: "string", defaultValue: "none" }),
			specialist2: new DefaultSetting({ type: "string", defaultValue: "none" }),
			strength: new DefaultSetting({ type: "boolean", defaultValue: false }),
			speed: new DefaultSetting({ type: "boolean", defaultValue: false }),
			defense: new DefaultSetting({ type: "boolean", defaultValue: false }),
			dexterity: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		city: {
			highlightItems: new DefaultSetting({ type: "boolean", defaultValue: true }),
		},
		bounties: {
			maxLevel: new DefaultSetting({ type: "number", defaultValue: 100 }),
			hideUnavailable: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		userlist: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			special: {
				fedded: new DefaultSetting({ type: "string", defaultValue: "both" }),
				fallen: new DefaultSetting({ type: "string", defaultValue: "both" }),
				traveling: new DefaultSetting({ type: "string", defaultValue: "both" }),
				newPlayer: new DefaultSetting({ type: "string", defaultValue: "both" }),
				onWall: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inCompany: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inFaction: new DefaultSetting({ type: "string", defaultValue: "both" }),
				isDonator: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inHospital: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inJail: new DefaultSetting({ type: "string", defaultValue: "both" }),
				earlyDischarge: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
			hospReason: {
				attackedBy: new DefaultSetting({ type: "string", defaultValue: "both" }),
				muggedBy: new DefaultSetting({ type: "string", defaultValue: "both" }),
				hospitalizedBy: new DefaultSetting({ type: "string", defaultValue: "both" }),
				other: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		closedScopes: new DefaultSetting({ type: "array", defaultValue: [] }),
		stocks: {
			name: new DefaultSetting({ type: "string", defaultValue: "" }),
			investment: {
				owned: new DefaultSetting({ type: "string", defaultValue: "both" }),
				benefit: new DefaultSetting({ type: "string", defaultValue: "both" }),
				passive: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
			price: {
				price: new DefaultSetting({ type: "string", defaultValue: "both" }),
				profit: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
		},
		faction: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 1 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			lastActionStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			lastActionEnd: new DefaultSetting({ type: "number", defaultValue: -1 }),
			status: new DefaultSetting({ type: "array", defaultValue: [] }),
			position: new DefaultSetting({ type: "string", defaultValue: "" }),
			special: {
				fedded: new DefaultSetting({ type: "string", defaultValue: "both" }),
				fallen: new DefaultSetting({ type: "string", defaultValue: "both" }),
				newPlayer: new DefaultSetting({ type: "string", defaultValue: "both" }),
				inCompany: new DefaultSetting({ type: "string", defaultValue: "both" }),
				isDonator: new DefaultSetting({ type: "string", defaultValue: "both" }),
				isRecruit: new DefaultSetting({ type: "string", defaultValue: "both" }),
			},
		},
		factionArmory: {
			hideUnavailable: new DefaultSetting({ type: "boolean", defaultValue: false }),
			weapons: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
				category: new DefaultSetting({ type: "string", defaultValue: "" }),
				rarity: new DefaultSetting({ type: "string", defaultValue: "" }),
				weaponType: new DefaultSetting({ type: "string", defaultValue: "" }),
				damage: new DefaultSetting({ type: "string", defaultValue: "" }),
				accuracy: new DefaultSetting({ type: "string", defaultValue: "" }),
				weaponBonus: new DefaultSetting({ type: "array", defaultValue: [] }),
			},
			armor: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
				rarity: new DefaultSetting({ type: "string", defaultValue: "" }),
				defence: new DefaultSetting({ type: "string", defaultValue: "" }),
				set: new DefaultSetting({ type: "string", defaultValue: "" }),
			},
			temporary: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
			},
		},
		factionRankedWar: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			status: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 1 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		profile: {
			relative: new DefaultSetting({ type: "boolean", defaultValue: false }),
			stats: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		competition: {
			levelStart: new DefaultSetting({ type: "number", defaultValue: 1 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		shops: {
			hideLoss: new DefaultSetting({ type: "boolean", defaultValue: false }),
			hideUnder100: new DefaultSetting({ type: "boolean", defaultValue: false }),
		},
		auction: {
			weapons: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
				category: new DefaultSetting({ type: "string", defaultValue: "" }),
				rarity: new DefaultSetting({ type: "string", defaultValue: "" }),
				weaponType: new DefaultSetting({ type: "string", defaultValue: "" }),
				damage: new DefaultSetting({ type: "string", defaultValue: "" }),
				accuracy: new DefaultSetting({ type: "string", defaultValue: "" }),
				weaponBonus: new DefaultSetting({ type: "array", defaultValue: [] }),
			},
			armor: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
				rarity: new DefaultSetting({ type: "string", defaultValue: "" }),
				defence: new DefaultSetting({ type: "string", defaultValue: "" }),
				set: new DefaultSetting({ type: "string", defaultValue: "" }),
			},
			items: {
				name: new DefaultSetting({ type: "string", defaultValue: "" }),
				category: new DefaultSetting({ type: "string", defaultValue: "" }),
				rarity: new DefaultSetting({ type: "string", defaultValue: "" }),
			},
		},
		enemies: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		friends: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
		},
		targets: {
			activity: new DefaultSetting({ type: "array", defaultValue: [] }),
			levelStart: new DefaultSetting({ type: "number", defaultValue: 0 }),
			levelEnd: new DefaultSetting({ type: "number", defaultValue: 100 }),
			estimates: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		burglary: {
			targetName: new DefaultSetting({ type: "string", defaultValue: "" }),
			targetType: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		oc2: {
			difficulty: new DefaultSetting({ type: "array", defaultValue: [] }),
			status: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
	},
	userdata: new DefaultSetting({ type: "object", defaultValue: {} }),
	torndata: new DefaultSetting({ type: "object", defaultValue: {} }),
	stockdata: new DefaultSetting({ type: "object", defaultValue: {} }),
	factiondata: new DefaultSetting({ type: "object", defaultValue: {} }),
	localdata: {
		tradeMessage: new DefaultSetting({ type: "number", defaultValue: 0 }),
		popup: {
			calculatorItems: new DefaultSetting({ type: "array", defaultValue: [] }),
		},
		vault: {
			initialized: new DefaultSetting({ type: "boolean", defaultValue: false }),
			lastTransaction: new DefaultSetting({ type: "string", defaultValue: "" }),
			total: new DefaultSetting({ type: "number", defaultValue: 0 }),
			user: {
				initial: new DefaultSetting({ type: "number", defaultValue: 0 }),
				current: new DefaultSetting({ type: "number", defaultValue: 0 }),
			},
			partner: {
				initial: new DefaultSetting({ type: "number", defaultValue: 0 }),
				current: new DefaultSetting({ type: "number", defaultValue: 0 }),
			},
		},
	},
	stakeouts: new DefaultSetting({ type: "object", defaultValue: { order: [] } }),
	factionStakeouts: new DefaultSetting({ type: "object", defaultValue: {} }),
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
		factionItems: new DefaultSetting({ type: "array", defaultValue: [] }),
		crimes: new DefaultSetting({ type: "array", defaultValue: [] }),
		jail: new DefaultSetting({ type: "array", defaultValue: [] }),
	},
	cache: new DefaultSetting({ type: "object", defaultValue: {} }),
	usage: new DefaultSetting({ type: "object", defaultValue: {} }),
	npcs: new DefaultSetting({ type: "object", defaultValue: {} }),
	notificationHistory: new DefaultSetting({ type: "array", defaultValue: [] }),
	notifications: new DefaultSetting({
		type: "object",
		defaultValue: {
			events: {},
			messages: {},
			newDay: {},
			energy: {},
			happy: {},
			nerve: {},
			life: {},
			travel: {},
			drugs: {},
			boosters: {},
			medical: {},
			hospital: {},
			chain: {},
			chainCount: {},
			stakeouts: {},
			npcs: {},
		},
	}),
};

const CUSTOM_LINKS_PRESET = {
	"Bazaar : Management": { link: "https://www.torn.com/bazaar.php#/manage" },
	"Faction : Armory": { link: "https://www.torn.com/factions.php?step=your#/tab=armoury" },
	"Faction : Organized Crimes": { link: "https://www.torn.com/factions.php?step=your#/tab=crimes" },
	"Item Market": { link: "https://www.torn.com/page.php?sid=ItemMarket" },
	Museum: { link: "https://www.torn.com/museum.php" },
	Pharmacy: { link: "https://www.torn.com/shops.php?step=pharmacy" },
	"Points Market": { link: "https://www.torn.com/pmarket.php" },
	Raceway: { link: "https://www.torn.com/page.php?sid=racing" },
	"Travel Agency": { link: "https://www.torn.com/page.php?sid=travel" },
	"Christmas Town : Maps": { link: "https://www.torn.com/christmas_town.php#/mymaps" },
};

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => userdata.profile.name || "", description: "Your player name." }];

const API_USAGE = {
	user: {
		ammo: {
			"*": {
				size: true,
				type: true,
				quantity: true,
			},
		},
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
		organizedCrime: {
			created_at: false,
			difficulty: true,
			executed_at: false,
			expired_at: false,
			id: false,
			initiated_at: false,
			name: true,
			planning_at: false,
			ready_at: true,
			rewards: false,
			slots: true,
			status: false,
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
			attackslost: true,
			defendslost: true,
			elo: true,
			theyrunaway: true,
			attackmisses: true,
			specialammoused: true,
			hollowammoused: true,
			tracerammoused: true,
			piercingammoused: true,
			incendiaryammoused: true,
			retals: true,
			moneymugged: true,
			itemslooted: true,
			highestbeaten: true,
			territoryjoins: true,
			territorytime: true,
			trainsreceived: true,
			itemsbought: true,
			auctionsells: true,
			itemssent: true,
			cityitemsbought: true,
			pointsbought: true,
			jailed: true,
			failedbusts: true,
			peopleboughtspent: true,
			hospital: true,
			reviveskill: true,
			revivesreceived: true,
			mailssent: true,
			friendmailssent: true,
			factionmailssent: true,
			companymailssent: true,
			spousemailssent: true,
			classifiedadsplaced: true,
			personalsplaced: true,
			bountiesplaced: true,
			totalbountyspent: true,
			bountiesreceived: true,
			receivedbountyvalue: true,
			booksread: true,
			boostersused: true,
			consumablesused: true,
			statenhancersused: true,
			defendslostabroad: true,
			drugsused: true,
			overdosed: true,
			rehabs: true,
			rehabcost: true,
			cantaken: true,
			missionscompleted: true,
			dukecontractscompleted: true,
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
			awards: true,
			pointssold: true,
			useractivity: true,
			activestreak: true,
			bestactivestreak: true,
			bazaarcustomers: true,
			stockpayouts: true,
			daysbeendonator: true,
			refills: true,
			nerverefills: true,
			tokenrefills: true,
			meritsbought: true,
			bountiescollected: true,
			totalbountyreward: true,
			cityfinds: true,
			dumpfinds: true,
			organisedcrimes: true,
			respectforfaction: true,
			revives: true,
			exttaken: true,
			kettaken: true,
			lsdtaken: true,
			opitaken: true,
			shrtaken: true,
			spetaken: true,
			pcptaken: true,
			xantaken: true,
			victaken: true,
			virusescoded: true,
			bloodwithdrawn: true,
			itemsdumped: true,
			alcoholused: true,
			candyused: true,
			medicalitemsused: true,
			energydrinkused: true,
			peoplebusted: true,
			peoplebought: true,
			attackswon: true,
			defendswon: true,
			attacksassisted: true,
			arrestsmade: true,
			dumpsearches: true,
			attacksstealthed: true,
			defendsstalemated: true,
			attacksdraw: true,
			yourunaway: true,
			unarmoredwon: true,
			killstreak: true,
			bestkillstreak: true,
			attackhits: true,
			attackcriticalhits: true,
			bestdamage: true,
			onehitkills: true,
			roundsfired: true,
			axehits: true,
			pishits: true,
			rifhits: true,
			shohits: true,
			piehits: true,
			slahits: true,
			heahits: true,
			smghits: true,
			machits: true,
			h2hhits: true,
			chahits: true,
			grehits: true,
			largestmug: true,
			missioncreditsearned: true,
			contractscompleted: true,
			raceswon: true,
			racesentered: true,
			racingskill: true,
			racingpointsearned: true,
			argtravel: true,
			cantravel: true,
			caytravel: true,
			chitravel: true,
			dubtravel: true,
			hawtravel: true,
			japtravel: true,
			lontravel: true,
			mextravel: true,
			soutravel: true,
			switravel: true,
			traveltimes: true,
			traveltime: true,
			itemsboughtabroad: true,
			attackdamage: true,
			auctionswon: true,
			attackswonabroad: true,
			jobpointsused: true,
			stockprofits: true,
			stocklosses: true,
		},
		age: true,
		level: true,
		hunting: true,
		married: {
			duration: true,
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
		book_perks: true,
		faction_perks: true,
		education_perks: true,
		merit_perks: true,
		property_perks: true,
		stock_perks: true,
		book_perk: true,
		faction: {
			position: true,
			faction_id: true,
			faction_tag: true,
			days_in_faction: true,
		},
		timestamp: true,
		city_bank: {
			time_left: true,
		},
		icons: {
			icon85: true,
			icon86: true,
		},
		honors_awarded: true,
		merits_awarded: true,
		strength: true,
		speed: true,
		defense: true,
		dexterity: true,
		total: true,
		manual_labor: true,
		intelligence: true,
		endurance: true,
		criminalrecord: {
			selling_illegal_products: true,
			theft: true,
			drug_deals: true,
			computer_crimes: true,
			murder: true,
			auto_theft: true,
			fraud_crimes: true,
			other: true,
			total: true,
		},
		job: {
			position: true,
			company_id: true,
			company_type: true,
		},
		jobpoints: {
			jobs: {
				"*": true,
			},
			companies: {
				"*": {
					jobpoints: true,
				},
			},
		},
		weaponexp: {
			"*": {
				name: true,
				exp: true,
			},
		},
		properties: {
			"*": {
				happy: true,
			},
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
		members: {
			"*": {
				last_action: {
					relative: true,
				},
			},
		},
		positions: {
			"*": {
				canAccessFactionApi: true,
			},
		},
	},
	company: {
		company: {
			employees: {
				"*": {
					last_action: {
						relative: true,
					},
				},
			},
		},
		company_employees: {
			"*": {
				effectiveness: {
					addiction: true,
				},
			},
		},
	},
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
		medals: {
			"*": {
				description: true,
			},
		},
		honors: {
			"*": {
				description: true,
			},
		},
		stats: {
			points_averagecost: true,
		},
	},
};

const API_SELECTIONS = {
	user: [
		"ammo",
		"attacks",
		"bars",
		"battlestats",
		"bazaar", // target
		"cooldowns",
		"crimes",
		"display", // target
		"education",
		"icons",
		"inventory",
		"merits",
		"money",
		"networth",
		"newevents",
		"newmessages",
		"perks",
		"personalstats",
		"profile",
		"refills",
		"stocks",
		"timestamp",
		"travel",
		"weaponexp",
		"workstats",
		"properties",
	],
	properties: [],
	faction: [
		"basic", // target
		"crimes",
		"positions",
	],
	company: [
		"profile", // target
		"employees",
	],
	item_market: ["bazaar", "itemmarket"],
	torn: ["bank", "education", "honors", "items", "medals", "pawnshop", "properties", "stocks", "stats"],
};

const CHAT_TITLE_COLORS = {
	blue: ["rgb(10,60,173)", "rgb(22,109,236)"],
	brown: ["rgb(109,53,4)", "rgb(146,69,4)"],
	orange: ["rgb(227,130,5)", "rgb(234,164,50)"],
	purple: ["rgb(94,7,119)", "rgb(184,9,241)"],
	red: ["rgb(123,4,4)", "rgb(255,3,3)"],
};

const BOOK_DESCRIPTIONS = {
	744: "Incr. Str by 5% up to 10m upon completion.",
	745: "Incr. Spd by 5% up to 10m upon completion.",
	746: "Incr. Def by 5% up to 10m upon completion.",
	747: "Incr. Dex by 5% up to 10m upon completion.",
	748: "Incr. all working stats by 5% up to 2.5k each upon completion.",
	749: "Incr. friends, enemies and targets lists by 100 upon completion.",
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

const RANK_TRIGGERS = {
	level: [2, 6, 11, 26, 31, 50, 71, 100],
	crimes: [100, 5000, 10000, 20000, 30000, 50000],
	networth: [5000000, 50000000, 500000000, 5000000000, 50000000000],

	stats: ["under 2k", "2k - 25k", "20k - 250k", "200k - 2.5m", "2m - 25m", "20m - 250m", "over 200m"],
};

const HOSPITALIZATION_REASONS = {
	attackedBy: "Attacked by",
	muggedBy: "Mugged by",
	hospitalizedBy: "Hospitalized by",
	other: ["Attacked by", "Mugged by", "Hospitalized by"],
};
