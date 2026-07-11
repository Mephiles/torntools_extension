export interface TornToolsWindowExtensions {
	xhrOpenAdjustments?: { [key: string]: (xhr: any, body: string) => string };
	xhrSendAdjustments?: { [key: string]: (xhr: any, body: string) => string };
}

export type TTWindow = Window & typeof globalThis & TornToolsWindowExtensions;

export interface RuntimeInformation {
	getWindow(): TTWindow;
	getVersion(): string;
	isUserscript(): boolean;
}

export const DEFAULT_RUNTIME_INFORMATION: RuntimeInformation = {
	getWindow: () => window,
	getVersion: () => "N/A",
	isUserscript: () => false,
};

type AreaName = globalThis.Browser.storage.AreaName;
type StorageChange = globalThis.Browser.storage.StorageChange;

export type StorageChangeCallback = (changes: { [key: string]: StorageChange }, areaName: AreaName) => void;

export interface RuntimeStorage {
	addChangeListener: (callback: StorageChangeCallback) => void;
}
