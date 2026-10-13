export type GearboxRatio = "long ratio" | "short ratio" | "";

export interface RaceRecommendation {
	car: string;
	gearbox: Exclude<GearboxRatio, "">;
	turbo: string;
}

export interface RaceGuideSetup {
	gearbox: GearboxRatio;
	turbo: string;
}

const RECOMMENDATIONS: Record<string, RaceRecommendation> = {
	Uptown: { car: "Lambrini Torobravo", gearbox: "long ratio", turbo: "t3" },
	Withdrawal: { car: "Veloria LFA", gearbox: "long ratio", turbo: "t3" },
	Underdog: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2" },
	Parkland: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3" },
	Docks: { car: "Volt GT", gearbox: "long ratio", turbo: "t3" },
	Commerce: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2" },
	"Two Islands": { car: "Edomondo NSX", gearbox: "long ratio", turbo: "t3" },
	Industrial: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3" },
	Vector: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3" },
	Mudpit: { car: "Colina Tanprice", gearbox: "long ratio", turbo: "t3" },
	Hammerhead: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2" },
	Sewage: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t2" },
	Meltdown: { car: "Edomondo NSX", gearbox: "short ratio", turbo: "t3" },
	Speedway: { car: "Veloria LFA", gearbox: "long ratio", turbo: "t3" },
	"Stone Park": { car: "Echo R8", gearbox: "short ratio", turbo: "t3" },
	Convict: { car: "Mercia SLR", gearbox: "long ratio", turbo: "t3" },
};

export function getRecommendation(trackName: string): RaceRecommendation | undefined {
	return RECOMMENDATIONS[trackName];
}

export function getGuideSetup(trackName: string): RaceGuideSetup {
	const recommendation = getRecommendation(trackName);

	return { gearbox: recommendation?.gearbox ?? "", turbo: recommendation?.turbo ?? "" };
}

const GEARBOX_LABELS: Record<GearboxRatio, string> = { "long ratio": "LR", "short ratio": "SR", "": "" };

export function formatGearbox(gearbox: GearboxRatio): string {
	return GEARBOX_LABELS[gearbox];
}
