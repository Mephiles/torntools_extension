import "./faction-stakeouts.css";
import { getFactionSubpage, isDestroyed, isInternalFaction, readFactionDetails } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { factionStakeouts, settings } from "@common/utils/data/database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionStakeoutsFeature)) return;

		await displayBox();
	});
}

async function displayBox() {
	if (isInternalFaction && getFactionSubpage() !== "info") return;

	const { container, content } = createContainer("Faction Stakeout", {
		class: "mt10",
		nextElement: await requireElement(".faction-info-wrap"),
	});
	isDestroyed().then((destroyed) => {
		if (destroyed) container.classList.add("mb10");
	});

	const details = await readFactionDetails();
	if (!details) throw new Error("Faction ID could not be found.");

	const factionId = details.id;
	const existingStakeout = factionStakeouts.list.find((e) => e.id === factionId);

	const checkbox = createCheckbox({ description: "Stakeout this faction." });
	checkbox.setChecked(!!existingStakeout);
	checkbox.onChange(() => {
		if (checkbox.isChecked()) {
			factionStakeouts.list.push({
				id: factionId,
				order: Date.now(),
				alerts: { chainReaches: false, memberCountDrops: false, rankedWarStarts: false, inRaid: false, inTerritoryWar: false },
				info: {
					name: String(factionId),
					chain: 0,
					respect: 1,
					members: { current: 0, maximum: 0 },
					rankedWar: false,
					raid: false,
					territoryWar: false,
				},
			});
			ttStorage.set({ factionStakeouts });

			alertsWrap.classList.remove("tt-hidden");
		} else {
			factionStakeouts.list = factionStakeouts.list.filter((e) => e.id !== factionId);
			ttStorage.set({ factionStakeouts });

			alertsWrap.classList.add("tt-hidden");
			findAllElements<HTMLInputElement>("input[type='text'], input[type='number']", content).forEach((input) => (input.value = ""));
			findAllElements<HTMLInputElement>("input[type='checkbox']", content).forEach((input) => (input.checked = false));
		}
	});
	content.appendChild(checkbox.element);

	const chainReaches = createTextbox({ description: { before: "chain reaches" }, type: "text", attributes: { min: "1" }, style: { width: "100px" } });
	chainReaches.onChange(() => {
		const entry = factionStakeouts.list.find((e) => e.id === factionId);
		if (!entry) return;

		let value: number | false = parseInt(chainReaches.getValue());
		if (Number.isNaN(value) || value < 0) value = false;

		entry.alerts.chainReaches = value;
		ttStorage.set({ factionStakeouts });
	});

	const memberCountDrops = createTextbox({
		description: { before: "member count drops below", after: "members" },
		type: "number",
		attributes: { min: "1" },
	});
	memberCountDrops.onChange(() => {
		const entry = factionStakeouts.list.find((e) => e.id === factionId);
		if (!entry) return;

		entry.alerts.memberCountDrops = parseInt(memberCountDrops.getValue()) || false;
		ttStorage.set({ factionStakeouts });
	});

	const rankedWarStarts = createCheckbox({ description: "ranked war" });
	rankedWarStarts.onChange(() => {
		const entry = factionStakeouts.list.find((e) => e.id === factionId);
		if (!entry) return;

		entry.alerts.rankedWarStarts = rankedWarStarts.isChecked();
		ttStorage.set({ factionStakeouts });
	});

	const inRaid = createCheckbox({ description: "raid" });
	inRaid.onChange(() => {
		const entry = factionStakeouts.list.find((e) => e.id === factionId);
		if (!entry) return;

		entry.alerts.inRaid = inRaid.isChecked();
		ttStorage.set({ factionStakeouts });
	});

	const inTerritoryWar = createCheckbox({ description: "territory war" });
	inTerritoryWar.onChange(() => {
		const entry = factionStakeouts.list.find((e) => e.id === factionId);
		if (!entry) return;

		entry.alerts.inTerritoryWar = inTerritoryWar.isChecked();
		ttStorage.set({ factionStakeouts });
	});

	const alertsWrap = elementBuilder({
		type: "div",
		class: "alerts-wrap",
		children: [
			createAlertSection("General", [chainReaches.element, memberCountDrops.element]),
			createAlertSection("Wars", [rankedWarStarts.element, inRaid.element, inTerritoryWar.element]),
		],
	});

	if (existingStakeout) {
		chainReaches.setNumberValue(existingStakeout.alerts.chainReaches || "");
		memberCountDrops.setNumberValue(existingStakeout.alerts.memberCountDrops || "");
		rankedWarStarts.setChecked(existingStakeout.alerts.rankedWarStarts);
		inRaid.setChecked(existingStakeout.alerts.inRaid);
		inTerritoryWar.setChecked(existingStakeout.alerts.inTerritoryWar);
	} else {
		alertsWrap.classList.add("tt-hidden");
	}

	content.appendChild(alertsWrap);

	function createAlertSection(title: string, elements: Element[]) {
		return elementBuilder({
			type: "div",
			class: "alerts",
			children: [elementBuilder({ type: "strong", text: title }), ...elements],
		});
	}
}

function removeBox() {
	removeContainer("Faction Stakeout");
}

export default class FactionStakeoutsFeature extends Feature {
	constructor() {
		super("Faction Stakeouts", "faction");
	}

	precondition() {
		return getPageStatus().access && (isInternalFaction || getSearchParameters().get("step") === "profile");
	}

	isEnabled() {
		return settings.pages.faction.stakeout;
	}

	initialise() {
		if (isInternalFaction) {
			initialiseListeners();
		}
	}

	async execute() {
		if (isInternalFaction && !document.querySelector(".faction-description")) return;

		await displayBox();
	}

	cleanup() {
		removeBox();
	}

	storageKeys() {
		return ["settings.pages.faction.stakeout"];
	}
}
