import type { GearboxRatio, RaceRecommendation } from "@features/race-car-selector/racing-recommendations";
import { getRecommendation } from "@features/race-car-selector/racing-recommendations";
import type { RaceCarUpgrade, UserRaceCarDetails } from "tornapi-typescript";

export type UpgradeCatalog = Map<number, RaceCarUpgrade>;

export interface CarSetup {
	gearbox: GearboxRatio;
	turbo: string;
	parsed: boolean;
}

const STAGE_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

export function getRecommendedModelCars(cars: UserRaceCarDetails[], trackName: string): UserRaceCarDetails[] {
	const recommendation = getRecommendation(trackName);
	if (!recommendation) return [];

	return cars.filter((car) => !car.is_removed && car.car_item_name === recommendation.car);
}

export function countOwnedModelBuilds(cars: UserRaceCarDetails[], recommendation: RaceRecommendation | undefined): number {
	if (!recommendation) return 0;

	return cars.filter((car) => !car.is_removed && car.car_item_name === recommendation.car).length;
}

function stageFromUpgradeText(text: string): number {
	const match = text.match(/stage\s+(one|two|three|four|five|\d+)\b/i);
	if (!match) return 0;

	const raw = match[1].toLowerCase();
	return STAGE_WORDS[raw] ?? (/^\d+$/.test(raw) ? parseInt(raw, 10) : 0);
}

export function deriveSetupFromParts(car: UserRaceCarDetails, catalog: UpgradeCatalog): CarSetup {
	const result: CarSetup = { gearbox: "", turbo: "", parsed: false };
	if (!car.parts.length) return result;

	const installed = car.parts.map((id) => catalog.get(id)).filter((upgrade): upgrade is RaceCarUpgrade => Boolean(upgrade));

	const turboUpgrade = installed.find((upgrade: RaceCarUpgrade) => upgrade.subcategory === "Turbo");
	if (turboUpgrade) {
		result.turbo = `t${stageFromUpgradeText(turboUpgrade.name)}`;
	}

	const gearUpgrade = installed.find((upgrade) => upgrade.subcategory === "Gearbox");
	if (gearUpgrade) {
		const gearName = gearUpgrade.name.toLowerCase();

		if (gearName.includes("long ratio")) result.gearbox = "long ratio";
		else if (gearName.includes("short ratio")) result.gearbox = "short ratio";
	}

	result.parsed = Boolean(result.gearbox || result.turbo);
	return result;
}

export function buildMatchesRecommendation(car: UserRaceCarDetails, recommendation: RaceRecommendation, catalog: UpgradeCatalog): boolean {
	const setup = deriveSetupFromParts(car, catalog);

	return setup.parsed && setup.gearbox === recommendation.gearbox && setup.turbo === recommendation.turbo;
}

export function findRecommendedCar(cars: UserRaceCarDetails[], trackName: string, catalog: UpgradeCatalog): UserRaceCarDetails | undefined {
	const recommendation = getRecommendation(trackName);
	if (!recommendation) return undefined;

	const eligibleCars = getRecommendedModelCars(cars, trackName);
	return eligibleCars.find((car) => buildMatchesRecommendation(car, recommendation, catalog));
}

export function carNameMatchesTrack(carName: string | null, trackName: string): boolean {
	if (!carName) return false;

	const track = trackName.toLowerCase();
	const trackShort = track.slice(0, 3);

	return carName.toLowerCase().includes(track) || carName.toLowerCase().includes(trackShort);
}

export function findTrackNamedCar(cars: UserRaceCarDetails[], trackName: string): UserRaceCarDetails | undefined {
	return cars.find((car) => !car.is_removed && carNameMatchesTrack(car.car_name, trackName));
}
