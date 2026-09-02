import "./member-rank.css";
import { getFactionSubpage, isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

function addListener() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(MemberRankFeature)) return;

			await addNumbers(true);
		});
	}

	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, async () => {
		if (!FEATURE_MANAGER.isEnabled(MemberRankFeature)) return;

		removeNumbers();
		await addNumbers(true);
	});
}

async function addNumbers(force: boolean) {
	if (!force && isInternalFaction && getFactionSubpage() !== "info") return;
	if (!isInternalFaction && (await isDestroyed())) return;

	if (findElement(".tt-member-index", true)) return;
	await requireElement(".faction-info-wrap .table-body > .table-row");

	const list = findElement(".faction-info-wrap .members-list");
	if (list.classList.contains("tt-modified")) return;
	list.classList.add("tt-modified");

	let reduced = 0;
	findAllElements(".table-body > .table-row", list).forEach((row, index) => {
		let text: string;
		if (findElement(".icons li[id*='icon77___']", row, true)) {
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
	findElement(".faction-info-wrap .members-list.tt-modified", true)?.classList.remove("tt-modified");
}

export default class MemberRankFeature extends Feature {
	constructor() {
		super("Member Rank", "faction");
	}

	override isEnabled() {
		return settings.pages.faction.numberMembers;
	}

	override initialise() {
		addListener();
	}

	override async execute() {
		await addNumbers(false);
	}

	override storageKeys() {
		return ["settings.pages.faction.numberMembers"];
	}
}
