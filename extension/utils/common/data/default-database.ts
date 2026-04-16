import type { TornItem, UserLastActionStatusEnum, UserStatusStateEnum } from "tornapi-typescript";
import type { FetchedFactiondataBasic, FetchedFactiondataWithAccess, FetchedTorndata, FetchedUserdata } from "@/entrypoints/background/updates";
import type { InactivityDisplay } from "@/entrypoints/options/settings";
import type { ColoredChatOption } from "@/features/colored-chat/colored-chat";
import type { SavedCustomLink } from "@/features/custom-links/custom-links";
import type { StoredHiddenFeeds } from "@/features/only-new-feed/only-new-feed";
import type { StoredResizableChats } from "@/features/resizable-chat/resizable-chat";
import type { DatabaseCache } from "@/utils/common/data/cache";
import type { StoredMigration } from "@/utils/common/data/migrations";
import type { DatabaseUsage } from "@/utils/common/data/usage";
import type { TornV1Stock } from "@/utils/common/functions/api-v1.types";
import type { SpecialFilterValue } from "@/utils/common/functions/filters";
import type { InternalPageTheme } from "@/utils/common/functions/pages";

type SettingType = "string" | "boolean" | "number" | "number|empty" | "object" | "array";

export class DefaultSetting<T = never> {
	readonly type: SettingType;
	readonly defaultValue: undefined | T | (() => T) | null;

	constructor(type: SettingType, defaultValue?: T | (() => T) | null) {
		this.type = type;
		this.defaultValue = defaultValue;
	}
}

export const DEFAULT_STORAGE = {
	version: {
		current: new DefaultSetting<string>("string", () => browser.runtime.getManifest().version),
		initial: new DefaultSetting<string>("string", () => browser.runtime.getManifest().version),
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
			ttsVoice: new DefaultSetting("string", "default"),
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
				refillEnergyEnabled: new DefaultSetting("boolean", true),
				refillEnergy: new DefaultSetting("string", ""),
				refillNerveEnabled: new DefaultSetting("boolean", true),
				refillNerve: new DefaultSetting("string", ""),
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
				virus: new DefaultSetting("boolean", true),
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
		customLinks: new DefaultSetting<SavedCustomLink[]>("array", []),
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
				noOutsideLinkAlert: new DefaultSetting("boolean", false),
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
				completeUsernames: new DefaultSetting("boolean", true),
				highlights: new DefaultSetting("array", [{ name: "$player", color: "#7ca900" }]),
				titleHighlights: new DefaultSetting<ColoredChatOption[]>("array", []),
				tradeTimer: new DefaultSetting("boolean", true),
				resizable: new DefaultSetting("boolean", true),
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
				rwTimer: new DefaultSetting("boolean", true),
				virusTimer: new DefaultSetting("boolean", false),
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
				moneyInput: new DefaultSetting("boolean", true),
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
			},
			forums: {
				menu: new DefaultSetting("boolean", true),
				hidePosts: new DefaultSetting<Record<number, boolean>>("object", {}),
				hideThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				highlightPosts: new DefaultSetting<Record<number, boolean>>("object", {}),
				highlightThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				ignoredThreads: new DefaultSetting<Record<number, boolean>>("object", {}),
				debugInfoBtn: new DefaultSetting("boolean", true),
				onlyNewFeedButton: new DefaultSetting("boolean", true),
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
				rankedWarValue: new DefaultSetting("boolean", true),
				totalChallengeContributions: new DefaultSetting("boolean", true),
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
				value: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
			timeStart: new DefaultSetting("number", 0),
			timeEnd: new DefaultSetting("number", 100),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			faction: new DefaultSetting("string", ""),
			activity: new DefaultSetting<string[]>("array", []),
			revivesOn: new DefaultSetting("boolean", false),
		},
		jail: {
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			ffScoreMax: new DefaultSetting("number", null),
			ffScoreMin: new DefaultSetting("number", null),
		},
		abroadItems: {
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			ffScoreMax: new DefaultSetting("number", null),
			ffScoreMin: new DefaultSetting("number", null),
		},
		stocks: {
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
			estimates: new DefaultSetting<string[]>("array", []),
		},
		friends: {
			enabled: new DefaultSetting("boolean", true),
			activity: new DefaultSetting<string[]>("array", []),
			levelStart: new DefaultSetting("number", 0),
			levelEnd: new DefaultSetting("number", 100),
		},
		targets: {
			enabled: new DefaultSetting("boolean", true),
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
			enabled: new DefaultSetting("boolean", true),
			difficulty: new DefaultSetting<number[]>("array", []),
			status: new DefaultSetting<string[]>("array", []),
		},
	},
	userdata: new DefaultSetting<StoredUserdata>("object", { date: -1 } as StoredUserdata),
	torndata: new DefaultSetting<StoredTorndata>("object", { date: -2 } as StoredTorndata),
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
		chatResize: new DefaultSetting<StoredResizableChats>("object", {}),
		feedHidden: new DefaultSetting<StoredHiddenFeeds>("object", {}),
		threadsHiddenInFeed: new DefaultSetting<number[]>("array", []),
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
		refillEnergy: new DefaultSetting<NotificationMap>("object", {}),
		refillNerve: new DefaultSetting<NotificationMap>("object", {}),
	},
	migrations: new DefaultSetting<StoredMigration[]>("array", []),
} as const;

type ExtractDefaultSettingType<T> = T extends DefaultSetting<infer U> ? U : T extends object ? { [K in keyof T]: ExtractDefaultSettingType<T[K]> } : T;

export type DefaultStorageType = ExtractDefaultSettingType<typeof DEFAULT_STORAGE>;

export type StoredNpcs = {
	next_update: number;
	service: string;
	targets: {
		[id: string]: StoredNpc;
	};
	planned?: number | false;
	reason?: string;
};

export interface StoredNpc {
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

export type StoredUserdata = FetchedUserdata & {
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

export type StoredFactiondataNoAccess = { access: "none"; error?: any; retry?: number };
export type StoredFactiondataBasic = { access: "basic"; retry?: number; date: number } & FetchedFactiondataBasic;
type StoredFactiondataFullAccess = { access: "full_access"; date: number; userCrime: number } & FetchedFactiondataWithAccess;
export type StoredFactiondata = (StoredFactiondataNoAccess | StoredFactiondataBasic | StoredFactiondataFullAccess) & { date: number };

export type StoredTorndata = FetchedTorndata & { itemsMap: Record<number | string, TornItem>; date: number };

export type StoredStockdata = { [name: string]: TornV1Stock | number; date: number };
export type StakeoutData = {
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
export type StoredStakeouts = {
	[name: string]: StakeoutData | any[] | number;
	order: string[];
	date: number;
};

export type QuickItem = { id: number };
export type QuickFactionItem = { id: number | "points-energy" | "points-nerve" };
type QuickCrime = {
	step: string;
	nerve: number;
	name: string;
	icon: string;
	text: string;
};
type QuickJail = "bust" | "bail";

export type TTNotification =
	| {
			title: string;
			message: string;
			url?: string;
			date: number;
			type?: string;
			key?: string | number;
			seen?: boolean;
	  }
	| { combined: true };
type NotificationMap = { [key: string]: TTNotification };
type StoredProfileNotes = { [id: number]: { height: string; text: string } };
export type AttackHistory = {
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

export interface WeaponBonusFilter {
	bonus: string;
	value: number;
}
