enum EVENT_CHANNELS {
	// Using events on the window.
	FETCH = "tt-fetch",
	XHR = "tt-xhr",
	// Callbacks
	CHAT_MESSAGE = "chat-message",
	CHAT_NEW = "chat-box-new",
	CHAT_OPENED = "chat-box-opened",
	CHAT_PEOPLE_MENU_OPENED = "chat-people-menu-opened",
	CHAT_SETTINGS_MENU_OPENED = "chat-settings-menu-opened",
	CHAT_REFRESHED = "chat-refreshed",
	CHAT_RECONNECTED = "chat-reconnected",
	CHAT_CLOSED = "chat-closed",
	COMPANY_EMPLOYEES_PAGE = "company-employees-page",
	COMPANY_STOCK_PAGE = "company-stock-page",
	FACTION_ARMORY_TAB = "faction-armory-tab",
	FACTION_CRIMES = "faction-crimes",
	FACTION_CRIMES2 = "faction-crimes2",
	FACTION_CRIMES2_TAB = "faction-crimes2-tab",
	FACTION_CRIMES2_REFRESH = "faction-crimes2-refresh",
	FACTION_GIVE_TO_USER = "faction-give-to-user",
	FACTION_UPGRADE_INFO = "faction-upgrade-info",
	FACTION_INFO = "faction-info",
	FACTION_MAIN = "faction-main",
	FACTION_NATIVE_FILTER = "faction-filter_native",
	FACTION_NATIVE_SORT = "faction-sort_native",
	FACTION_NATIVE_ICON_UPDATE = "faction-icon_update_native",
	ITEM_AMOUNT = "item-amount",
	ITEM_EQUIPPED = "item-equipped",
	ITEM_ITEMS_LOADED = "item-items-loaded",
	ITEM_SWITCH_TAB = "item-switch-tab",
	HOSPITAL_SWITCH_PAGE = "hospital-switch-page",
	JAIL_SWITCH_PAGE = "jail-switch-page",
	USERLIST_SWITCH_PAGE = "userlist-switch-page",
	TRAVEL_SELECT_TYPE = "travel-select-type",
	TRAVEL_SELECT_COUNTRY = "travel-select-country",
	TRAVEL_DESTINATION_UPDATE = "travel-destination-update",
	TRAVEL_ABROAD__SHOP_LOAD = "TRAVEL_ABROAD__SHOP_LOAD",
	TRAVEL_ABROAD__SHOP_REFRESH = "TRAVEL_ABROAD__SHOP_REFRESH",
	FEATURE_ENABLED = "feature-enabled",
	FEATURE_DISABLED = "feature-disabled",
	STATE_CHANGED = "state-changed",
	GYM_LOAD = "gym-load",
	GYM_TRAIN = "gym-train",
	CRIMES_LOADED = "crimes-loaded",
	CRIMES_CRIME = "crimes-crime",
	CRIMES2_HOME_LOADED = "crimes2-home-loaded",
	CRIMES2_BURGLARY_LOADED = "crimes2-burglary-loaded",
	CRIMES2_CRIME_LOADED = "crimes2-crime-loaded",
	MISSION_LOAD = "mission-load",
	MISSION_REWARDS = "mission-rewards",
	TRADE = "trade",
	PROFILE_FETCHED = "profile-fetched",
	FILTER_APPLIED = "filter-applied",
	STATS_ESTIMATED = "stats-estimated",
	SWITCH_PAGE = "switch-page",
	AUCTION_SWITCH_TYPE = "auction-switch-type",
	ITEMMARKET_CATEGORY_ITEMS = "itemmarket-category-items",
	ITEMMARKET_CATEGORY_ITEMS_UPDATE = "itemmarket-category-items-update",
	ITEMMARKET_ITEMS = "itemmarket-items",
	ITEMMARKET_ITEMS_UPDATE = "itemmarket-items-update",
	ITEMMARKET_ITEM_DETAILS = "itemmarket-item-details",
}

type EventPayloads = {
	[EVENT_CHANNELS.FETCH]: FetchDetails;
	[EVENT_CHANNELS.XHR]: XHRDetails;
	[EVENT_CHANNELS.CHAT_MESSAGE]: { message: HTMLElement };
	[EVENT_CHANNELS.CHAT_NEW]: never;
	[EVENT_CHANNELS.CHAT_OPENED]: { chat: HTMLElement };
	[EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED]: { peopleMenu: HTMLElement };
	[EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED]: { settingsPanel: HTMLElement };
	[EVENT_CHANNELS.CHAT_REFRESHED]: { chat?: Element } | undefined;
	[EVENT_CHANNELS.CHAT_RECONNECTED]: never;
	[EVENT_CHANNELS.CHAT_CLOSED]: never;
	[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE]: never;
	[EVENT_CHANNELS.COMPANY_STOCK_PAGE]: never;
	[EVENT_CHANNELS.FACTION_ARMORY_TAB]: { section: string };
	[EVENT_CHANNELS.FACTION_CRIMES]: never;
	[EVENT_CHANNELS.FACTION_CRIMES2]: never;
	[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH]: never;
	[EVENT_CHANNELS.FACTION_GIVE_TO_USER]: never;
	[EVENT_CHANNELS.FACTION_UPGRADE_INFO]: never;
	[EVENT_CHANNELS.FACTION_INFO]: never;
	[EVENT_CHANNELS.FACTION_MAIN]: never;
	[EVENT_CHANNELS.FACTION_NATIVE_SORT]: never;
	[EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE]: never;
	[EVENT_CHANNELS.ITEM_AMOUNT]: { item: number; amount: number; reason: string };
	[EVENT_CHANNELS.ITEM_EQUIPPED]: { equip: boolean; item: number };
	[EVENT_CHANNELS.ITEM_ITEMS_LOADED]: { tab: HTMLElement; initial: boolean };
	[EVENT_CHANNELS.ITEM_SWITCH_TAB]: { tab: string };
	[EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE]: never;
	[EVENT_CHANNELS.JAIL_SWITCH_PAGE]: never;
	[EVENT_CHANNELS.USERLIST_SWITCH_PAGE]: never;
	[EVENT_CHANNELS.TRAVEL_SELECT_TYPE]: { type: string };
	[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY]: { country: string };
	[EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE]: never;
	[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD]: { country: string; items: AbroadItem[] };
	[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH]: never;
	[EVENT_CHANNELS.TRADE]: { step: string; active: boolean };
	[EVENT_CHANNELS.FEATURE_ENABLED]: { name: string };
	[EVENT_CHANNELS.FEATURE_DISABLED]: { name: string };
	[EVENT_CHANNELS.STATE_CHANGED]: { oldState: string | null; newState: string | undefined };
	[EVENT_CHANNELS.GYM_LOAD]: { stats: Record<string, number> };
	[EVENT_CHANNELS.GYM_TRAIN]: { stats: Record<string, number> };
	[EVENT_CHANNELS.CRIMES_LOADED]: never;
	[EVENT_CHANNELS.CRIMES_CRIME]: never;
	[EVENT_CHANNELS.CRIMES2_HOME_LOADED]: never;
	[EVENT_CHANNELS.CRIMES2_BURGLARY_LOADED]: never;
	[EVENT_CHANNELS.CRIMES2_CRIME_LOADED]: { crime: (typeof CRIMES2)[keyof typeof CRIMES2]; crimeRoot: Element; page: string; url: string; json: any };
	[EVENT_CHANNELS.MISSION_LOAD]: never;
	[EVENT_CHANNELS.MISSION_REWARDS]: never;
	[EVENT_CHANNELS.PROFILE_FETCHED]: { data: UserPersonalStatsFull };
	[EVENT_CHANNELS.FILTER_APPLIED]: { filter: string };
	[EVENT_CHANNELS.STATS_ESTIMATED]: { row: HTMLElement; estimate?: string };
	[EVENT_CHANNELS.AUCTION_SWITCH_TYPE]: { type: string };
	[EVENT_CHANNELS.FACTION_CRIMES2_TAB]: { tabName: string };
	[EVENT_CHANNELS.FACTION_NATIVE_FILTER]: { hasResults: boolean };
	[EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS]: { list: Element };
	[EVENT_CHANNELS.SWITCH_PAGE]: never;
	[EVENT_CHANNELS.ITEMMARKET_ITEM_DETAILS]: { item: number; element: Element };
	[EVENT_CHANNELS.ITEMMARKET_CATEGORY_ITEMS_UPDATE]: { item: Element };
	[EVENT_CHANNELS.ITEMMARKET_ITEMS_UPDATE]: { item: number; list: Element };
	[EVENT_CHANNELS.ITEMMARKET_ITEMS]: { item: number; list: Element };
};

type CustomEventListener<T extends keyof EventPayloads> = (payload: EventPayloads[T]) => void;

const CUSTOM_LISTENERS: { [K in keyof EventPayloads]: CustomEventListener<K>[] } = (() => {
	const listeners: Partial<{ [K in keyof EventPayloads]: CustomEventListener<K>[] }> = {};

	for (const channel of Object.values(EVENT_CHANNELS)) {
		listeners[channel] = [];
	}

	return listeners as { [K in keyof EventPayloads]: CustomEventListener<K>[] };
})();

let injectedXHR: boolean, injectedFetch: boolean;

function injectFetch() {
	if (injectedFetch) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/fetch.inject.js"), false);
	injectedFetch = true;
}

function addFetchListener(callback: (event: CustomEventInit<FetchDetails>) => void) {
	injectFetch();

	window.addEventListener(EVENT_CHANNELS.FETCH, callback);
}

function injectXHR() {
	if (injectedXHR) return;

	executeScript(chrome.runtime.getURL("/scripts/global/inject/xhr.inject.js"), false);
	injectedXHR = true;
}

function addXHRListener(callback: (event: CustomEventInit<XHRDetails>) => void) {
	injectXHR();

	window.addEventListener(EVENT_CHANNELS.XHR, callback);
}

function triggerCustomListener<T extends keyof EventPayloads>(channel: T, payload?: EventPayloads[T]): void {
	for (const listener of CUSTOM_LISTENERS[channel]) {
		listener(payload);
	}
}

function addCustomListener<T extends keyof EventPayloads>(channel: T, listener: CustomEventListener<T>): void {
	CUSTOM_LISTENERS[channel].push(listener);
}
