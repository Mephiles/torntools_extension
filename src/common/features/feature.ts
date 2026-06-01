export enum ExecutionTiming {
	IMMEDIATELY = "IMMEDIATELY",
	DOM_INTERACTIVE = "DOM_INTERACTIVE",
	CONTENT_LOADED = "CONTENT_LOADED",
}

export abstract class Feature {
	readonly name: string;
	readonly scope: string;
	readonly executionTiming: ExecutionTiming;

	protected constructor(name: string, scope: string, executionTiming: ExecutionTiming = ExecutionTiming.CONTENT_LOADED) {
		this.name = name;
		this.scope = scope;
		this.executionTiming = executionTiming;
	}

	precondition(): boolean | Promise<boolean> {
		return true;
	}

	abstract isEnabled(): boolean;

	initialise(): void {}

	// biome-ignore lint/correctness/noUnusedFunctionParameters: Meant to be overridden, so here as a placeholder.
	execute(liveReload?: boolean): void | Promise<void> {}

	cleanup(): void {}

	storageKeys(): string[] {
		return [];
	}

	requirements(): (boolean | string) | Promise<boolean | string> {
		return true;
	}

	shouldTriggerEvents(): boolean {
		return false;
	}

	shouldLiveReload(): boolean {
		return false;
	}

	requiresScreenInformation() {
		return true;
	}
}

export abstract class DisabledUntilNoticeFeature extends Feature {
	requirements(): (boolean | string) | Promise<boolean | string> {
		return "Disabled until further notice.";
	}
}

export interface FeatureManager {
	createPopup(): void;
	registerFeature(feature: Feature): void;
	isEnabled<T extends Feature>(featureConstructor: new () => T): boolean;
}
