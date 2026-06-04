import type { Feature } from "@features/feature";

export interface FeatureManager {
	createPopup(): void;
	registerFeature(feature: Feature): void;
	isEnabled<T extends Feature>(featureConstructor: new () => T): boolean;
}
