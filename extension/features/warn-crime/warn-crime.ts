import "./warn-crime.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { addFetchListener, CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getUserDetails } from "@/utils/common/functions/torn";

const scenarioInformation = {};

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(WarnCrimeFeature)) return;

		await disableButtons();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES2_REFRESH].push(async () => {
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
	const list: Element = await requireElement(".tt-oc2-list");
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
		await disableButtons();
	}
}
