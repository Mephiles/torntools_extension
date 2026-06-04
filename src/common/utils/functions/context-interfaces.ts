export interface RuntimeInformation {
	getVersion(): string;
	isUserscript(): boolean;
}

type AreaName = globalThis.Browser.storage.AreaName;
type StorageChange = globalThis.Browser.storage.StorageChange;

export interface RuntimeStorage {
	addChangeListener: (callback: (changes: { [key: string]: StorageChange }, areaName: AreaName) => void) => void;
}
