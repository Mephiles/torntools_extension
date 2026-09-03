import "./member-inactivity-warning.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber, dropDecimals } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

let lastActionState: boolean;

function addListener() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature)) return;

			await addWarning(true);
		});
	}
	addCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature) || name !== "Last Action") return;

		lastActionState = true;
		await addWarning(true);
	});
	addCustomListener(EVENT_CHANNELS.FEATURE_RELOADED, async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature) || name !== "Last Action") return;

		lastActionState = true;
		await addWarning(true);
	});

	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature)) return;

		await addWarning(true);
	});
}

async function addWarning(force: boolean) {
	if (!force || !lastActionState) return;

	await requireElement(".tt-last-action");

	for (const row of findAllElements(".members-list .table-body > li")) {
		if (!row.nextElementSibling!.classList.contains("tt-last-action")) continue;
		// Skip users that are confirmed to be dead IRL.
		if (findElement("[id*='icon77___']", row, true)) continue;

		const days = dropDecimals(convertToNumber(row.nextElementSibling!.getAttribute("hours")) / 24);

		for (const warning of settings.factionInactivityWarning) {
			if (warning.days === null || days < warning.days) continue;

			row.style.setProperty("--tt-inactive-background", warning.color);
			row.classList.add("tt-inactive");
		}
	}
}

export default class FactionInactivityWarningFeature extends Feature {
	constructor() {
		super("Member Inactivity Warning", "faction");
	}

	override isEnabled(): boolean {
		return !!settings.factionInactivityWarning.filter((warning) => warning.days !== null).length;
	}

	override initialise() {
		lastActionState = settings.scripts.lastAction.factionMember;
		addListener();
	}

	override async execute() {
		await addWarning(false);
	}

	override async reload() {
		await addWarning(true);
	}

	override storageKeys(): string[] {
		return ["settings.factionInactivityWarning"];
	}
}
