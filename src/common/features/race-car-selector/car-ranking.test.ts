import { describe, expect, it } from "bun:test";
import type { RaceCarUpgrade, UserRaceCarDetails } from "tornapi-typescript";
import type { UpgradeCatalog } from "./car-ranking";
import {
	buildMatchesRecommendation,
	carNameMatchesTrack,
	countOwnedModelBuilds,
	deriveSetupFromParts,
	findRecommendedCar,
	findTrackNamedCar,
	getRecommendedModelCars,
} from "./car-ranking";
import { getRecommendation } from "./racing-recommendations";

function car(partial: Partial<UserRaceCarDetails> & Pick<UserRaceCarDetails, "id">): UserRaceCarDetails {
	return {
		car_item_id: 78,
		car_item_name: "Edomondo NSX",
		class: "A",
		top_speed: 100,
		acceleration: 100,
		braking: 100,
		handling: 100,
		safety: 100,
		dirt: 100,
		tarmac: 100,
		car_name: null,
		worth: 0,
		points_spent: 0,
		races_entered: 0,
		races_won: 0,
		is_removed: false,
		parts: [],
		...partial,
	};
}

type UpgradeOverrides = Partial<Omit<RaceCarUpgrade, "effects">> & { effects?: Partial<RaceCarUpgrade["effects"]> };

function upgrade({ effects, ...partial }: UpgradeOverrides & Pick<RaceCarUpgrade, "id">): RaceCarUpgrade {
	return {
		name: "",
		description: "",
		class_required: "A",
		category: "Engine",
		subcategory: "Engine Cooling",
		cost: { points: 0, cash: 0 },
		...partial,
		effects: { top_speed: 0, acceleration: 0, braking: 0, handling: 0, safety: 0, dirt: 0, tarmac: 0, ...effects },
	};
}

function catalog(upgrades: RaceCarUpgrade[]): UpgradeCatalog {
	return new Map(upgrades.map((item) => [item.id, item]));
}

const SHORT_GEAR = upgrade({ id: 1, name: "Short Ratio Gearbox", subcategory: "Gearbox" });
const LONG_GEAR = upgrade({ id: 2, name: "Long Ratio Gearbox", subcategory: "Gearbox" });
const TURBO_TWO = upgrade({ id: 3, name: "Stage Two Turbo Kit", subcategory: "Turbo" });
const TURBO_THREE = upgrade({ id: 4, name: "Stage Three Turbo Kit", subcategory: "Turbo" });
const UPGRADES = [SHORT_GEAR, LONG_GEAR, TURBO_TWO, TURBO_THREE];
const UNDERDOG = getRecommendation("Underdog")!;

describe("getRecommendedModelCars", () => {
	it("keeps only active builds of the recommended model", () => {
		const cars = [car({ id: 1 }), car({ id: 2 }), car({ id: 3, is_removed: true }), car({ id: 4, car_item_name: "Volt GT" })];

		expect(getRecommendedModelCars(cars, "Underdog").map((build) => build.id)).toEqual([1, 2]);
	});
});

describe("deriveSetupFromParts", () => {
	it("reads a long-ratio gearbox", () => {
		expect(deriveSetupFromParts(car({ id: 1, parts: [LONG_GEAR.id] }), catalog([LONG_GEAR])).gearbox).toBe("long ratio");
	});

	it("reads a short-ratio gearbox", () => {
		expect(deriveSetupFromParts(car({ id: 1, parts: [SHORT_GEAR.id] }), catalog([SHORT_GEAR])).gearbox).toBe("short ratio");
	});

	it("reads the turbo stage from a kit", () => {
		expect(deriveSetupFromParts(car({ id: 1, parts: [TURBO_THREE.id] }), catalog([TURBO_THREE])).turbo).toBe("t3");
	});
});

describe("buildMatchesRecommendation", () => {
	it("requires both the gearbox and the turbo to match", () => {
		const full = car({ id: 1, parts: [SHORT_GEAR.id, TURBO_TWO.id] });
		const partial = car({ id: 2, parts: [SHORT_GEAR.id, TURBO_THREE.id] });

		expect(buildMatchesRecommendation(full, UNDERDOG, catalog(UPGRADES))).toBe(true);
		expect(buildMatchesRecommendation(partial, UNDERDOG, catalog(UPGRADES))).toBe(false);
	});
});

describe("findRecommendedCar", () => {
	it("finds the build matching the recommended model and setup", () => {
		const onGuide = car({ id: 1, parts: [SHORT_GEAR.id, TURBO_TWO.id] });
		const offGuide = car({ id: 2, parts: [LONG_GEAR.id, TURBO_THREE.id] });

		expect(findRecommendedCar([offGuide, onGuide], "Underdog", catalog(UPGRADES))?.id).toBe(1);
	});

	it("returns nothing when no owned build matches the recommended setup", () => {
		const offGuide = car({ id: 1, parts: [LONG_GEAR.id, TURBO_THREE.id] });

		expect(findRecommendedCar([offGuide], "Underdog", catalog(UPGRADES))).toBeUndefined();
	});

	it("prefers the build configured to the recommended setup", () => {
		const offSetup = car({ id: 1, parts: [LONG_GEAR.id, TURBO_THREE.id] });
		const exactSetup = car({ id: 2, parts: [SHORT_GEAR.id, TURBO_TWO.id] });

		expect(findRecommendedCar([offSetup, exactSetup], "Underdog", catalog(UPGRADES))?.id).toBe(2);
	});

	it("returns nothing when the recommended model is not owned", () => {
		const cars = [car({ id: 1, car_item_name: "Veloria LFA" })];

		expect(findRecommendedCar(cars, "Underdog", catalog(UPGRADES))).toBeUndefined();
	});
});

describe("carNameMatchesTrack", () => {
	it("matches every track token in a multi-track custom name", () => {
		expect(carNameMatchesTrack("Underdog/Commerce/Sew-", "Underdog")).toBe(true);
		expect(carNameMatchesTrack("Underdog/Commerce/Sew-", "Commerce")).toBe(true);
		expect(carNameMatchesTrack("Underdog/Commerce/Sew-", "Sewage")).toBe(true);
	});

	it("does not match an unrelated track", () => {
		expect(carNameMatchesTrack("Underdog/Commerce/Sew-", "Vector")).toBe(false);
	});

	it("returns false without a custom name", () => {
		expect(carNameMatchesTrack(null, "Underdog")).toBe(false);
	});

	it("matches prefixes case-insensitively", () => {
		expect(carNameMatchesTrack("sew", "Sewage")).toBe(true);
	});
});

describe("findTrackNamedCar", () => {
	it("returns the first car whose name lists the track", () => {
		const other = car({ id: 1, car_name: "Vector" });
		const named = car({ id: 2, car_name: "Underdog/Commerce/Sew-" });

		expect(findTrackNamedCar([other, named], "Sewage")?.id).toBe(2);
		expect(findTrackNamedCar([other, named], "Vector")?.id).toBe(1);
		expect(findTrackNamedCar([other, named], "Mudpit")).toBeUndefined();
	});
});

describe("countOwnedModelBuilds", () => {
	it("counts active builds of the recommended model", () => {
		const cars = [car({ id: 1 }), car({ id: 2 }), car({ id: 3, is_removed: true }), car({ id: 4, car_item_name: "Volt GT" })];
		expect(countOwnedModelBuilds(cars, UNDERDOG)).toBe(2);
	});
});
