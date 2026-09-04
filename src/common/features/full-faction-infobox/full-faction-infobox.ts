import "./full-faction-infobox.css";
import { getFactionSubpage, isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
		if (!FEATURE_MANAGER.isEnabled(FullFactionInfoboxFeature)) return;

		await showFull();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_MAIN, async () => {
		if (!FEATURE_MANAGER.isEnabled(FullFactionInfoboxFeature)) return;

		await showFull();
	});
}

async function startFeature() {
	if (isInternalFaction && !findElement(".faction-description, .members-list, .announcement", true)) return;
	if (!isInternalFaction && (await isDestroyed())) return;

	await showFull();
}

async function showFull() {
	let title: Element | null, description: Element | null, key: string;

	if (isInternalFaction) {
		if (getFactionSubpage() === "info") {
			title = findElement(".faction-title", true);
			description = findElement(".faction-description", true);
			key = "faction_description_full";
		} else {
			title = findElement("#faction-main [data-title='announcement'][role='heading']", true);
			description = title?.nextElementSibling ?? null;
			key = "faction_announcement_full";
		}
	} else {
		title = await requireElement(".faction-title");
		description = findElement(".faction-description", true);
		key = "faction_description_full";
	}
	if (!title || !description || !key) return;
	if (title.classList.contains("tt-infobox-title")) return;

	title.classList.add("tt-infobox-title");

	const checkbox = createCheckbox({ description: "Show full page" });

	if (filters.containers[key]) {
		checkbox.setChecked(true);
		description.classList.add("prevent-overflow");
	}

	title.appendChild(elementBuilder({ type: "div", class: "tt-options tt-full-infobox", children: [checkbox.element] }));

	checkbox.onChange(() => {
		const isChecked = checkbox.isChecked();

		if (isChecked) description.classList.add("prevent-overflow");
		else description.classList.remove("prevent-overflow");

		ttStorage.change({ filters: { containers: { [key]: isChecked } } });
	});
}

export default class FullFactionInfoboxFeature extends Feature {
	constructor() {
		super("Full Infobox", "faction");
	}

	override precondition() {
		return getPageStatus().access && (isInternalFaction || getSearchParameters().get("step") === "profile");
	}

	override isEnabled() {
		return settings.pages.faction.showFullInfobox;
	}

	override initialise() {
		if (isInternalFaction) {
			initialiseListeners();
		}
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.showFullInfobox"];
	}
}
