export type GearboxRatio = "long ratio" | "short ratio" | "";
export type RaceSurface = "dirt" | "tarmac" | "";

export interface RaceRecommendation {
	car: string;
	gearbox: Exclude<GearboxRatio, "">;
	turbo: string;
	surface: Exclude<RaceSurface, "">;
}

export interface RaceGuideSetup {
	gearbox: GearboxRatio;
	turbo: string;
	surface: RaceSurface;
}

const RECOMMENDATIONS: Record<string, RaceRecommendation> = {
	Uptown: { car: "Lambrini Torobravo", gearbox: "long ratio", turbo: "t3", surface: "tarmac" },
	Withdrawal: { car: "Veloria LFA", gearbox: "long ratio", turbo: "t3", surface: "tarmac" },
	Underdog: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "tarmac" },
	Parkland: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3", surface: "dirt" },
	Docks: { car: "Volt GT", gearbox: "long ratio", turbo: "t3", surface: "tarmac" },
	Commerce: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "tarmac" },
	"Two Islands": { car: "Edomondo NSX", gearbox: "long ratio", turbo: "t3", surface: "dirt" },
	Industrial: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3", surface: "tarmac" },
	Vector: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3", surface: "tarmac" },
	Mudpit: { car: "Colina Tanprice", gearbox: "long ratio", turbo: "t3", surface: "dirt" },
	Hammerhead: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "dirt" },
	Sewage: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2", surface: "tarmac" },
	Meltdown: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3", surface: "tarmac" },
	Speedway: { car: "Veloria LFA", gearbox: "long ratio", turbo: "t3", surface: "tarmac" },
	"Stone Park": { car: "Echo R8", gearbox: "short ratio", turbo: "t3", surface: "dirt" },
	Convict: { car: "Mercia SLR", gearbox: "long ratio", turbo: "t3", surface: "tarmac" },
};

export function getRecommendation(trackName: string): RaceRecommendation | undefined {
	return RECOMMENDATIONS[trackName];
}

export function getGuideSetup(trackName: string): RaceGuideSetup {
	const recommendation = getRecommendation(trackName);

	return { gearbox: recommendation?.gearbox ?? "", turbo: recommendation?.turbo ?? "", surface: recommendation?.surface ?? "" };
}

const GEARBOX_LABELS: Record<GearboxRatio, string> = { "long ratio": "LR", "short ratio": "SR", "": "" };

export function formatGearbox(gearbox: GearboxRatio): string {
	return GEARBOX_LABELS[gearbox];
}

const SURFACE_LABELS: Record<RaceSurface, string> = { tarmac: "T", dirt: "D", "": "" };

export function formatSurface(surface: RaceSurface): string {
	return SURFACE_LABELS[surface];
}
