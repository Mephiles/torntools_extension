import { ttCache } from "@common/utils/data/cache";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import type { UpgradeCatalog } from "@features/race-car-selector/car-ranking";
import type { RaceCarUpgrade, RacingCarUpgradesResponse } from "tornapi-typescript";

const CACHE_SECTION = "racingCarUpgrades";
const CACHE_KEY = "catalog";
const CACHE_TTL = TO_MILLIS.DAYS * 7;

let inFlight: Promise<UpgradeCatalog> | null = null;

function buildCatalog(upgrades: RaceCarUpgrade[]): UpgradeCatalog {
	return new Map(upgrades.map((upgrade) => [upgrade.id, upgrade]));
}

export async function getUpgradeCatalog(): Promise<UpgradeCatalog> {
	const cached = ttCache.get<RaceCarUpgrade[]>(CACHE_SECTION, CACHE_KEY);
	if (cached?.length) return buildCatalog(cached);

	if (inFlight) return inFlight;

	inFlight = fetchUpgradeCatalog().finally(() => (inFlight = null));

	return inFlight;
}

async function fetchUpgradeCatalog(): Promise<UpgradeCatalog> {
	const upgrades = (await fetchData<RacingCarUpgradesResponse>("tornv2", { section: "racing", selections: ["carupgrades"], silent: true })).carupgrades;

	ttCache.set({ [CACHE_KEY]: upgrades }, CACHE_TTL, CACHE_SECTION);
	return buildCatalog(upgrades);
}
