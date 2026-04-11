import "./faction-stakeouts.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { getFactionSubpage, isInternalFaction } from "@/pages/factions-page";
import { factionStakeouts, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createCheckbox } from "@/utils/common/elements/checkbox/checkbox";
import { createTextbox } from "@/utils/common/elements/textbox/textbox";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FactionStakeoutsFeature)) return;

		await displayBox();
	});
}

async function displayBox() {
	if (isInternalFaction && getFactionSubpage() !== "info") return;

	const { content } = createContainer("Faction Stakeout", {
		class: "mt10",
		nextElement: await requireElement(".faction-info-wrap"),
	});

	const factionId = parseInt(
		(await requireElement(".faction-info-wrap .f-war-list .table-row [class*='factionWrap__'] a[href*='/factions.php']"))
			.getAttribute("href")
			.split("&ID=")[1],
	);
	const hasStakeout = factionId in factionStakeouts && typeof factionStakeouts[factionId] === "object" && typeof factionStakeouts[factionId] !== "number";

	const checkbox = createCheckbox({ description: "Stakeout this faction." });
	checkbox.setChecked(hasStakeout);
	checkbox.onChange(() => {
		if (checkbox.isChecked()) {
			ttStorage.change({
				factionStakeouts: {
					[factionId]: { alerts: { chainReaches: false, memberCountDrops: false, rankedWarStarts: false, inRaid: false, inTerritoryWar: false } },
				},
			});

			alertsWrap.classList.remove("tt-hidden");
		} else {
			ttStorage.change({ factionStakeouts: { [factionId]: undefined } });

			alertsWrap.classList.add("tt-hidden");
			findAllElements<HTMLInputElement>("input[type='text'], input[type='number']", content).forEach((input) => (input.value = ""));
			findAllElements<HTMLInputElement>("input[type='checkbox']", content).forEach((input) => (input.checked = false));
		}
	});
	content.appendChild(checkbox.element);

	const chainReaches = createTextbox({ description: { before: "chain reaches" }, type: "text", attributes: { min: "1" }, style: { width: "100px" } });
	chainReaches.onChange(() => {
		if (!(factionId in factionStakeouts)) return;

		let value: number | false = parseInt(chainReaches.getValue());
		if (Number.isNaN(value) || value < 0) value = false;

		ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { chainReaches: value } } } });
	});

	const memberCountDrops = createTextbox({
		description: { before: "member count drops below", after: "members" },
		type: "number",
		attributes: { min: "1" },
	});
	memberCountDrops.onChange(() => {
		if (!(factionId in factionStakeouts)) return;

		ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { memberCountDrops: parseInt(memberCountDrops.getValue()) || false } } } });
	});

	const rankedWarStarts = createCheckbox({ description: "ranked war" });
	rankedWarStarts.onChange(() => {
		if (!(factionId in factionStakeouts)) return;

		ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { rankedWarStarts: rankedWarStarts.isChecked() } } } });
	});

	const inRaid = createCheckbox({ description: "raid" });
	inRaid.onChange(() => {
		if (!(factionId in factionStakeouts)) return;

		ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { inRaid: inRaid.isChecked() } } } });
	});

	const inTerritoryWar = createCheckbox({ description: "territory war" });
	inTerritoryWar.onChange(() => {
		if (!(factionId in factionStakeouts)) return;

		ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { inTerritoryWar: inTerritoryWar.isChecked() } } } });
	});

	const alertsWrap = elementBuilder({
		type: "div",
		class: "alerts-wrap",
		children: [
			createAlertSection("General", [chainReaches.element, memberCountDrops.element]),
			createAlertSection("Wars", [rankedWarStarts.element, inRaid.element, inTerritoryWar.element]),
		],
	});

	if (factionId in factionStakeouts && typeof factionStakeouts[factionId] !== "number") {
		chainReaches.setNumberValue(factionStakeouts[factionId].alerts.chainReaches || "");
		memberCountDrops.setNumberValue(factionStakeouts[factionId].alerts.memberCountDrops || "");
		rankedWarStarts.setChecked(factionStakeouts[factionId].alerts.rankedWarStarts);
		inRaid.setChecked(factionStakeouts[factionId].alerts.inRaid);
		inTerritoryWar.setChecked(factionStakeouts[factionId].alerts.inTerritoryWar);
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
