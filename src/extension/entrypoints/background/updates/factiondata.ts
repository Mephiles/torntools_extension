import { ttStorage } from "@common/utils/context";
import { factiondata, setFactiondata, userdata } from "@common/utils/data/database";
import type { StoredFactiondata, StoredFactiondataBasic, StoredFactiondataNoAccess } from "@common/utils/data/default-database";
import { FACTION_ACCESS, hasFactionAPIAccess } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { FactionV1CrimesResponse } from "@common/utils/functions/api-v1.types";
import { hasTimePassed, TO_MILLIS } from "@common/utils/functions/utilities";
import { calculateOC } from "@extension/entrypoints/background/updates-helper";
import type { FactionBasicResponse, FactionRankedWarResponse } from "tornapi-typescript";

export type FetchedFactiondataBasic = FactionBasicResponse & FactionRankedWarResponse;
export type FetchedFactiondataWithAccess = FetchedFactiondataBasic & FactionV1CrimesResponse;

export async function updateFactiondata() {
	if (!userdata?.faction) {
		setFactiondata({ access: FACTION_ACCESS.none, date: 0 });
	} else {
		const hasFactiondata = !factiondata || typeof factiondata !== "object" || factiondata.access !== FACTION_ACCESS.none;

		if (!hasFactiondata || hasFactionAPIAccess()) {
			setFactiondata(await updateAccess());
		} else {
			const retry = ("retry" in factiondata && !!factiondata.retry) || ("date" in factiondata && hasTimePassed(factiondata.date, TO_MILLIS.HOURS * 6));

			if (retry) setFactiondata(await updateAccess());
			else setFactiondata(await updateBasic());
		}
	}

	await ttStorage.set({ factiondata });

	async function updateAccess(): Promise<StoredFactiondata> {
		try {
			// TODO - Migrate to V2 (faction/crimes).
			const data = await fetchData<FetchedFactiondataWithAccess>("tornv2", {
				section: "faction",
				selections: ["basic", "rankedwars"],
				legacySelections: ["crimes"],
				silent: true,
			});

			return {
				...data,
				access: FACTION_ACCESS.full_access,
				date: Date.now(),
				userCrime: calculateOC(data.crimes, userdata.profile.id), // FIXME - Look into OC2 not breaking this.
			};
		} catch (error) {
			if (error?.code === 7) {
				const data = await updateBasic();

				return { ...data, retry: Date.now() };
			}

			return { error, access: FACTION_ACCESS.none, date: 0 };
		}
	}

	async function updateBasic(): Promise<(StoredFactiondataBasic | StoredFactiondataNoAccess) & { date: number }> {
		try {
			const data = await fetchData<FetchedFactiondataBasic>("tornv2", {
				section: "faction",
				selections: ["basic", "rankedwars"],
				silent: true,
			});

			return {
				...data,
				access: FACTION_ACCESS.basic,
				date: Date.now(),
			};
		} catch (error) {
			return { error, access: FACTION_ACCESS.none, date: 0 };
		}
	}
}
