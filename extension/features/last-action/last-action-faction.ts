import "./last-action.css";
import type { FactionMember, FactionMembersResponse } from "tornapi-typescript";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction, readFactionDetails } from "@/pages/factions-page";
import { ttCache } from "@/utils/common/data/cache";
import { settings } from "@/utils/common/data/database";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { dropDecimals } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getUsername } from "@/utils/common/functions/torn";
import { TO_MILLIS } from "@/utils/common/functions/utilities";

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
