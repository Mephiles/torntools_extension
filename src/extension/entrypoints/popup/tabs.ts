import type { DatabaseSettings } from "@common/utils/data/database";

export type PopupTabKey = "dashboard" | "marketSearch" | "calculator" | "stocksOverview" | "notifications";

export interface PopupTab {
	key: PopupTabKey;
	label: string;
	path: string;
}

const POPUP_TABS: PopupTab[] = [
	{ key: "dashboard", label: "Dashboard", path: "/dashboard" },
	{ key: "marketSearch", label: "Market", path: "/market" },
	{ key: "calculator", label: "Calculator", path: "/calculator" },
	{ key: "stocksOverview", label: "Stocks", path: "/stocks" },
	{ key: "notifications", label: "Notifications", path: "/notifications" },
];

export function getEnabledPopupTabs(settings: DatabaseSettings | undefined) {
	if (!settings?.pages?.popup) return [];

	return POPUP_TABS.filter((tab) => settings.pages.popup[tab.key]);
}

export function getStartupPath(settings: DatabaseSettings | undefined, hasApiKey: boolean) {
	if (!hasApiKey) return "/initialize";

	const enabledTabs = getEnabledPopupTabs(settings);
	const defaultTab = enabledTabs.find((tab) => tab.key === settings?.pages?.popup?.defaultTab);

	return defaultTab?.path ?? enabledTabs[0]?.path ?? "/dashboard";
}
