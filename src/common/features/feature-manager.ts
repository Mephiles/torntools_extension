import type { Feature } from "@features/feature";

export interface FeatureManager {
	createPopup(): void;
	registerFeature(feature: Feature): void;
	isEnabled(featureConstructor: new () => Feature): boolean;
	logError(info: string | string[], error: any): void;
}
