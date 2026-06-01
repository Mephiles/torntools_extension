import type { BadgeManager, RuntimeEnvironment } from "@utils/functions/runtime";

export const UserscriptRuntimeEnvironment: RuntimeEnvironment = {
	getVersion(): string {
		return "userscript";
	},

	getURL(_path: string): string {
		throw new Error("getURL is not available in userscript context");
	},

	isExtensionPage(): boolean {
		return false;
	},

	async hasPermission(_origins: string[]): Promise<boolean> {
		return false;
	},
};

export const UserscriptBadgeManager: BadgeManager = {
	setBadgeText(_text: string): void {
		// No-op: badge not available in userscript context
	},

	setBadgeBackgroundColor(_color: string): void {
		// No-op: badge not available in userscript context
	},

	getBadgeText(): Promise<string> {
		return Promise.resolve("");
	},
};
