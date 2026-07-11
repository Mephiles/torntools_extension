import { handleDeviceSizeClasses } from "@common/pages/global-page";
import { SCRIPT_INJECTOR } from "@common/utils/context";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import type { Feature } from "@features/feature";
import type { FeatureManager } from "@features/feature-manager";

declare global {
	interface Window {
		ttScriptState?: ScriptState;
	}
}

type ScriptState = {
	enabled: Record<string, boolean>;
};

export class ScriptFeatureManager implements FeatureManager {
	constructor() {
		this.getScriptState();
	}

	createPopup() {}

	isEnabled<T extends Feature>(featureConstructor: new () => T): boolean {
		return this.getScriptState().enabled[new featureConstructor().name];
	}

	registerFeature(feature: Feature): void {
		if (feature.requiresScreenInformation()) {
			handleDeviceSizeClasses();
		}

		feature.initialise();
		feature.execute();

		this.getScriptState().enabled[feature.name] = true;
		if (feature.shouldTriggerEvents()) {
			triggerCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, { name: feature.name });
		}
	}

	private getScriptState() {
		const win = SCRIPT_INJECTOR.getWindow();
		if (!win.ttScriptState) {
			const newState: ScriptState = { enabled: {} };
			win.ttScriptState = newState;
			return newState;
		}

		return win.ttScriptState;
	}
}
