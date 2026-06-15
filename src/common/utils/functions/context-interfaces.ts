export interface RuntimeInformation {
	getVersion(): string;
	isUserscript(): boolean;
}

type AreaName = globalThis.Browser.storage.AreaName;
type StorageChange = globalThis.Browser.storage.StorageChange;

export type StorageChangeCallback = (changes: { [key: string]: StorageChange }, areaName: AreaName) => void;

export interface RuntimeStorage {
	addChangeListener: (callback: StorageChangeCallback) => void;
}
