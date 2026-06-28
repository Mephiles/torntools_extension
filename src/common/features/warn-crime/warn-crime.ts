import "./warn-crime.css";
import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasOC1Data } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getUserDetails } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const scenarioInformation = {};

function addListener() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2, async () => {
		if (!FEATURE_MANAGER.isEnabled(WarnCrimeFeature)) return;

		await disableButtons();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_REFRESH, async () => {
		if (!FEATURE_MANAGER.isEnabled(WarnCrimeFeature)) return;

		await disableButtons();
	});
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		if (sid !== "organizedCrimesData") return;

		const step = params.get("step");
		if (step !== "crimeList") return;

		if (!json.success) return;

		const playerId = getUserDetails().id;
		const slots = json.data.flatMap((crime) =>
			crime.playerSlots
				.filter((slot) => slot.player === null || slot.player.ID !== playerId)
				.map((slot) => ({
					scenario: {
						name: crime.scenario.name,
						level: crime.scenario.level,
					},
					name: slot.name,
					successChance: slot.successChance,
					hasItem: slot.requirement?.doesExist ?? null,
				})),
		);

		slots.forEach(({ scenario: { name: scenarioName }, ...slot }) => {
			if (!(scenarioName in scenarioInformation)) scenarioInformation[scenarioName] = {};
			if (!(slot.name in scenarioInformation[scenarioName])) scenarioInformation[scenarioName][slot.name] = {};

			scenarioInformation[scenarioName][slot.name] = {
				hasItem: slot.hasItem,
				successChance: slot.successChance,
			};
		});
	});
}

async function disableButtons() {
	const list = await requireElement(".tt-oc2-list");
	list.querySelectorAll("[class*='joinButton___']:not(.tt-warn-crime--processed)").forEach((button) => {
		button.classList.add("tt-warn-crime--processed");

		const scenarioElement = button.closest("[class*='contentLayer___']");
		const slotElement = button.closest("[class*='wrapper___']");

		const scenarioName = scenarioElement.querySelector("[class*='panelTitle___']").textContent;
		const position = slotElement.querySelector("[class*='title___']").textContent;

		const blocked: string[] = [];

		const information = scenarioInformation[scenarioName][position];
		if (information.hasItem === false) blocked.push("item");

		if (blocked.length) {
			// button.disabled = true;
			button.setAttribute("title", `The following requirements aren't met: ${blocked.join(", ")}`);
		}
	});
}

export default class WarnCrimeFeature extends Feature {
	constructor() {
		super("Warn Crime", "faction");
	}

	precondition() {
		return isInternalFaction;
	}

	requirements() {
		if (hasOC1Data()) return "Still on OC1.";

		return true;
	}

	isEnabled() {
		return settings.pages.faction.warnCrime;
	}

	storageKeys(): string[] {
		return ["settings.pages.faction.warnCrime"];
	}

	initialise() {
		addListener();
	}

	async execute() {
		if (getFactionSubpage() !== "crimes") return;

		await disableButtons();
	}
}
