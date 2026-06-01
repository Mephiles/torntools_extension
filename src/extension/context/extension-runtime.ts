import type { BadgeManager, RuntimeEnvironment } from "@utils/functions/runtime";
import { browser } from "wxt/browser";

export const ExtensionRuntime: RuntimeEnvironment = {
	getVersion(): string {
		return browser.runtime.getManifest().version;
	},

	getURL(path: string): string {
		return browser.runtime.getURL(path as Parameters<typeof browser.runtime.getURL>[0]);
	},

	isExtensionPage(): boolean {
		return location.host === browser.runtime.id;
	},

	async hasPermission(origins: string[]): Promise<boolean> {
		// We have permission for the entire domain, not just the api subdomain.
		const normalizedOrigins = origins.map((origin) => origin.replaceAll("api.torn.com", "torn.com"));
		return browser.permissions.contains({ origins: normalizedOrigins });
	},
};

export const ExtensionBadgeManager: BadgeManager = {
	setBadgeText(text: string): void {
		void browser.action.setBadgeText({ text });
	},

	setBadgeBackgroundColor(color: string): void {
		void browser.action.setBadgeBackgroundColor({ color });
	},

	getBadgeText(): Promise<string> {
		return browser.action.getBadgeText({});
	},
};
