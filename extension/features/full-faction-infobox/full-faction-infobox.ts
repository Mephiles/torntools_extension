import "./full-faction-infobox.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { ttStorage } from "@/utils/common/data/storage";
import { createCheckbox } from "@/utils/common/elements/checkbox/checkbox";
import { getFactionSubpage, isInternalFaction } from "@/pages/factions-page";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FullFactionInfoboxFeature)) return;

		await showFull();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FullFactionInfoboxFeature)) return;

		await showFull();
	});
}

async function startFeature() {
	if (isInternalFaction && !document.querySelector(".faction-description, .members-list, .announcement")) return;

	await showFull();
}

async function showFull() {
	let title: Element, description: Element, key: string;

	if (isInternalFaction) {
		if (getFactionSubpage() === "info") {
			title = document.querySelector(".faction-title");
			description = document.querySelector(".faction-description");
			key = "faction_description_full";
		} else {
			title = document.querySelector("#faction-main [data-title='announcement'][role='heading']");
			description = title?.nextElementSibling;
			key = "faction_announcement_full";
		}
	} else {
		title = await requireElement(".faction-title");
		description = document.querySelector(".faction-description");
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

function removeFull() {
	for (const infobox of findAllElements(".tt-full-infobox")) infobox.remove();
	for (const title of findAllElements(".tt-infobox-title")) title.classList.remove("tt-infobox-title");
	for (const overflow of findAllElements(".prevent-overflow")) overflow.classList.remove("prevent-overflow");
}

export default class FullFactionInfoboxFeature extends Feature {
	constructor() {
		super("Full Infobox", "faction");
	}

	precondition() {
		return getPageStatus().access && (isInternalFaction || getSearchParameters().get("step") === "profile");
	}

	isEnabled() {
		return settings.pages.faction.showFullInfobox;
	}

	initialise() {
		if (isInternalFaction) {
			initialiseListeners();
		}
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeFull();
	}

	storageKeys() {
		return ["settings.pages.faction.showFullInfobox"];
	}
}
