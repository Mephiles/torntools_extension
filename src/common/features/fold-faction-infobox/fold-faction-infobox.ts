import "./fold-faction-infobox.css";
import { getFactionSubpage, isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { findAllElements, getSearchParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { PHFillCaretDown, PHFillCaretRight } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
		if (!FEATURE_MANAGER.isEnabled(FoldFactionInfoboxFeature)) return;

		await foldInfobox();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_MAIN, async () => {
		if (!FEATURE_MANAGER.isEnabled(FoldFactionInfoboxFeature)) return;

		await foldInfobox();
	});
}

async function startFeature() {
	if (isInternalFaction && !document.querySelector(".faction-description, .members-list, .announcement")) return;
	if (!isInternalFaction && (await isDestroyed())) return;

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

	const arrow = PHFillCaretRight({ class: "tt-collapse-infobox", size: "15px" });

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
