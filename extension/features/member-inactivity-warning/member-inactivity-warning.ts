import "./member-inactivity-warning.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber, dropDecimals } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

let lastActionState: boolean;

function addListener() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature)) return;

			await addWarning(true);
		});
	}
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
		if (FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature) && name === "Last Action") {
			lastActionState = true;
			await addWarning(true);
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature)) return;

		if (name === "Last Action") {
			lastActionState = false;
			removeWarning();
		}
	});

	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionInactivityWarningFeature)) return;

		await addWarning(true);
	});
}

async function addWarning(force: boolean) {
	if (!force || !lastActionState) return;

	await requireElement(".tt-last-action");

	for (const row of findAllElements(".members-list .table-body > li")) {
		if (!row.nextElementSibling.classList.contains("tt-last-action")) continue;
		// Skip users that are confirmed to be dead IRL.
		if (row.querySelector("[id*='icon77___']")) continue;

		const days = dropDecimals(convertToNumber(row.nextElementSibling.getAttribute("hours")) / 24);

		for (const warning of settings.factionInactivityWarning) {
			if (warning.days === null || days < warning.days) continue;

			row.style.setProperty("--tt-inactive-background", warning.color);
			row.classList.add("tt-inactive");
		}
	}
}

function removeWarning() {
	findAllElements(".tt-inactive").forEach((inactive) => {
		inactive.style.removeProperty("--tt-inactive-background");
		inactive.classList.remove("tt-inactive");
	});
}

export default class FactionInactivityWarningFeature extends Feature {
	constructor() {
		super("Member Inactivity Warning", "faction");
	}

	isEnabled(): boolean {
		return !!settings.factionInactivityWarning.filter((warning) => warning.days !== null).length;
	}

	initialise() {
		lastActionState = settings.scripts.lastAction.factionMember;
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addWarning(liveReload);
	}

	cleanup() {
		removeWarning();
	}

	storageKeys(): string[] {
		return ["settings.factionInactivityWarning"];
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
