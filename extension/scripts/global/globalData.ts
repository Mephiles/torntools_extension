// @ts-expect-error Some weird stuff here to make sure chrome is defined.
chrome = typeof browser !== "undefined" ? browser : chrome;

const FORUM_POST = "https://www.torn.com/forums.php#/p=threads&f=67&t=16243863";

class TornToolsStorage {
	get(): Promise<any>;
	get(key: string): Promise<any>;
	get(key: string[]): Promise<any[]>;
	get(key?: string | string[]) {
		return new Promise(async (resolve) => {
			if (Array.isArray(key)) {
				const data = await chrome.storage.local.get(key);

				resolve(key.map((i) => data[i]));
			} else if (key) {
				const data = await chrome.storage.local.get([key]);

				resolve(data[key]);
			} else {
				const data = await chrome.storage.local.get(null);

				resolve(data);
			}
		});
	}

	set(object: { [key: string]: any }) {
		return chrome.storage.local.set(object);
	}

	remove(key: string | string[]) {
		if (!key) return Promise.reject("No key provided");

		return chrome.storage.local.remove(Array.isArray(key) ? key : [key]);
	}

	clear() {
		return chrome.storage.local.clear();
	}

	change(object: RecursivePartial<Writable<Database>>): Promise<void> {
		return new Promise(async (resolve) => {
			for (const key of Object.keys(object)) {
				const data = this.recursive(await this.get(key), object[key]);

				await this.set({ [key]: data });
			}
			resolve();
		});
	}

	private recursive(parent: any, toChange: any) {
		for (const key in toChange) {
			if (
				parent &&
				typeof parent === "object" &&
				!Array.isArray(parent[key]) &&
				key in parent &&
				typeof toChange[key] === "object" &&
				!Array.isArray(toChange[key])
			) {
				parent[key] = this.recursive(parent[key], toChange[key]);
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

	reset(): Promise<void>;
	reset(key: "attackHistory" | "stakeouts"): Promise<void>;
	reset(key?: "attackHistory" | "stakeouts"): Promise<void> {
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

			function getDefaultStorage(defaultStorage: { [key: string]: any }) {
				const newStorage: { [key: string]: any } = {};

				for (const key in defaultStorage) {
					newStorage[key] = {};

					if (typeof defaultStorage[key] === "object") {
						const setting = defaultStorage[key];
						if (setting instanceof DefaultSetting && "defaultValue" in setting) {
							switch (typeof setting.defaultValue) {
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
		let size: number;

		if (chrome.storage.local.getBytesInUse) size = await chrome.storage.local.getBytesInUse();
		else size = JSON.stringify(await this.get(null)).length;

		return size;
	}
}

const ttStorage = new TornToolsStorage();

type DatabaseCache = { [key: string]: any };

type CacheKey = string | number;

class TornToolsCache {
	private _cache: DatabaseCache;

	constructor() {
		this.cache = {};
	}

	set cache(value) {
		this._cache = value || {};
	}

	get cache() {
		return this._cache;
	}

	get<T = any>(section: string, key?: CacheKey): T | undefined {
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return this.hasValue(section, key) ? this.cache[section][key].value : undefined;
		else return this.hasValue(key.toString()) ? this.cache[key].value : undefined;
	}

	async remove(section: string, key?: CacheKey) {
		if (!key) {
			key = section;
			section = null;
		}

		if ((section && !this.hasValue(section, key)) || (!section && !this.hasValue(key.toString()))) {
			// Nothing to delete.
			return;
		}

		if (section) delete this.cache[section][key];
		else delete this.cache[key];

		await ttStorage.set({ cache: this.cache });
	}

	hasValue(section: string, key?: CacheKey) {
		if (!key) {
			key = section;
			section = null;
		}

		if (section) return section in this.cache && key in this.cache[section] && this.cache[section][key].timeout > Date.now();
		else return key in this.cache && this.cache[key].timeout > Date.now();
	}

	async set(object: DatabaseCache, ttl: number, section?: string) {
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

		function refreshObject(object: { [key: string]: any }) {
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
}

const ttCache = new TornToolsCache();

type DatabaseUsage = { [minute: number]: { [location: string]: number } };

class TornToolsUsage {
	usage: DatabaseUsage;

	constructor() {
		this.usage = {};
	}

	async add(location: string) {
		const minute = (Date.now() / TO_MILLIS.MINUTES).dropDecimals();
		if (!(minute in this.usage)) this.usage[minute] = {};
		if (!(location in this.usage[minute])) this.usage[minute][location] = 0;

		this.usage[minute][location] += 1;
		await ttStorage.set({ usage: this.usage });
	}

	async refresh() {
		const last24HrsMinute = ((Date.now() - 24 * TO_MILLIS.HOURS) / TO_MILLIS.MINUTES).dropDecimals();

		Object.keys(this.usage).forEach((minute) => {
			if (parseInt(minute) < last24HrsMinute) delete this.usage[minute];
		});

		await ttStorage.set({ usage: this.usage });
	}

	async clear() {
		this.usage = {};
		await ttStorage.set({ usage: {} });
	}
}

const ttUsage = new TornToolsUsage();

type InternalPageTheme = "default" | "dark" | "light";

type StoredNpcs = {
	next_update: number;
	service: string;
	targets: {
		[id: string]: StoredNpc;
	};
	planned?: number | false;
	reason?: string;
};

interface StoredNpc {
	name: string;
	levels: {
		1: number;
		2: number;
		3: number;
		4: number;
		5: number;
	};
	current?: number;
	scheduled?: boolean;
	order?: number;
}

type StoredUserdata = FetchedUserdata & {
	date: number;
	dateBasic: number;
	userCrime?: number;
};

interface StoredFactionStakeouts {
	date: number;
	[id: string]:
		| {
				alerts: {
					chainReaches: number | false;
					memberCountDrops: number | false;
					rankedWarStarts: boolean;
					inRaid: boolean;
					inTerritoryWar: boolean;
				};
				info: {
					name: string;
					chain: number;
					members: {
						current: number;
						maximum: number;
					};
					rankedWar: boolean;
					raid: boolean;
					territoryWar: boolean;
				};
		  }
		| number;
}

type StoredStockNotifications = { [id: string]: { priceFalls: number; priceReaches: number } };

type StoredFactiondataNoAccess = { access: "none"; error?: any; retry?: number };
type StoredFactiondataBasic = { access: "basic"; retry?: number; date: number };
type StoredFactiondataFullAccess = { access: "full_access"; date: number; userCrime: number } & FetchedFactiondataWithAccess;
type StoredFactiondata = StoredFactiondataNoAccess | StoredFactiondataBasic | StoredFactiondataFullAccess;

type StoredTorndata = FetchedTorndata & { date: number };

// type StoredStockdata = FetchedStockdata["stocks"] & { date: number };
type StoredStockdata = { [name: string]: TornV1Stock | number; date: number };
type StakeoutData = {
	info: {
		name: string;
		last_action: {
			status: UserLastActionStatusEnum;
			relative: string;
			timestamp: number;
		};
		life: {
			current: number;
			maximum: number;
		};
		status: {
			state: UserStatusStateEnum | string;
			color: string;
			until: number | null;
			description: string;
		};
		isRevivable: boolean;
	} | null;
	alerts: {
		okay: boolean;
		hospital: boolean;
		landing: boolean;
		online: boolean;
		life: number | false;
		offline: number | false;
		revivable: boolean;
	};
};
type StoredStakeouts = {
	[name: string]: StakeoutData | any[] | number;
	order: string[];
	date: number;
};

type QuickItem = { id: number; xid?: number };
type QuickFactionItem = { id: number | "points-energy" | "points-nerve" };
type QuickCrime = {
	step: string;
	nerve: number;
	name: string;
	icon: string;
	text: string;
};
type QuickJail = "bust" | "bail";

type NotificationMap = { [key: string]: TTNotification };
type StoredProfileNotes = { [id: number]: { height: string; text: string } };
type AttackHistory = {
	name: string;
	defend: number;
	defend_lost: number;
	lose: number;
	stalemate: number;
	win: number;
	stealth: number;
	mug: number;
	hospitalise: number;
	leave: number;
	arrest: number;
	assist: number;
	special: number;
	escapes: number;
	respect: number[];
	respect_base: number[];
	lastAttack: number;
	lastAttackCode: string;
	latestFairFightModifier?: number;
};
type AttackHistoryMap = {
	[id: number]: AttackHistory;
};

interface WeaponBonusFilter {
	bonus: string;
	value: number;
}

const DEFAULT_STORAGE = {
	version: {
		current: new DefaultSetting<string>("string", () => chrome.runtime.getManifest().version),
		oldVersion: new DefaultSetting<string | null>("string"),
		showNotice: new DefaultSetting("boolean", true),
	},
	api: {
		torn: {
			key: new DefaultSetting<string | null>("string"),
			online: new DefaultSetting("boolean", true),
			error: new DefaultSetting<string | null>("string"),
		},
		tornstats: {
			key: new DefaultSetting<string | null>("string"),
		},
		yata: {
			key: new DefaultSetting<string | null>("string"),
		},
		ffScouter: {
			key: new DefaultSetting<string | null>("string"),
		},
	},
	settings: {
		updateNotice: new DefaultSetting("boolean", true),
		featureDisplay: new DefaultSetting("boolean", true),
		featureDisplayPosition: new DefaultSetting("string", "bottom-left"),
		featureDisplayOnlyFailed: new DefaultSetting("boolean", false),
		featureDisplayHideDisabled: new DefaultSetting("boolean", false),
		featureDisplayHideEmpty: new DefaultSetting("boolean", true),
		developer: new DefaultSetting("boolean", false),
		formatting: {
			tct: new DefaultSetting("boolean", false),
			date: new DefaultSetting("string", "eu"),
			time: new DefaultSetting("string", "eu"),
		},
		sorting: {
			abroad: {
				column: new DefaultSetting("string", ""),
				order: new DefaultSetting<"none" | "asc" | "desc">("string", "none"),
			},
		},
		notifications: {
			sound: new DefaultSetting("string", "default"),
			soundCustom: new DefaultSetting("string", ""),
			tts: new DefaultSetting("boolean", false),
			link: new DefaultSetting("boolean", true),
			volume: new DefaultSetting("number", 100),
			requireInteraction: new DefaultSetting("boolean", false),
			types: {
				global: new DefaultSetting("boolean", () => Notification.permission === "granted"),
				events: new DefaultSetting("boolean", true),
				messages: new DefaultSetting("boolean", true),
				status: new DefaultSetting("boolean", true),
				traveling: new DefaultSetting("boolean", true),
				cooldowns: new DefaultSetting("boolean", true),
				education: new DefaultSetting("boolean", true),
				newDay: new DefaultSetting("boolean", true),
				energy: new DefaultSetting("array", ["100%"]),
				nerve: new DefaultSetting("array", ["100%"]),
				happy: new DefaultSetting("array", ["100%"]),
				life: new DefaultSetting("array", ["100%"]),
				offline: new DefaultSetting<number[]>("array", []),
				chainTimerEnabled: new DefaultSetting("boolean", true),
				chainBonusEnabled: new DefaultSetting("boolean", true),
				leavingHospitalEnabled: new DefaultSetting("boolean", true),
				landingEnabled: new DefaultSetting("boolean", true),
				cooldownDrugEnabled: new DefaultSetting("boolean", true),
				cooldownBoosterEnabled: new DefaultSetting("boolean", true),
				cooldownMedicalEnabled: new DefaultSetting("boolean", true),
				chainTimer: new DefaultSetting<number[]>("array", []),
				chainBonus: new DefaultSetting<number[]>("array", []),
				leavingHospital: new DefaultSetting<number[]>("array", []),
				landing: new DefaultSetting<number[]>("array", []),
				cooldownDrug: new DefaultSetting<number[]>("array", []),
				cooldownBooster: new DefaultSetting<number[]>("array", []),
				cooldownMedical: new DefaultSetting<number[]>("array", []),
				stocks: new DefaultSetting<StoredStockNotifications>("object", {}),
				missionsLimitEnabled: new DefaultSetting("boolean", false),
				missionsLimit: new DefaultSetting("string", ""),
				missionsExpireEnabled: new DefaultSetting("boolean", false),
				missionsExpire: new DefaultSetting<number[]>("array", []),
				npcsGlobal: new DefaultSetting("boolean", true),
				npcs: new DefaultSetting<{ id: number; level: number | ""; minutes: number | "" }[]>("array", []),
				npcPlannedEnabled: new DefaultSetting("boolean", true),
				npcPlanned: new DefaultSetting<number[]>("array", []),
			},
		},
		apiUsage: {
			comment: new DefaultSetting("string", "TornTools"),
			delayEssential: new DefaultSetting("number", 30),
			delayBasic: new DefaultSetting("number", 120),
			delayStakeouts: new DefaultSetting("number", 30),
			user: {
				bars: new DefaultSetting("boolean", true),
				cooldowns: new DefaultSetting("boolean", true),
				travel: new DefaultSetting("boolean", true),
				newevents: new DefaultSetting("boolean", true),
				newmessages: new DefaultSetting("boolean", true),
				refills: new DefaultSetting("boolean", true),
				stocks: new DefaultSetting("boolean", true),
				education: new DefaultSetting("boolean", true),
				networth: new DefaultSetting("boolean", true),
				inventory: new DefaultSetting("boolean", true),
				jobpoints: new DefaultSetting("boolean", true),
				merits: new DefaultSetting("boolean", true),
				perks: new DefaultSetting("boolean", true),
				icons: new DefaultSetting("boolean", true),
				ammo: new DefaultSetting("boolean", true),
				battlestats: new DefaultSetting("boolean", true),
				crimes: new DefaultSetting("boolean", true),
				workstats: new DefaultSetting("boolean", true),
				skills: new DefaultSetting("boolean", true),
				weaponexp: new DefaultSetting("boolean", true),
				properties: new DefaultSetting("boolean", true),
				calendar: new DefaultSetting("boolean", true),
				organizedcrime: new DefaultSetting("boolean", true),
				missions: new DefaultSetting("boolean", true),
				personalstats: new DefaultSetting("boolean", true),
				attacks: new DefaultSetting("boolean", true),
				money: new DefaultSetting("boolean", true),
				honors: new DefaultSetting("boolean", true),
				medals: new DefaultSetting("boolean", true),
			},
		},
		themes: {
			pages: new DefaultSetting<InternalPageTheme>("string", "default"),
			containers: new DefaultSetting("string", "default"),
		},
		hideIcons: new DefaultSetting<string[]>("array", []),
		hideCasinoGames: new DefaultSetting<string[]>("array", []),
		hideStocks: new DefaultSetting<string[]>("array", []),
		alliedFactions: new DefaultSetting<(string | number)[]>("array", []),
		customLinks: new DefaultSetting<CustomLink[]>("array", []),
		employeeInactivityWarning: new DefaultSetting<InactivityDisplay[]>("array", []),
		factionInactivityWarning: new DefaultSetting<InactivityDisplay[]>("array", []),
		userAlias: new DefaultSetting<{ [alias: string]: { name: string; alias: string } }>("object", {}),
		csvDelimiter: new DefaultSetting("string", ";"),
		pages: {
			global: {
				alignLeft: new DefaultSetting("boolean", false),
				hideLevelUpgrade: new DefaultSetting("boolean", false),
				hideQuitButtons: new DefaultSetting("boolean", false),
				hideTutorials: new DefaultSetting("boolean", false),
				keepAttackHistory: new DefaultSetting("boolean", true),
				miniProfileLastAction: new DefaultSetting("boolean", true),
				reviveProvider: new DefaultSetting("string", ""),
				pageTitles: new DefaultSetting("boolean", true),
				stackingMode: new DefaultSetting("boolean", false),
			},
			profile: {
				avgpersonalstats: new DefaultSetting("boolean", false),
				statusIndicator: new DefaultSetting("boolean", true),
				idBesideProfileName: new DefaultSetting("boolean", true),
				notes: new DefaultSetting("boolean", true),
				showAllyWarning: new DefaultSetting("boolean", true),
				ageToWords: new DefaultSetting("boolean", true),
				disableAllyAttacks: new DefaultSetting("boolean", true),
				box: new DefaultSetting("boolean", true),
				boxStats: new DefaultSetting("boolean", true),
				boxSpy: new DefaultSetting("boolean", true),
				boxStakeout: new DefaultSetting("boolean", true),
				boxAttackHistory: new DefaultSetting("boolean", true),
				boxFetch: new DefaultSetting("boolean", true),
			},
			chat: {
				fontSize: new DefaultSetting("number", 12),
				searchChat: new DefaultSetting("boolean", true),
				blockZalgo: new DefaultSetting("boolean", true),
				completeUsernames: new DefaultSetting("boolean", true),
				highlights: new DefaultSetting("array", [{ name: "$player", color: "#7ca900" }]),
				titleHighlights: new DefaultSetting<ColoredChatOption[]>("array", []),
				tradeTimer: new DefaultSetting("boolean", true),
				hideChatButton: new DefaultSetting("boolean", true),
				hideChat: new DefaultSetting("boolean", false),
			},
			sidebar: {
				notes: new DefaultSetting("boolean", true),
				highlightEnergy: new DefaultSetting("boolean", true),
				highlightNerve: new DefaultSetting("boolean", false),
				ocTimer: new DefaultSetting("boolean", true),
				oc2Timer: new DefaultSetting("boolean", true),
				oc2TimerPosition: new DefaultSetting("boolean", false),
				oc2TimerLevel: new DefaultSetting("boolean", true),
				factionOCTimer: new DefaultSetting("boolean", false),
				collapseAreas: new DefaultSetting("boolean", true),
				settingsLink: new DefaultSetting("boolean", true),
				hideGymHighlight: new DefaultSetting("boolean", false),
				hideNewspaperHighlight: new DefaultSetting("boolean", false),
				upkeepPropHighlight: new DefaultSetting("number", 0),
				barLinks: new DefaultSetting("boolean", true),
				pointsValue: new DefaultSetting("boolean", true),
				npcLootTimes: new DefaultSetting("boolean", true),
				npcLootTimesService: new DefaultSetting("string", "tornstats"),
				cooldownEndTimes: new DefaultSetting("boolean", true),
				companyAddictionLevel: new DefaultSetting("boolean", true),
				showJobPointsToolTip: new DefaultSetting("boolean", true),
			},
			popup: {
				dashboard: new DefaultSetting("boolean", true),
				marketSearch: new DefaultSetting("boolean", true),
				bazaarUsingExternal: new DefaultSetting("boolean", true),
				calculator: new DefaultSetting("boolean", true),
				stocksOverview: new DefaultSetting("boolean", true),
				notifications: new DefaultSetting("boolean", true),
				defaultTab: new DefaultSetting("string", "dashboard"),
				hoverBarTime: new DefaultSetting("boolean", false),
				showStakeouts: new DefaultSetting("boolean", true),
				showIcons: new DefaultSetting("boolean", true),
			},
			icon: {
				global: new DefaultSetting("boolean", true),
				energy: new DefaultSetting("boolean", true),
				nerve: new DefaultSetting("boolean", true),
				happy: new DefaultSetting("boolean", true),
				life: new DefaultSetting("boolean", true),
				chain: new DefaultSetting("boolean", true),
				travel: new DefaultSetting("boolean", true),
			},
			education: {
				greyOut: new DefaultSetting("boolean", true),
				finishTime: new DefaultSetting("boolean", true),
			},
			jail: {
				filter: new DefaultSetting("boolean", true),
			},
			bank: {
				investmentInfo: new DefaultSetting("boolean", true),
				investmentDueTime: new DefaultSetting("boolean", true),
			},
			home: {
				networthDetails: new DefaultSetting("boolean", true),
				effectiveStats: new DefaultSetting("boolean", true),
			},
			items: {
				quickItems: new DefaultSetting("boolean", true),
				values: new DefaultSetting("boolean", true),
				drugDetails: new DefaultSetting("boolean", true),
				marketLinks: new DefaultSetting("boolean", false),
				highlightBloodBags: new DefaultSetting("string", "none"),
				missingFlowers: new DefaultSetting("boolean", false),
				missingPlushies: new DefaultSetting("boolean", false),
				bookEffects: new DefaultSetting("boolean", true),
				canGains: new DefaultSetting("boolean", true),
				nerveGains: new DefaultSetting("boolean", true),
				candyHappyGains: new DefaultSetting("boolean", true),
				energyWarning: new DefaultSetting("boolean", true),
				medicalLife: new DefaultSetting("boolean", true),
				openedSupplyPackValue: new DefaultSetting("boolean", true),
				hideRecycleMessage: new DefaultSetting("boolean", false),
				hideTooManyItemsWarning: new DefaultSetting("boolean", false),
			},
			crimes: {
				quickCrimes: new DefaultSetting("boolean", true),
			},
			companies: {
				idBesideCompanyName: new DefaultSetting("boolean", false),
				specials: new DefaultSetting("boolean", true),
				autoStockFill: new DefaultSetting("boolean", true),
				employeeEffectiveness: new DefaultSetting("number", 18),
			},
			travel: {
				computer: new DefaultSetting("boolean", true),
				table: new DefaultSetting("boolean", true),
				cleanFlight: new DefaultSetting("boolean", false),
				tabTitleTimer: new DefaultSetting("boolean", false),
				travelProfits: new DefaultSetting("boolean", true),
				fillMax: new DefaultSetting("boolean", true),
				peopleFilter: new DefaultSetting("boolean", true),
				landingTime: new DefaultSetting("boolean", true),
				flyingTime: new DefaultSetting("boolean", true),
				itemFilter: new DefaultSetting("boolean", true),
				energyWarning: new DefaultSetting("boolean", true),
				cooldownWarnings: new DefaultSetting("boolean", true),
				autoTravelTableCountry: new DefaultSetting("boolean", false),
				autoFillMax: new DefaultSetting("boolean", true),
				efficientRehab: new DefaultSetting("boolean", true),
				efficientRehabSelect: new DefaultSetting("boolean", false),
			},
			stocks: {
				filter: new DefaultSetting("boolean", true),
				acronyms: new DefaultSetting("boolean", true),
				valueAndProfit: new DefaultSetting("boolean", true),
			},
			competitions: {
				easterEggs: new DefaultSetting("boolean", false),
				easterEggsAlert: new DefaultSetting("boolean", true),
			},
			events: {
				worth: new DefaultSetting("boolean", true),
			},
			hospital: {
				filter: new DefaultSetting("boolean", true),
			},
			auction: {
				filter: new DefaultSetting("boolean", true),
			},
			api: {
				autoFillKey: new DefaultSetting("boolean", true),
				autoDemo: new DefaultSetting("boolean", true),
				autoPretty: new DefaultSetting("boolean", true),
				clickableSelections: new DefaultSetting("boolean", true),
				marking: new DefaultSetting("boolean", true),
			},
			forums: {
				menu: new DefaultSetting("boolean", true),
				hidePosts: new DefaultSetting<Record<number, boolean>>("object", {}),
				hideThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				highlightPosts: new DefaultSetting<Record<number, boolean>>("object", {}),
				highlightThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				ignoredThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				debugInfoBtn: new DefaultSetting("boolean", true),
			},
			bazaar: {
				itemsCost: new DefaultSetting("boolean", true),
				worth: new DefaultSetting("boolean", true),
				fillMax: new DefaultSetting("boolean", true),
				maxBuyIgnoreCash: new DefaultSetting("boolean", false),
				highlightSubVendorItems: new DefaultSetting("boolean", false),
			},
			trade: {
				itemValues: new DefaultSetting("boolean", true),
				openChat: new DefaultSetting("boolean", true),
			},
			displayCase: {
				worth: new DefaultSetting("boolean", true),
			},
			shops: {
				fillMax: new DefaultSetting("boolean", true),
				maxBuyIgnoreCash: new DefaultSetting("boolean", false),
				profit: new DefaultSetting("boolean", true),
				filters: new DefaultSetting("boolean", true),
				values: new DefaultSetting("boolean", true),
			},
			casino: {
				netTotal: new DefaultSetting("boolean", true),
				blackjack: new DefaultSetting("boolean", true),
				highlow: new DefaultSetting("boolean", false),
				highlowMovement: new DefaultSetting("boolean", true),
			},
			racing: {
				winPercentage: new DefaultSetting("boolean", true),
				upgrades: new DefaultSetting("boolean", true),
				filter: new DefaultSetting("boolean", true),
			},
			faction: {
				idBesideFactionName: new DefaultSetting("boolean", false),
				csvRaidReport: new DefaultSetting("boolean", true),
				csvRankedWarReport: new DefaultSetting("boolean", true),
				csvWarReport: new DefaultSetting("boolean", true),
				csvChainReport: new DefaultSetting("boolean", true),
				csvChallengeContributions: new DefaultSetting("boolean", true),
				openOc: new DefaultSetting("boolean", true),
				highlightOwn: new DefaultSetting("boolean", true),
				availablePlayers: new DefaultSetting("boolean", true),
				recommendedNnb: new DefaultSetting("boolean", true),
				ocNnb: new DefaultSetting("boolean", true),
				ocTimes: new DefaultSetting("boolean", true),
				ocLastAction: new DefaultSetting("boolean", true),
				banker: new DefaultSetting("boolean", true),
				showFullInfobox: new DefaultSetting("boolean", true),
				foldableInfobox: new DefaultSetting("boolean", true),
				numberMembers: new DefaultSetting("boolean", true),
				warFinishTimes: new DefaultSetting("boolean", false),
				memberFilter: new DefaultSetting("boolean", true),
				armoryFilter: new DefaultSetting("boolean", true),
				armoryWorth: new DefaultSetting("boolean", true),
				upgradeRequiredRespect: new DefaultSetting("boolean", true),
				memberInfo: new DefaultSetting("boolean", false),
				rankedWarFilter: new DefaultSetting("boolean", true),
				quickItems: new DefaultSetting("boolean", true),
				stakeout: new DefaultSetting("boolean", true),
				showFactionSpy: new DefaultSetting("boolean", true),
				oc2Filter: new DefaultSetting("boolean", true),
				warnCrime: new DefaultSetting("boolean", false),
			},
			property: {
				value: new DefaultSetting("boolean", true),
				happy: new DefaultSetting("boolean", true),
			},
			gym: {
				specialist: new DefaultSetting("boolean", true),
				disableStats: new DefaultSetting("boolean", true),
				graph: new DefaultSetting("boolean", true),
				steadfast: new DefaultSetting("boolean", true),
				progress: new DefaultSetting("boolean", true),
			},
			missions: {
				hints: new DefaultSetting("boolean", true),
				rewards: new DefaultSetting("boolean", true),
			},
			attack: {
				bonusInformation: new DefaultSetting("boolean", true),
				timeoutWarning: new DefaultSetting("boolean", true),
				fairAttack: new DefaultSetting("boolean", true),
				weaponExperience: new DefaultSetting("boolean", true),
				hideAttackButtons: new DefaultSetting<string[]>("array", []),
			},
			city: {
				items: new DefaultSetting("boolean", true),
				combineDuplicates: new DefaultSetting("boolean", true),
			},
			joblist: {
				specials: new DefaultSetting("boolean", true),
			},
			bounties: {
				filter: new DefaultSetting("boolean", true),
			},
			userlist: {
				filter: new DefaultSetting("boolean", true),
			},
			itemmarket: {
				highlightCheapItems: new DefaultSetting<number | "">("number|empty", ""), // TODO - Rework this one.
				highlightCheapItemsSound: new DefaultSetting("boolean", false),
				leftBar: new DefaultSetting("boolean", false),
				fillMax: new DefaultSetting("boolean", true),
			},
			competition: {
				filter: new DefaultSetting("boolean", true),
			},
			museum: {
				autoFill: new DefaultSetting("boolean", true),
			},
			enemies: {
				filter: new DefaultSetting("boolean", true),
			},
			friends: {
				filter: new DefaultSetting("boolean", true),
			},
			targets: {
				filter: new DefaultSetting("boolean", true),
			},
			crimes2: {
				burglaryFilter: new DefaultSetting("boolean", true),
			},
		},
		scripts: {
			noConfirm: {
				itemEquip: new DefaultSetting("boolean", true),
				tradeAccept: new DefaultSetting("boolean", false),
				pointsMarketRemove: new DefaultSetting("boolean", false),
				pointsMarketBuy: new DefaultSetting("boolean", false),
				abroadItemBuy: new DefaultSetting("boolean", true),
			},
			achievements: {
				show: new DefaultSetting("boolean", true),
				completed: new DefaultSetting("boolean", false),
			},
			lastAction: {
				factionMember: new DefaultSetting("boolean", false),
				companyOwn: new DefaultSetting("boolean", false),
				companyOther: new DefaultSetting("boolean", false),
			},
			statsEstimate: {
				global: new DefaultSetting("boolean", true),
				delay: new DefaultSetting("number", 1500),
				cachedOnly: new DefaultSetting("boolean", true),
				displayNoResult: new DefaultSetting("boolean", false),
				maxLevel: new DefaultSetting("number", 100),
				profiles: new DefaultSetting("boolean", true),
				enemies: new DefaultSetting("boolean", true),
				hof: new DefaultSetting("boolean", true),
				attacks: new DefaultSetting("boolean", true),
				userlist: new DefaultSetting("boolean", true),
				bounties: new DefaultSetting("boolean", true),
				factions: new DefaultSetting("boolean", true),
				wars: new DefaultSetting("boolean", true),
				abroad: new DefaultSetting("boolean", true),
				competition: new DefaultSetting("boolean", true),
				rankedWars: new DefaultSetting("boolean", true),
				targets: new DefaultSetting("boolean", true),
			},
			ffScouter: {
				miniProfile: new DefaultSetting("boolean", true),
				profile: new DefaultSetting("boolean", true),
				attack: new DefaultSetting("boolean", true),
				factionList: new DefaultSetting("boolean", true),
				gauge: new DefaultSetting("boolean", true),
			},
		},
		external: {
			tornstats: new DefaultSetting("boolean", false),
			yata: new DefaultSetting("boolean", false),
			prometheus: new DefaultSetting("boolean", false),
			lzpt: new DefaultSetting("boolean", false),
			tornw3b: new DefaultSetting("boolean", false),
			ffScouter: new DefaultSetting("boolean", false),
		},
	},
	filters: {
		hospital: {
			timeStart: new DefaultSetting("number", 0),
			timeEnd: new DefaultSetting("number", 100),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			faction: new DefaultSetting("string", ""),
			activity: new DefaultSetting<string[]>("array", []),
			revivesOn: new DefaultSetting("boolean", false),
		},
		jail: {
			activity: new DefaultSetting<string[]>("array", []),
			faction: new DefaultSetting("string", "All"),
			timeStart: new DefaultSetting("number", 0),
			timeEnd: new DefaultSetting("number", 100),
			levelStart: new DefaultSetting("number", 1),
			levelEnd: new DefaultSetting("number", 100),
			scoreStart: new DefaultSetting("number", 0),
			scoreEnd: new DefaultSetting("number", 5000),
			bailCost: new DefaultSetting("number", -1),
		},
		racing: {
			hideRaces: new DefaultSetting<string[]>("array", []),
			timeStart: new DefaultSetting("number", 0),
			timeEnd: new DefaultSetting("number", 48),
			driversMin: new DefaultSetting("number", 2),
			driversMax: new DefaultSetting("number", 100),
			lapsMin: new DefaultSetting("number", 1),
			lapsMax: new DefaultSetting("number", 100),
			track: new DefaultSetting<string[]>("array", []),
			name: new DefaultSetting("string", ""),
		},
		containers: new DefaultSetting<{ [id: string]: boolean }>("object", {}),
		travel: {
			open: new DefaultSetting("boolean", false),
			type: new DefaultSetting("string", "basic"),
			categories: new DefaultSetting<string[]>("array", []),
			countries: new DefaultSetting<string[]>("array", []),
			hideOutOfStock: new DefaultSetting("boolean", false),
			applySalesTax: new DefaultSetting("boolean", false),
			sellAnonymously: new DefaultSetting("boolean", false),
		},
		abroadPeople: {
			activity: new DefaultSetting<string[]>("array", []),
			status: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			faction: new DefaultSetting("string", ""),
			special: {
				newPlayer: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inCompany: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inFaction: new DefaultSetting<SpecialFilterValue>("string", "both"),
				isDonator: new DefaultSetting<SpecialFilterValue>("string", "both"),
				hasBounties: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
			estimates: new DefaultSetting<string[]>("array", []),
		},
		abroadItems: {
			profitOnly: new DefaultSetting("boolean", false),
			outOfStock: new DefaultSetting("boolean", false),
			categories: new DefaultSetting<string[]>("array", []),
			taxes: new DefaultSetting<string[]>("array", []),
		},
		trade: {
			hideValues: new DefaultSetting("boolean", false),
		},
		gym: {
			specialist1: new DefaultSetting<"balboas" | "frontline" | "gym3000" | "isoyamas" | "rebound" | "elites" | "none">("string", "none"),
			specialist2: new DefaultSetting<"balboas" | "frontline" | "gym3000" | "isoyamas" | "rebound" | "elites" | "none">("string", "none"),
			strength: new DefaultSetting("boolean", false),
			speed: new DefaultSetting("boolean", false),
			defense: new DefaultSetting("boolean", false),
			dexterity: new DefaultSetting("boolean", false),
		},
		city: {
			highlightItems: new DefaultSetting("boolean", true),
		},
		bounties: {
			maxLevel: new DefaultSetting("number", 100),
			hideUnavailable: new DefaultSetting("boolean", false),
		},
		userlist: {
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			special: {
				fedded: new DefaultSetting<SpecialFilterValue>("string", "both"),
				fallen: new DefaultSetting<SpecialFilterValue>("string", "both"),
				traveling: new DefaultSetting<SpecialFilterValue>("string", "both"),
				newPlayer: new DefaultSetting<SpecialFilterValue>("string", "both"),
				onWall: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inCompany: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inFaction: new DefaultSetting<SpecialFilterValue>("string", "both"),
				isDonator: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inHospital: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inJail: new DefaultSetting<SpecialFilterValue>("string", "both"),
				earlyDischarge: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
			hospReason: {
				attackedBy: new DefaultSetting<SpecialFilterValue>("string", "both"),
				muggedBy: new DefaultSetting<SpecialFilterValue>("string", "both"),
				hospitalizedBy: new DefaultSetting<SpecialFilterValue>("string", "both"),
				other: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
			estimates: new DefaultSetting<string[]>("array", []),
		},
		stocks: {
			name: new DefaultSetting("string", ""),
			investment: {
				owned: new DefaultSetting<SpecialFilterValue>("string", "both"),
				benefit: new DefaultSetting<SpecialFilterValue>("string", "both"),
				passive: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
			price: {
				price: new DefaultSetting<SpecialFilterValue>("string", "both"),
				profit: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
		},
		faction: {
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 1),
			levelEnd: new DefaultSetting("number", 100),
			lastActionStart: new DefaultSetting("number", 0),
			lastActionEnd: new DefaultSetting("number", -1),
			status: new DefaultSetting<string[]>("array", []),
			position: new DefaultSetting("string", ""),
			special: {
				fedded: new DefaultSetting<SpecialFilterValue>("string", "both"),
				fallen: new DefaultSetting<SpecialFilterValue>("string", "both"),
				newPlayer: new DefaultSetting<SpecialFilterValue>("string", "both"),
				inCompany: new DefaultSetting<SpecialFilterValue>("string", "both"),
				isDonator: new DefaultSetting<SpecialFilterValue>("string", "both"),
				isRecruit: new DefaultSetting<SpecialFilterValue>("string", "both"),
			},
		},
		factionArmory: {
			hideUnavailable: new DefaultSetting("boolean", false),
			weapons: {
				name: new DefaultSetting("string", ""),
				category: new DefaultSetting("string", ""),
				rarity: new DefaultSetting("string", ""),
				weaponType: new DefaultSetting("string", ""),
				damage: new DefaultSetting("string", ""),
				accuracy: new DefaultSetting("string", ""),
				weaponBonus: new DefaultSetting<WeaponBonusFilter[]>("array", []),
			},
			armor: {
				name: new DefaultSetting("string", ""),
				rarity: new DefaultSetting("string", ""),
				defence: new DefaultSetting("string", ""),
				set: new DefaultSetting("string", ""),
				armorBonus: new DefaultSetting("string", ""),
			},
			temporary: {
				name: new DefaultSetting("string", ""),
			},
		},
		factionRankedWar: {
			activity: new DefaultSetting<string[]>("array", []),
			status: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 1),
			levelEnd: new DefaultSetting("number", 100),
			estimates: new DefaultSetting<string[]>("array", []),
		},
		profile: {
			relative: new DefaultSetting("boolean", false),
			stats: new DefaultSetting<string[]>("array", []),
		},
		competition: {
			levelStart: new DefaultSetting("number", 1),
			levelEnd: new DefaultSetting("number", 100),
			estimates: new DefaultSetting<string[]>("array", []),
		},
		shops: {
			hideLoss: new DefaultSetting("boolean", false),
			hideUnder100: new DefaultSetting("boolean", false),
		},
		auction: {
			weapons: {
				name: new DefaultSetting("string", ""),
				category: new DefaultSetting("string", ""),
				rarity: new DefaultSetting("string", ""),
				weaponType: new DefaultSetting("string", ""),
				damage: new DefaultSetting("string", ""),
				accuracy: new DefaultSetting("string", ""),
				weaponBonus: new DefaultSetting<WeaponBonusFilter[]>("array", []),
				quality: new DefaultSetting("string", ""),
			},
			armor: {
				name: new DefaultSetting("string", ""),
				rarity: new DefaultSetting("string", ""),
				defence: new DefaultSetting("string", ""),
				set: new DefaultSetting("string", ""),
				armorBonus: new DefaultSetting("string", ""),
			},
			items: {
				name: new DefaultSetting("string", ""),
				category: new DefaultSetting("string", ""),
				rarity: new DefaultSetting("string", ""),
			},
		},
		enemies: {
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			estimates: new DefaultSetting<string[]>("array", []),
		},
		friends: {
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
		},
		targets: {
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			estimates: new DefaultSetting<string[]>("array", []),
		},
		burglary: {
			targetName: new DefaultSetting("string", ""),
			targetType: new DefaultSetting<string[]>("array", []),
		},
		oc2: {
			difficulty: new DefaultSetting<number[]>("array", []),
			status: new DefaultSetting<string[]>("array", []),
		},
	},
	userdata: new DefaultSetting<StoredUserdata>("object", {} as StoredUserdata),
	torndata: new DefaultSetting<StoredTorndata>("object", {} as StoredTorndata),
	stockdata: new DefaultSetting<StoredStockdata>("object", {} as StoredStockdata),
	factiondata: new DefaultSetting<StoredFactiondata>("object", {} as StoredFactiondata),
	localdata: {
		tradeMessage: new DefaultSetting("number", 0),
		popup: {
			calculatorItems: new DefaultSetting<{ id: string; amount: number }[]>("array", []),
		},
		vault: {
			initialized: new DefaultSetting("boolean", false),
			lastTransaction: new DefaultSetting("string", ""),
			total: new DefaultSetting("number", 0),
			user: {
				initial: new DefaultSetting("number", 0),
				current: new DefaultSetting("number", 0),
			},
			partner: {
				initial: new DefaultSetting("number", 0),
				current: new DefaultSetting("number", 0),
			},
		},
	},
	stakeouts: new DefaultSetting<StoredStakeouts>("object", { order: [] } as StoredStakeouts),
	factionStakeouts: new DefaultSetting<StoredFactionStakeouts>("object", {} as StoredFactionStakeouts),
	attackHistory: {
		fetchData: new DefaultSetting("boolean", true),
		lastAttack: new DefaultSetting("number", 0),
		history: new DefaultSetting<AttackHistoryMap>("object", {}),
	},
	notes: {
		sidebar: {
			text: new DefaultSetting("string", ""),
			height: new DefaultSetting("string", "22px"),
		},
		profile: new DefaultSetting<StoredProfileNotes>("object", {}),
	},
	quick: {
		items: new DefaultSetting<QuickItem[]>("array", []),
		factionItems: new DefaultSetting<QuickFactionItem[]>("array", []),
		crimes: new DefaultSetting<QuickCrime[]>("array", []),
		jail: new DefaultSetting<QuickJail[]>("array", []),
	},
	cache: new DefaultSetting<DatabaseCache>("object", {}),
	usage: new DefaultSetting<DatabaseUsage>("object", {}),
	npcs: new DefaultSetting<StoredNpcs>("object", {} as StoredNpcs),
	notificationHistory: new DefaultSetting<TTNotification[]>("array", []),
	notifications: {
		events: new DefaultSetting<NotificationMap>("object", {}),
		messages: new DefaultSetting<NotificationMap>("object", {}),
		newDay: new DefaultSetting<NotificationMap>("object", {}),
		energy: new DefaultSetting<NotificationMap>("object", {}),
		happy: new DefaultSetting<NotificationMap>("object", {}),
		nerve: new DefaultSetting<NotificationMap>("object", {}),
		life: new DefaultSetting<NotificationMap>("object", {}),
		travel: new DefaultSetting<NotificationMap>("object", {}),
		drugs: new DefaultSetting<NotificationMap>("object", {}),
		boosters: new DefaultSetting<NotificationMap>("object", {}),
		medical: new DefaultSetting<NotificationMap>("object", {}),
		hospital: new DefaultSetting<NotificationMap>("object", {}),
		chain: new DefaultSetting<NotificationMap>("object", {}),
		chainCount: new DefaultSetting<NotificationMap>("object", {}),
		stakeouts: new DefaultSetting<NotificationMap>("object", {}),
		npcs: new DefaultSetting<NotificationMap>("object", {}),
		offline: new DefaultSetting<NotificationMap>("object", {}),
		missionsLimit: new DefaultSetting<NotificationMap>("object", {}),
		missionsExpire: new DefaultSetting<NotificationMap>("object", {}),
	},
} as const;

type ExtractDefaultSettingType<T> = T extends DefaultSetting<infer U> ? U : T extends object ? { [K in keyof T]: ExtractDefaultSettingType<T[K]> } : T;

type DefaultStorageType = ExtractDefaultSettingType<typeof DEFAULT_STORAGE>;

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
} as const;

const HIGHLIGHT_PLACEHOLDERS = [{ name: "$player", value: () => userdata?.profile?.name || "", description: "Your player name." }] as const;

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
} as const;

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
} as const;

const CHAT_TITLE_COLORS = {
	blue: ["rgb(10,60,173)", "rgb(22,109,236)"],
	brown: ["rgb(109,53,4)", "rgb(146,69,4)"],
	orange: ["rgb(227,130,5)", "rgb(234,164,50)"],
	purple: ["rgb(94,7,119)", "rgb(184,9,241)"],
	red: ["rgb(123,4,4)", "rgb(255,3,3)"],
} as const;

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
} as const;

const RANK_TRIGGERS = {
	level: [2, 6, 11, 26, 31, 50, 71, 100],
	crimes: [100, 5000, 10000, 20000, 30000, 50000],
	networth: [5000000, 50000000, 500000000, 5000000000, 50000000000],

	stats: ["under 2k", "2k - 25k", "20k - 250k", "200k - 2.5m", "2m - 25m", "20m - 250m", "over 200m"],
} as const;

const HOSPITALIZATION_REASONS = {
	attackedBy: "Attacked by",
	muggedBy: "Mugged by",
	hospitalizedBy: "Hospitalized by",
	other: ["Attacked by", "Mugged by", "Hospitalized by"],
} as const;
