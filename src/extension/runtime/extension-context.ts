import { setFeatureManager, setRuntimeInformation, setRuntimeStorage, setScriptInjector, setTTStorage } from "@common/utils/context";
import type { RuntimeInformation, RuntimeStorage } from "@common/utils/functions/context-interfaces";
import { executeScript } from "@common/utils/functions/dom";
import type { ScriptInjector } from "@common/utils/functions/script-injector";
import { browser } from "wxt/browser";
import { ExtensionFeatureManager } from "@/runtime/extension-feature-manager";
import { TTExtensionStorage } from "@/runtime/extension-storage";

export function registerExtensionContext() {
	setTTStorage(new TTExtensionStorage());
	if (typeof window !== "undefined") {
		setFeatureManager(new ExtensionFeatureManager());
		setScriptInjector(ExtensionScriptInjector);
	}
	setRuntimeInformation(ExtensionRuntimeInformation);
	setRuntimeStorage(ExtensionRuntimeStorage);
}

export const ExtensionScriptInjector: ScriptInjector & { injectedFetch: boolean; injectedXHR: boolean } = {
	injectedFetch: false,
	injectFetch() {
		if (this.injectedFetch) return;

		executeScript(browser.runtime.getURL("/fetch--inject.js"), false);
		this.injectedFetch = true;
	},
	injectedXHR: false,
	injectXHR() {
		if (this.injectedXHR) return;

		executeScript(browser.runtime.getURL("/xhr--inject.js"), false);
		this.injectedXHR = true;
	},
};

export const ExtensionRuntimeInformation: RuntimeInformation = {
	getVersion(): string {
		return browser.runtime.getManifest().version;
	},

	isUserscript(): boolean {
		return false;
	},
};

export const ExtensionRuntimeStorage: RuntimeStorage = {
	addChangeListener: (cb) => browser.storage.onChanged.addListener(cb),
};
