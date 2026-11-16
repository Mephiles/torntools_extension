import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { addFetchListener } from "@common/utils/functions/listeners.ts";
import { requireElement } from "@common/utils/functions/requires";
import type { UserActivityStatus } from "@common/utils/functions/torn";
import { getUserActivity } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./faction-war-online-counts.module.css";

function initialiseListeners() {
	document.addEventListener("click", async (event) => {
		const rankedWarItem = (event.target as Element).closest("[class*='warListItem__']");
		if (!rankedWarItem || !findElement(":scope > [data-warid]", rankedWarItem, true)) return;

		await displayAllCounters();
	});

	addFetchListener(async ({ detail: { page, fetch } }) => {
		if (!location.hash.includes("#/war/rank")) return;

		const params = new URL(fetch.url).searchParams;
		if ((page === "page" && params.get("sid") === "factionsUsers") || (page === "faction_wars" && params.get("step") === "getwarusers")) {
			await displayAllCounters();
		}
	});
}

async function displayAllCounters(root?: ParentNode) {
	if (location.hash.includes("#/war/rank")) root = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war");
	if (!root) return;

	findAllElements(".members-cont", root).forEach(displayCounter);
}

function displayCounter(side: HTMLElement) {
	const counts = countRows(findAllElements(".members-list > li", side));

	const text = `Online: ${counts.online} · Idle: ${counts.idle} · Offline: ${counts.offline}`;
	const existing = findElement(`.${styles.warCount}`, side.parentElement!, true);
	if (existing) {
		existing.textContent = text;
	} else {
		side.insertAdjacentElement("beforebegin", elementBuilder({ type: "div", class: styles.warCount, text }));
	}
}

function countRows(rows: HTMLElement[]) {
	return rows
		.map(getUserActivity)
		.filter((status) => status !== "")
		.reduce<Record<UserActivityStatus, number>>(
			(acc, status) => {
				acc[status]++;
				return acc;
			},
			{ offline: 0, idle: 0, online: 0 },
		);
}

export default class FactionWarOnlineCountsFeature extends Feature {
	constructor() {
		super("Faction War Online Counts", "faction");
	}

	override isEnabled(): boolean {
		return settings.pages.faction.warOnlineStatus;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await displayAllCounters();
	}

	override storageKeys(): string[] {
		return ["settings.pages.faction.warOnlineStatus"];
	}
}
