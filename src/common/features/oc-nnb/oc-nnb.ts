import "./oc-nnb.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { settings } from "@common/utils/data/database";
import { hasAPIData, hasOC1Data } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { TornstatsFactionCrimes, YATAFactionMembers } from "@common/utils/functions/api.types";
import { elementBuilder, mobile } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { getPageStatus } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

interface NNBMap {
	[id: string]: NNBInformation;
}

interface NNBInformation {
	verified: boolean;
	nnb: number;
	degree?: boolean;
	federal_judge?: boolean;
	merits?: number;
}

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, async () => {
		if (!FEATURE_MANAGER.isEnabled(OCNNBFeature)) return;

		await showNNB();
	});
}

async function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	await showNNB();
}

async function showNNB() {
	const data = await loadData().catch((error) => {
		console.error("TT - Unhandled error. Report this to the TornTools developers!", error);
		return false;
	});
	if (!data) return;

	populateCrimes();
	populateSelection();

	async function loadData() {
		const data: NNBMap = {};

		if (settings.external.tornstats) await loadTornstats();
		if (settings.external.yata) await loadYATA();

		return data;

		async function loadTornstats() {
			let result: TornstatsFactionCrimes;
			if (ttCache.hasValue("crimes", "tornstats")) {
				result = ttCache.get<TornstatsFactionCrimes>("crimes", "tornstats");
			} else {
				try {
					result = await fetchData<TornstatsFactionCrimes>("tornstats", { section: "faction/crimes", relay: true });

					if (result.status) {
						ttCache.set({ tornstats: result }, TO_MILLIS.HOURS, "crimes");
					}
				} catch (error) {
					console.log("TT - Failed to load crimes from TornStats.", error);
					return;
				}
			}

			if (result.status) {
				for (const [user, value] of Object.entries(result.members)) {
					if (user in data) {
						data[user].nnb = value.natural_nerve;
						data[user].degree = !!value.psych_degree;
						data[user].federal_judge = !!value.federal_judge;
						data[user].merits = value.crime_success;
						data[user].verified = !!value.verified;
					} else {
						data[user] = {
							nnb: value.natural_nerve,
							degree: !!value.psych_degree,
							federal_judge: !!value.federal_judge,
							merits: value.crime_success,
							verified: !!value.verified,
						};
					}
				}
			}
		}

		async function loadYATA() {
			let result: YATAFactionMembers;
			if (ttCache.hasValue("crimes", "yata")) {
				result = ttCache.get<YATAFactionMembers>("crimes", "yata");
			} else {
				try {
					result = await fetchData<YATAFactionMembers>("yata", { section: "faction/crimes/export", includeKey: true, relay: true });

					ttCache.set({ yata: result }, TO_MILLIS.HOURS, "crimes");
				} catch (error) {
					console.log("TT - Failed to load crimes from YATA.", error);
					return;
				}
			}

			for (const [user, value] of Object.entries(result.members)) {
				if (!value.nnb) continue;

				if (user in data) {
					const { verified, nnb } = data[user];
					if (!verified && nnb !== value.nnb) data[user].nnb = value.nnb;
				} else {
					data[user] = {
						nnb: value.nnb,
						verified: true,
					};
				}
			}
		}
	}

	function populateCrimes() {
		for (const row of findAllElements(".organize-wrap .crimes-list .details-list > li > ul")) {
			findAllElements(`.level${mobile ? ", .member, .stat" : ""}`, row).forEach((element) => element.classList.add("tt-modified"));

			const stat = findElement(".stat", row);
			if (row.classList.contains("title")) {
				stat.parentElement.insertBefore(
					elementBuilder({
						type: "li",
						class: "tt-nnb",
						text: "NNB",
						children: [elementBuilder({ type: "div", class: "t-delimiter" })],
					}),
					stat,
				);
				continue;
			}

			const id = findElement(".h", row).getAttribute("href").split("XID=")[1];
			if (typeof data === "object" && id in data) {
				const { nnb, verified } = data[id];

				stat.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb", text: `${verified ? "" : "*"}${nnb}` }));
			} else {
				stat.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb", text: "N/A" }));
			}
		}
	}

	function populateSelection() {
		for (const row of findAllElements(".plans-list .item")) {
			findAllElements(`.offences${mobile ? ", .member, .level, .act" : ""}`, row).forEach((element) => element.classList.add("tt-modified"));

			const act = findElement(".act", row);
			if (row.classList.contains("title")) {
				act.parentElement.insertBefore(
					elementBuilder({
						type: "li",
						class: "tt-nnb short",
						text: "NNB",
						children: [elementBuilder({ type: "div", class: "t-delimiter" })],
					}),
					act,
				);
				continue;
			}

			const id = findElement(".h", row).getAttribute("href").split("XID=")[1];
			if (typeof data === "object" && id in data) {
				const { nnb, verified } = data[id];

				act.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb short", text: `${verified ? "" : "*"}${nnb}` }));
			} else {
				act.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb short", text: "N/A" }));
			}
		}
	}
}

export default class OCNNBFeature extends Feature {
	constructor() {
		super("OC NNB", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.ocNnb;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.ocNnb", "settings.external.yata"];
	}

	override async requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.yata && !settings.external.tornstats) return "YATA or TornStats not enabled";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}
}
