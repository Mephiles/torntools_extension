import "./member-info.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { fetchData, hasFactionAPIAccess } from "@/utils/common/functions/api";
import { getUsername } from "@/utils/common/functions/torn";
import { formatNumber } from "@/utils/common/functions/formatting";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { ttCache } from "@/utils/common/data/cache";
import { isInternalFaction } from "@/pages/factions-page";
import { FactionBalance, FactionBalanceResponse } from "tornapi-typescript";

let lastActionState: boolean;

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(MemberInfoFeature)) return;

		await addInfo(true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MemberInfoFeature)) return;

		if (name === "Last Action") {
			lastActionState = true;
			await addInfo(true);
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
		if (!FEATURE_MANAGER.isEnabled(MemberInfoFeature)) return;

		if (name === "Last Action") {
			lastActionState = false;
			await addInfo(true);
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async ({ hasResults }) => {
		if (!FEATURE_MANAGER.isEnabled(MemberInfoFeature)) return;

		removeInfo();
		if (hasResults) await addInfo(true);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(MemberInfoFeature)) return;

		removeInfo();
		await addInfo(true);
	});
}

async function addInfo(force: boolean) {
	if (!force) return;
	removeInfo();

	await requireElement(".members-list .table-body > li");
	if (lastActionState) await requireElement(".members-list .table-body.tt-modified > .tt-last-action");

	let balance: FactionBalance;
	if (ttCache.hasValue("faction-members-balance", userdata.faction.id)) {
		balance = ttCache.get<FactionBalance>("faction-members-balance", userdata.faction.id);
	} else {
		balance = (await fetchData<FactionBalanceResponse>("tornv2", { section: "faction", selections: ["balance"], silent: true, succeedOnError: true }))
			.balance;

		ttCache.set({ [userdata.faction.id]: balance }, TO_MILLIS.SECONDS * 60, "faction-members-balance").then(() => {});
	}

	if (!balance) {
		console.log("TT - Failed to load faction balance.");
		return;
	}

	findAllElements(".members-list .table-body > li").forEach((li) => {
		const userID = getUsername(li).id;
		const userBalance = balance.members.find((m) => m.id === userID);
		if (!userBalance || (!userBalance.points && !userBalance.money)) return;

		// Don't show this for fallen players.
		if (li.querySelector(".icons li[id*='icon77___']")) return;

		const nextSibling = li.nextSibling as HTMLElement | undefined;

		const memberInfo = elementBuilder({ type: "div", class: "tt-member-info" });
		const parent = lastActionState && nextSibling?.className?.includes("tt-last-action") ? li.nextSibling : memberInfo;

		if (userBalance.points) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-points-balance",
					text: `Point Balance: ${formatNumber(userBalance.points)}`,
				})
			);
		}
		if (userBalance.money) {
			parent.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-money-balance",
					text: `Money Balance: ${formatNumber(userBalance.money, { currency: true })}`,
				})
			);
		}

		if (lastActionState && nextSibling?.className?.includes("tt-last-action")) {
			nextSibling.classList.add("tt-modified");
		} else if (memberInfo.hasChildNodes()) {
			li.insertAdjacentElement("afterend", memberInfo);
		}
	});
}

function removeInfo() {
	findAllElements(".tt-member-info, .tt-points-balance, .tt-money-balance").forEach((x) => x.remove());
	findAllElements(".tt-last-action.tt-modified").forEach((x) => x.classList.remove("modified"));
}

export default class MemberInfoFeature extends Feature {
	constructor() {
		super("Member Info", "faction");
	}

	precondition() {
		return isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.memberInfo;
	}

	requirements() {
		if (!hasFactionAPIAccess()) return "No Faction API access!";
		return true;
	}

	initialise() {
		addListener();
	}

	async execute() {
		lastActionState = settings.scripts.lastAction.factionMember;
		await addInfo(false);
	}

	cleanup() {
		removeInfo();
	}

	storageKeys() {
		return ["settings.pages.faction.memberInfo"];
	}

	shouldLiveReload() {
		return true;
	}
}
