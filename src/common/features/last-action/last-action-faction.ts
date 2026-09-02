import "./last-action.css";
import { isDestroyed, isInternalFaction, readFactionDetails } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { dropDecimals } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getUsername } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { FactionMember, FactionMembersResponse } from "tornapi-typescript";

let _members: FactionMember[] | undefined;

function addListener() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

			await addLastAction(true);
		});
	}
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, async ({ hasResults }) => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		if (hasResults) await addLastAction(true);
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_SORT, async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		await addLastAction(true);
	});
	addCustomListener(EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE, async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		await addLastAction(true);
	});
}

async function addLastAction(force: boolean) {
	if (isInternalFaction && !force) return;
	if (!isInternalFaction && (await isDestroyed())) return;
	if (findElement(".tt-last-action", true)) return;

	await requireElement(".members-list .table-body > li");

	const id = isInternalFaction ? "own" : (await readFactionDetails()).id;
	if (!id) return;

	const members = await loadMembers(id);

	const list = findElement(".members-list .table-body", true);
	if (!list) return;

	list.classList.add("tt-modified");
	const nowDate = Date.now();
	let maxHours = 0;
	findAllElements(":scope > li.table-row", list).forEach((row) => {
		// Don't show this for fallen players.
		if (findElement(".icons li[id*='icon77___']", row, true)) return;

		const userID = getUsername(row).id;
		const member = members.find((m) => m.id === userID);
		if (!member) return;
		const hours = dropDecimals((nowDate - member.last_action.timestamp * 1000) / TO_MILLIS.HOURS);

		const element = elementBuilder({
			type: "div",
			class: "tt-last-action",
			text: `Last action: ${member.last_action.relative}`,
			attributes: {
				hours: hours,
			},
		});
		if (row.classList.contains("tt-hidden")) element.classList.add("tt-hidden");

		row.insertAdjacentElement("afterend", element);
		if (hours > maxHours) maxHours = hours;
	});
	list.setAttribute("max-hours", maxHours.toString());

	async function loadMembers(id: number | "own") {
		if (!_members) {
			if (ttCache.hasValue("faction-members", id)) {
				_members = ttCache.get<FactionMember[]>("faction-members", id);
			} else {
				_members = (
					await fetchData<FactionMembersResponse>("tornv2", {
						section: "faction",
						...(Number.isNaN(parseInt(id.toString())) ? {} : { id }),
						selections: ["members"],
						silent: true,
					})
				).members;

				ttCache.set({ [id]: _members }, TO_MILLIS.SECONDS * 30, "faction-members");
			}
		}

		return _members;
	}
}

function removeLastAction() {
	const list = findElement(".members-list .table-body.tt-modified", true);
	if (list) {
		findAllElements(":scope > div.tt-last-action", list).forEach((x) => x.remove());
		list.classList.remove("tt-modified");
	}
}

export default class LastActionFactionFeature extends Feature {
	constructor() {
		super("Last Action Faction", "last action");
	}

	override isEnabled(): boolean {
		return settings.scripts.lastAction.factionMember;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access!";

		return true;
	}

	override initialise() {
		addListener();
	}

	override async execute() {
		await addLastAction(false);
	}

	override async reload() {
		await addLastAction(true);
	}

	override storageKeys(): string[] {
		return ["settings.scripts.lastAction.factionMember"];
	}

	override shouldTriggerEvents(): boolean {
		return true;
	}
}
