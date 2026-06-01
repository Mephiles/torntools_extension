export interface RuntimeEnvironment {
	getVersion(): string;
	getURL(path: string): string;
	isExtensionPage(): boolean;
	hasPermission(origins: string[]): Promise<boolean>;
}

export interface BadgeManager {
	setBadgeText(text: string): void;
	setBadgeBackgroundColor(color: string): void;
	getBadgeText(): Promise<string>;
}
