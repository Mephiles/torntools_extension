import { setBadgeManager, setFeatureManager, setRuntimeEnvironment, setScriptInjector, setTTStorage } from "@utils/context";
import { ExtensionScriptInjector } from "@utils/functions/listeners";
import { ExtensionFeatureManager } from "./extension-feature-manager";
import { ExtensionBadgeManager, ExtensionRuntime } from "./extension-runtime";
import { TTExtensionStorage } from "./extension-storage";

export function registerExtensionContext() {
	setTTStorage(new TTExtensionStorage());

	if (typeof window !== "undefined") {
		setFeatureManager(new ExtensionFeatureManager());
		setScriptInjector(ExtensionScriptInjector);
	}

	setRuntimeEnvironment(ExtensionRuntime);
	setBadgeManager(ExtensionBadgeManager);
}
