import { settings } from "@common/utils/data/database";
import "./show-faction-spy.css";
import { isInternalFaction, readFactionDetails } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { hasAPIData } from "@common/utils/functions/api";
import type { TornstatsFactionSpyResponse, YATASpyResponse } from "@common/utils/functions/api.types";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { elementBuilder, findAllElements, mobile } from "@common/utils/functions/dom";
import { formatNumber, formatTime } from "@common/utils/functions/formatting";
import { executePriorityServices, PriorityService } from "@common/utils/functions/priority-services";
import { requireElement } from "@common/utils/functions/requires";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

interface FactionSpyData {
	strength: number;
	defense: number;
	speed: number;
	dexterity: number;
	total: number;
	timestamp: number;
}

interface FactionSpyFetchResult {
	spies: Record<string, FactionSpyData>;
	cached: boolean;
}

abstract class FactionSpyPerformer extends PriorityService<FactionSpyFetchResult> {
	protected factionID: number;

	constructor(factionID: number) {
		super();
		this.factionID = factionID;
	}
}

class TornStatsFactionSpyPerformer extends FactionSpyPerformer {
	readonly name = "TornStats";

	enabled(): boolean {
		return settings.external.tornstats && settings.servicePreferences.factionSpies.tornstats.enabled;
	}

	priority(): number {
		return settings.servicePreferences.factionSpies.tornstats.priority;
	}

	async execute(): Promise<FactionSpyFetchResult> {
		let data: TornstatsFactionSpyResponse;
		let isCached = false;

		if (ttCache.hasValue("faction-spy-tornstats", this.factionID)) {
			data = ttCache.get<TornstatsFactionSpyResponse>("faction-spy-tornstats", this.factionID);
			isCached = true;
		} else {
			data = await fetchData<TornstatsFactionSpyResponse>("tornstats", { section: "spy/faction", id: this.factionID });
			ttCache.set({ [this.factionID]: data }, TO_MILLIS.HOURS, "faction-spy-tornstats");
		}

		const spies: Record<string, FactionSpyData> =
			data.status && data.faction.spies
				? Object.entries(data.faction.members).reduce<Record<string, FactionSpyData>>((spies, [memberID, { spy }]) => {
						spies[memberID] = spy;
						return spies;
					}, {})
				: {};

		return { spies, cached: isCached };
	}
}

class YATAFactionSpyPerformer extends FactionSpyPerformer {
	readonly name = "YATA";

	enabled(): boolean {
		return settings.external.yata && settings.servicePreferences.factionSpies.yata.enabled;
	}

	priority(): number {
		return settings.servicePreferences.factionSpies.yata.priority;
	}

	async execute(): Promise<FactionSpyFetchResult> {
		let data: YATASpyResponse;
		let isCached = false;

		if (ttCache.hasValue("faction-spy-yata", this.factionID)) {
			data = ttCache.get<YATASpyResponse>("faction-spy-yata", this.factionID);
			isCached = true;
		} else {
			data = await fetchData<YATASpyResponse>("yata", { relay: true, section: "spies", includeKey: true, params: { faction: this.factionID } });
			ttCache.set({ [this.factionID]: data }, TO_MILLIS.HOURS, "faction-spy-yata");
		}

		const spies = Object.entries(data.spies).reduce<Record<string, FactionSpyData>>((spies, [memberID, spyData]) => {
			spies[memberID] = {
				strength: spyData.strength,
				defense: spyData.defense,
				speed: spyData.speed,
				dexterity: spyData.dexterity,
				total: spyData.total,
				timestamp: spyData.update,
			};
			return spies;
		}, {});

		return { spies, cached: isCached };
	}
}

async function fetchSpies(factionID: number): Promise<Record<string, FactionSpyData>> {
	const services: PriorityService<FactionSpyFetchResult>[] = [new TornStatsFactionSpyPerformer(factionID), new YATAFactionSpyPerformer(factionID)];

	const { result, errors } = await executePriorityServices(services);

	if (result) return window.structuredClone(result.spies);

	const errorMessages = errors.map((e) => `${e.service}: ${e.message}`).join("; ");
	throw new Error(errorMessages || "No spy service available. Please enable TornStats or YATA.");
}

function formatSpyStats(spyData: FactionSpyData) {
	return {
		strength: formatNumber(spyData.strength, { shorten: 3, decimals: 3 }),
		defense: formatNumber(spyData.defense, { shorten: 3, decimals: 3 }),
		speed: formatNumber(spyData.speed, { shorten: 3, decimals: 3 }),
		dexterity: formatNumber(spyData.dexterity, { shorten: 3, decimals: 3 }),
		total: formatNumber(spyData.total, { shorten: 3, decimals: 3 }),
		timestamp: formatTime({ seconds: spyData.timestamp }, { type: "ago", short: true }),
	};
}

function registerListeners() {
	window.addEventListener("hashchange", async (e) => {
		if (!FEATURE_MANAGER.isEnabled(ShowFactionSpyFeature)) return;

		if (e.newURL.includes("#/war/rank")) await fetchAndAddSpies();
		else removeSpies(true);
	});
}

async function fetchAndAddSpies() {
	removeSpies();

	if (location.hash.includes("#/war/rank")) await showRWSpies();

	// No need for member spies of user's faction.
	if (isInternalFaction) return;

	// Add spy data to member list.
	const factionDetails = await readFactionDetails();
	if (!factionDetails) throw new Error("Faction ID could not be found.");

	const spies = await fetchSpies(factionDetails.id);

	await requireElement(".members-list .table-body > li .status");

	const tableBody = document.querySelector(".members-list .table-body");
	tableBody.classList.add("tt-modified-faction-spy");

	Array.from(tableBody.children).forEach((row) => {
		const memberID = row.querySelector(".member.icons [href*='/profiles.php']")?.getAttribute("href").split("XID=")[1];
		if (!memberID) return;
		const spyData = spies[memberID];

		let statFields = [];
		let title = "";
		if (spyData) {
			const stats = formatSpyStats(spyData);

			const allFields = [
				`Strength: ${stats.strength}`,
				`Defense: ${stats.defense}`,
				`Speed: ${stats.speed}`,
				`Dexterity: ${stats.dexterity}`,
				`Total: ${stats.total}`,
				`⏱: ${stats.timestamp}`,
			];

			statFields = allFields.slice(mobile ? 4 : 0).map((text) => elementBuilder({ type: "div", text }));
			title = allFields.join("\n");
		} else statFields.push(elementBuilder({ type: "div", text: "No spy found." }));

		const spyElement = elementBuilder({
			type: "div",
			class: "tt-faction-spy",
			children: statFields,
			attributes: { title },
		});
		row.appendChild(spyElement);
	});
}

async function showRWSpies() {
	const enemiesMembersList = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war .enemy-faction.left .members-list");
	const enemyFactionID = parseInt(enemiesMembersList.querySelector("a[href*='/factions.php?step=profile&ID=']").getAttribute("href").split("ID=")[1]);

	const spies = await fetchSpies(enemyFactionID);

	Array.from(enemiesMembersList.children).forEach((row) => {
		const memberID = row.querySelector("a[href*='/profiles.php']").getAttribute("href").split("XID=")[1];
		const spyData = spies[memberID];

		let statFields = [];
		let title = "";
		if (spyData) {
			const stats = formatSpyStats(spyData);

			const allFields = [
				`Strength: ${stats.strength}`,
				`Defense: ${stats.defense}`,
				`Speed: ${stats.speed}`,
				`Dexterity: ${stats.dexterity}`,
				`Total: ${stats.total}`,
				`⏱: ${stats.timestamp}`,
			];

			statFields = allFields.slice(4).map((text) => elementBuilder({ type: "div", text }));
			title = allFields.join("<br>");
		} else statFields.push(elementBuilder({ type: "div", text: "No spy found." }));

		const spyElement = elementBuilder({
			type: "div",
			class: "tt-faction-rw-spy",
			children: statFields,
			attributes: { title },
		});
		row.appendChild(spyElement);
	});
}

function removeSpies(onlyRWSpies = false) {
	if (!onlyRWSpies) {
		document.querySelector(".tt-modified-faction-spy")?.classList.remove("tt-modified-faction-spy");
		findAllElements(".tt-faction-spy").forEach((x) => x.remove());
	}
	findAllElements(".tt-faction-rw-spy").forEach((x) => x.remove());
}

export default class ShowFactionSpyFeature extends Feature {
	constructor() {
		super("Show Faction Spy", "faction");
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		const tornstatsEnabled = settings.external.tornstats && settings.servicePreferences.factionSpies.tornstats.enabled;
		const yataEnabled = settings.external.yata && settings.servicePreferences.factionSpies.yata.enabled;
		if (!tornstatsEnabled && !yataEnabled) return "Both TornStats and YATA are disabled.";

		if (
			settings.scripts.statsEstimate.global &&
			settings.scripts.statsEstimate.factions &&
			settings.scripts.statsEstimate.wars &&
			settings.scripts.statsEstimate.rankedWars
		)
			return "Stats Estimate is not disabled for any of factions, wars or ranked wars.";

		return true;
	}

	isEnabled() {
		return settings.pages.faction.showFactionSpy;
	}

	initialise() {
		registerListeners();
	}

	async execute() {
		await fetchAndAddSpies();
	}

	cleanup() {
		removeSpies();
	}

	storageKeys() {
		return [
			"settings.pages.faction.showFactionSpy",
			"settings.external.tornstats",
			"settings.external.yata",
			"scripts.statsEstimate.global",
			"scripts.statsEstimate.factions",
			"scripts.statsEstimate.wars",
			"scripts.statsEstimate.rankedWars",
		];
	}
}
