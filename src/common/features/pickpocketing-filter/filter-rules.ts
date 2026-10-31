export const PICKPOCKETING_TIERS = ["safe", "moderately-unsafe", "unsafe", "risky", "dangerous", "very-dangerous"] as const;

export type PickpocketingTier = (typeof PICKPOCKETING_TIERS)[number];

export const TIER_LABELS: Record<PickpocketingTier, string> = {
	safe: "Safe",
	"moderately-unsafe": "Moderately unsafe",
	unsafe: "Unsafe",
	risky: "Risky",
	dangerous: "Dangerous",
	"very-dangerous": "Very dangerous",
};

export const PICKPOCKETING_BUILDS = ["skinny", "average", "athletic", "muscular", "heavyset"] as const;

export type PickpocketingBuild = (typeof PICKPOCKETING_BUILDS)[number];

export const BUILD_LABELS: Record<PickpocketingBuild, string> = {
	skinny: "Skinny",
	average: "Average",
	athletic: "Athletic",
	muscular: "Muscular",
	heavyset: "Heavyset",
};

export interface PickpocketingSelection {
	tiers: string[];
	builds: string[];
}

const MARK_TIERS: Record<string, PickpocketingTier> = {
	"drunk man": "safe",
	"drunk woman": "safe",
	"homeless person": "safe",
	junkie: "safe",
	"elderly man": "safe",
	"elderly woman": "safe",
	"classy lady": "moderately-unsafe",
	laborer: "moderately-unsafe",
	"postal worker": "moderately-unsafe",
	"young man": "moderately-unsafe",
	"young woman": "moderately-unsafe",
	student: "moderately-unsafe",
	"rich kid": "unsafe",
	"sex worker": "unsafe",
	thug: "unsafe",
	jogger: "risky",
	businessman: "risky",
	businesswoman: "risky",
	"gang member": "risky",
	mobster: "risky",
	cyclist: "dangerous",
	"police officer": "very-dangerous",
};

export function getMarkTier(markName: string | null | undefined): PickpocketingTier | null {
	return MARK_TIERS[(markName ?? "").trim().toLowerCase()] ?? null;
}

/**
 * Extracts the build type based on the entire build text, e.g. "Average 5'4" 171 lbs" becomes 'average'.
 * @param physicalProps raw build type text
 */
export function getBuild(physicalProps: string | null | undefined): string | null {
	const build = (physicalProps ?? "").trim().split(/\s+/)[0];

	return build ? build.toLowerCase() : null;
}

export function hidesMark(markName: string | null | undefined, physicalProps: string | null | undefined, selection: PickpocketingSelection): boolean {
	const tier = getMarkTier(markName);
	if (tier && selection.tiers.length > 0 && !selection.tiers.includes(tier)) return true;

	const build = getBuild(physicalProps);

	return selection.builds.length > 0 && !!build && !selection.builds.includes(build);
}
