import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import "./last-action.css";
import { isInternalFaction, readFactionDetails } from "@common/pages/factions-page";

import { ttCache } from "@utils/data/cache";
import { settings } from "@utils/data/database";
import { fetchData, hasAPIData } from "@utils/functions/api";
import { elementBuilder, findAllElements } from "@utils/functions/dom";
import { dropDecimals } from "@utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { getUsername } from "@utils/functions/torn";
import { TO_MILLIS } from "@utils/functions/utilities";
import type { FactionMember, FactionMembersResponse } from "tornapi-typescript";

let _members: FactionMember[] | undefined;

function addListener() {
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

			await addLastAction(true);
		});
	}
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async ({ hasResults }) => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		if (hasResults) await addLastAction(true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		await addLastAction(true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(LastActionFactionFeature)) return;

		removeLastAction();
		await addLastAction(true);
	});
}

async function addLastAction(force: boolean) {
	if (isInternalFaction && !force) return;
	if (document.querySelector(".tt-last-action")) return;

	await requireElement(".members-list .table-body > li");

	const id = isInternalFaction ? "own" : (await readFactionDetails()).id;
	if (!id) return;

	const members = await loadMembers(id);

	const list = document.querySelector(".members-list .table-body");
	if (!list) return;

	list.classList.add("tt-modified");
	const nowDate = Date.now();
	let maxHours = 0;
	findAllElements(":scope > li.table-row", list).forEach((row) => {
		// Don't show this for fallen players.
		if (row.querySelector(".icons li[id*='icon77___']")) return;

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
						succeedOnError: true,
					})
				).members;

				ttCache.set({ [id]: _members }, TO_MILLIS.SECONDS * 30, "faction-members").then(() => {});
			}
		}

		return _members;
	}
}

function removeLastAction() {
	const list = document.querySelector(".members-list .table-body.tt-modified");
	if (list) {
		findAllElements(":scope > div.tt-last-action", list).forEach((x) => x.remove());
		list.classList.remove("tt-modified");
	}
}

export default class LastActionFactionFeature extends Feature {
	constructor() {
		super("Last Action Faction", "last action");
	}

	isEnabled(): boolean {
		return settings.scripts.lastAction.factionMember;
	}

	requirements() {
		if (!hasAPIData()) return "No API access!";

		return true;
	}

	initialise() {
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addLastAction(liveReload);
	}

	cleanup() {
		removeLastAction();
	}

	storageKeys(): string[] {
		return ["settings.scripts.lastAction.factionMember"];
	}

	shouldTriggerEvents(): boolean {
		return true;
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
