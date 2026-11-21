import type { GearboxRatio, RaceRecommendation, RaceSurface } from "@features/race-car-selector/racing-recommendations";
import { getRecommendation } from "@features/race-car-selector/racing-recommendations";
import type { RaceCarUpgrade, UserRaceCarDetails } from "tornapi-typescript";

export type UpgradeCatalog = Map<number, RaceCarUpgrade>;

export interface CarSetup {
	gearbox: GearboxRatio;
	turbo: string;
	surface: RaceSurface;
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
	const result: CarSetup = { gearbox: "", turbo: "", surface: "", parsed: false };
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

	const tyreUpgrade = installed.find((upgrade) => upgrade.subcategory === "Tyres");
	const surfaceSource = (tyreUpgrade?.name ?? gearUpgrade?.name ?? "").toLowerCase();
	if (surfaceSource.includes("rally")) result.surface = "dirt";
	else if (surfaceSource.includes("track") || surfaceSource.includes("paddle shift")) result.surface = "tarmac";

	result.parsed = Boolean(result.gearbox || result.turbo);
	return result;
}

export function buildMatchesRecommendation(car: UserRaceCarDetails, recommendation: RaceRecommendation, catalog: UpgradeCatalog): boolean {
	const setup = deriveSetupFromParts(car, catalog);

	return setup.parsed && setup.gearbox === recommendation.gearbox && setup.turbo === recommendation.turbo && setup.surface === recommendation.surface;
}

export function findRecommendedCar(cars: UserRaceCarDetails[], trackName: string, catalog: UpgradeCatalog): UserRaceCarDetails | undefined {
	const recommendation = getRecommendation(trackName);
	if (!recommendation) return undefined;

	const matches = getRecommendedModelCars(cars, trackName).filter((car) => buildMatchesRecommendation(car, recommendation, catalog));

	return findTrackNamedCar(matches, trackName) ?? matches[0];
}

enum CarNameMatch {
	NONE = 0,
	PREFIX = 1,
	TRACK = 2,
}

function carNameMatchStrength(carName: string | null, trackName: string): CarNameMatch {
	if (!carName) return CarNameMatch.NONE;

	const name = carName.toLowerCase();
	const track = trackName.toLowerCase();

	if (name.includes(track)) return CarNameMatch.TRACK;
	if (name.includes(track.slice(0, 3))) return CarNameMatch.PREFIX;
	return CarNameMatch.NONE;
}

export function carNameMatchesTrack(carName: string | null, trackName: string): boolean {
	return carNameMatchStrength(carName, trackName) > CarNameMatch.NONE;
}

export function findTrackNamedCar(cars: UserRaceCarDetails[], trackName: string): UserRaceCarDetails | undefined {
	let best: UserRaceCarDetails | undefined;
	let bestStrength = CarNameMatch.NONE;

	for (const car of cars) {
		if (car.is_removed) continue;

		const strength = carNameMatchStrength(car.car_name, trackName);
		if (strength > bestStrength) {
			best = car;
			bestStrength = strength;
		}
	}

	return best;
}
