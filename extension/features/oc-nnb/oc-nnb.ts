import "./oc-nnb.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { elementBuilder, findAllElements, mobile } from "@/utils/common/functions/dom";
import { FETCH_PLATFORMS, fetchData, hasAPIData, hasOC1Data } from "@/utils/common/functions/api";
import { settings } from "@/utils/common/data/database";
import { ttCache } from "@/utils/common/data/cache";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import type { TornstatsFactionCrimes, YATAFactionMembers } from "@/utils/common/functions/api.types";
import { isInternalFaction } from "@/pages/factions-page";

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
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(OCNNBFeature)) return;

		await showNNB();
	});
}

async function startFeature() {
	if (!document.querySelector(".faction-crimes-wrap")) return;

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
					result = await fetchData<TornstatsFactionCrimes>(FETCH_PLATFORMS.tornstats, { section: "faction/crimes", relay: true });

					if (result.status) {
						ttCache.set({ tornstats: result }, TO_MILLIS.HOURS, "crimes").then(() => {});
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

					ttCache.set({ yata: result }, TO_MILLIS.HOURS, "crimes").then(() => {});
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

			const stat = row.querySelector(".stat");
			if (row.classList.contains("title")) {
				stat.parentElement.insertBefore(
					elementBuilder({
						type: "li",
						class: "tt-nnb",
						text: "NNB",
						children: [elementBuilder({ type: "div", class: "t-delimiter" })],
					}),
					stat
				);
				continue;
			}

			const id = row.querySelector(".h").getAttribute("href").split("XID=")[1];
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

			const act = row.querySelector(".act");
			if (row.classList.contains("title")) {
				act.parentElement.insertBefore(
					elementBuilder({
						type: "li",
						class: "tt-nnb short",
						text: "NNB",
						children: [elementBuilder({ type: "div", class: "t-delimiter" })],
					}),
					act
				);
				continue;
			}

			const id = row.querySelector(".h").getAttribute("href").split("XID=")[1];
			if (typeof data === "object" && id in data) {
				const { nnb, verified } = data[id];

				act.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb short", text: `${verified ? "" : "*"}${nnb}` }));
			} else {
				act.insertAdjacentElement("beforebegin", elementBuilder({ type: "li", class: "tt-nnb short", text: "N/A" }));
			}
		}
	}
}

function removeNNBs() {
	for (const nnb of findAllElements(".tt-nnb")) nnb.remove();
	for (const nnb of findAllElements(".crimes-list ul.plans-list .tt-modified")) nnb.remove();
}

export default class OCNNBFeature extends Feature {
	constructor() {
		super("OC NNB", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.ocNnb;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeNNBs();
	}

	storageKeys() {
		return ["settings.pages.faction.ocNnb", "settings.external.yata"];
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.yata && !settings.external.tornstats) return "YATA or TornStats not enabled";
		else if (!hasOC1Data()) return "No OC 1 data.";

		return true;
	}
}
