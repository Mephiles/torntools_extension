export enum SpecialGym {
	BALBOAS = "balboas",
	FRONTLINE = "frontline",
	GYM3000 = "gym3000",
	ISOYAMAS = "isoyamas",
	REBOUND = "rebound",
	ELITES = "elites",
}

export const specialGyms = Object.values(SpecialGym);

export const specialGymDescMap: Record<SpecialGym, string> = {
	[SpecialGym.BALBOAS]: "Balboas Gym (def/dex)",
	[SpecialGym.FRONTLINE]: "Frontline Fitness (str/spd)",
	[SpecialGym.GYM3000]: "Gym 3000 (str)",
	[SpecialGym.ISOYAMAS]: "Mr. Isoyamas (def)",
	[SpecialGym.REBOUND]: "Total Rebound (spd)",
	[SpecialGym.ELITES]: "Elites (dex)",
};
