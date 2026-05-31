import { ExtensionFeatureManager } from "@/features/feature-manager";
import { TTExtensionStorage } from "@/utils/common/data/storage";
import { ExtensionScriptInjector } from "@/utils/common/functions/listeners";
import { setFeatureManager, setScriptInjector, setTTStorage } from "@/utils/context";

export function registerExtensionContext() {
	setTTStorage(new TTExtensionStorage());
	if (typeof window !== "undefined") {
		setFeatureManager(new ExtensionFeatureManager());
		setScriptInjector(ExtensionScriptInjector);
	}
}
