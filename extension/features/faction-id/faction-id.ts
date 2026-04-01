import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { isInternalFaction, readFactionDetails } from "@/pages/factions-page";

function initialise() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(FactionIDFeature) || !settings.pages.faction.idBesideFactionName) return;

			await addID();
		});
	}
}

async function addID() {
	if (document.getElementById("tt-faction-id")) return;

	const container = await requireElement(".faction-info-wrap > .title-black");

	const details = await readFactionDetails();
	if (!details) throw new Error("Faction ID could not be found.");

	if (document.getElementById("tt-faction-id")) return;

	container.appendChild(elementBuilder({ type: "span", text: ` [${details.id}]`, id: "tt-faction-id" }));
}

function removeID() {
	findAllElements("#tt-faction-id").forEach((element) => element.remove());
}

export default class FactionIDFeature extends Feature {
	constructor() {
		super("Faction ID", "faction");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.faction.idBesideFactionName;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await addID();
	}

	cleanup() {
		removeID();
	}

	storageKeys() {
		return ["settings.pages.faction.idBesideFactionName"];
	}
}
