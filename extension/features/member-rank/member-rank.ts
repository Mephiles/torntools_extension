import "./member-rank.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { getFactionSubpage, isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

function addListener() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(MemberRankFeature)) return;

			await addNumbers(true);
		});
	}

	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(MemberRankFeature)) return;

		removeNumbers();
		await addNumbers(true);
	});
}

async function addNumbers(force: boolean) {
	if (!force && isInternalFaction && getFactionSubpage() !== "info") return;

	if (document.querySelector(".tt-member-index")) return;
	await requireElement(".faction-info-wrap .table-body > .table-row");

	const list = document.querySelector(".faction-info-wrap .members-list");
	if (list.classList.contains("tt-modified")) return;
	list.classList.add("tt-modified");

	let reduced = 0;
	findAllElements(".table-body > .table-row", list).forEach((row, index) => {
		let text: string;
		if (row.querySelector(".icons li[id*='icon77___']")) {
			text = "-";
			reduced++;
		} else {
			text = (index + 1 - reduced).toString();
		}

		row.insertAdjacentElement("afterbegin", elementBuilder({ type: "div", class: "tt-member-index", text }));
	});
}

function removeNumbers() {
	findAllElements(".tt-member-index").forEach((element) => element.remove());
	document.querySelector(".faction-info-wrap .members-list.tt-modified")?.classList.remove("tt-modified");
}

export default class MemberRankFeature extends Feature {
	constructor() {
		super("Member Rank", "faction");
	}

	isEnabled() {
		return settings.pages.faction.numberMembers;
	}

	initialise() {
		addListener();
	}

	async execute() {
		await addNumbers(false);
	}

	cleanup() {
		removeNumbers();
	}

	storageKeys() {
		return ["settings.pages.faction.numberMembers"];
	}
}
