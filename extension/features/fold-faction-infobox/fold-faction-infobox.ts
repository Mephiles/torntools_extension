import "./fold-faction-infobox.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { ttStorage } from "@/utils/common/data/storage";
import { getFactionSubpage, isInternalFaction } from "@/pages/factions-page";
import { PHFillCaretDown, PHFillCaretRight } from "@/utils/common/icons/phosphor-icons";

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FoldFactionInfoboxFeature)) return;

		await foldInfobox();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_MAIN].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(FoldFactionInfoboxFeature)) return;

		await foldInfobox();
	});
}

async function startFeature() {
	if (isInternalFaction && !document.querySelector(".faction-description, .members-list, .announcement")) return;

	await foldInfobox();
}

async function foldInfobox() {
	let title: Element, description: Element, key: string;

	if (isInternalFaction) {
		if (getFactionSubpage() === "info") {
			title = await requireElement(".faction-title");
			description = document.querySelector(".faction-description");
			key = "faction_description_fold";
		} else {
			title = await requireElement("#faction-main [data-title='announcement'][role='heading']");
			description = title.nextElementSibling;
			key = "faction_announcement_fold";
		}
	} else {
		title = await requireElement(".faction-title");
		description = document.querySelector(".faction-description");
		key = "faction_description_fold";
	}
	if (!title || !description || !key) return;
	if (title.classList.contains("tt-foldable-infobox")) return;

	title.classList.add("tt-foldable-infobox");
	description.classList.add("tt-foldable");

	const arrow = elementBuilder({ type: "svg", class: "tt-collapse-infobox" });

	title.appendChild(arrow);

	fold(!!filters.containers[key]);

	if (!title.classList.contains(`tt-${key}`)) {
		title.classList.add(`tt-${key}`);
		title.addEventListener("click", () => fold(null));
	}

	function fold(state: boolean | null) {
		if (!FEATURE_MANAGER.isEnabled(FoldFactionInfoboxFeature)) return;

		if (state === null) {
			state = description.classList.toggle("folded");
		} else {
			if (state) description.classList.add("folded");
			else description.classList.remove("folded");
		}

		if (state) {
			arrow.innerHTML = PHFillCaretRight().innerHTML;
			title.classList.add("folded");
		} else {
			arrow.innerHTML = PHFillCaretDown().innerHTML;
			title.classList.remove("folded");
		}

		ttStorage.change({ filters: { containers: { [key]: state } } });
	}
}

function removeFull() {
	for (const arrow of findAllElements(".tt-collapse-infobox")) arrow.remove();
	for (const title of findAllElements(".tt-foldable-infobox")) title.classList.remove("tt-foldable-infobox");
	for (const foldable of findAllElements(".tt-foldable, .folded")) foldable.classList.remove("tt-foldable", "folded");
}

export default class FoldFactionInfoboxFeature extends Feature {
	constructor() {
		super("Fold Infobox", "faction");
	}

	precondition() {
		return getPageStatus().access && (isInternalFaction || getSearchParameters().get("step") === "profile");
	}

	isEnabled() {
		return settings.pages.faction.foldableInfobox;
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
		return ["settings.pages.faction.foldableInfobox"];
	}
}
