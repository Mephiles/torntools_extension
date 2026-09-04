import { isDestroyed, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUsername } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import type { ScouterResult, ScouterService } from "@features/ff-scouter/ff-scouter";
import { contrastFFColor, ffColor, scouterService } from "@features/ff-scouter/ff-scouter";

let SCOUTER_SERVICE: ScouterService;

function initialise() {
	if (isInternalFaction) {
		addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
			if (!FEATURE_MANAGER.isEnabled(FFScouterFactionFeature)) return;

			await showFF(true);
		});
	}
}

async function showFF(force: boolean) {
	if (isInternalFaction && !force) return;
	if (!isInternalFaction && (await isDestroyed())) return;

	await requireElement(".members-list .table-body > li");

	const list = findElement(".members-list .table-body");

	const memberIds = findAllElements<HTMLAnchorElement>("[class*='honorWrap___'] a[class*='linkWrap___']", list).map((link) =>
		parseInt(new URL(link.href).searchParams.get("XID")!),
	);

	SCOUTER_SERVICE.scoutGroup(memberIds)
		.then((scouts) => {
			list.classList.add("tt-modified-ff-scouter");

			const header = elementBuilder({
				type: "li",
				class: ["table-cell", "lvl", "torn-divider", "divider-vertical", "tt-ff-scouter-faction-list-header"],
				text: "FF",
				attributes: { tabindex: "0" },
			});
			findElement(".table-header > .lvl").insertAdjacentElement("afterend", header);

			fillFF(list, Object.values(scouts));
		})
		.catch((reason) => {
			console.error("TT - Failed to scout ff for the faction.", reason);
		});
}

function fillFF(list: Element, results: ScouterResult[]) {
	findAllElements(":scope > li.table-row", list).forEach((row) => {
		// Don't show this for fallen players.
		if (findElement(".icons li[id*='icon77___']", row, true)) {
			row.dataset.ffScout = "N/A";
			return;
		}

		const userID = getUsername(row).id;
		const scout = results.find((r) => r.player_id === userID);
		if (!scout || "message" in scout || scout.fair_fight === null) {
			row.dataset.ffScout = "N/A";
			findElement(".table-cell.lvl", row).insertAdjacentElement(
				"afterend",
				elementBuilder({
					type: "li",
					class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
					text: "N/A",
				}),
			);
			return;
		}

		const ff = scout.fair_fight;
		row.dataset.ffScout = ff.toString();

		const backgroundColor = ffColor(ff);
		const textColor = contrastFFColor(backgroundColor);

		findElement(".table-cell.lvl", row).insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "li",
				class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
				text: ff.toFixed(2),
				style: {
					backgroundColor: backgroundColor,
					color: textColor,
				},
			}),
		);
	});
	triggerCustomListener(EVENT_CHANNELS.FF_SCOUTER_FACTION_LIST);
}

export default class FFScouterFactionFeature extends Feature {
	constructor() {
		super("FF Scouter Faction", "ff-scouter");
	}

	override precondition(): boolean {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.ffScouter) return "FFScouter not enabled.";

		return true;
	}

	override isEnabled(): boolean {
		return settings.scripts.ffScouter.factionList;
	}

	override initialise() {
		SCOUTER_SERVICE = scouterService()!;
		initialise();
	}

	override async execute() {
		await showFF(false);
	}

	override storageKeys(): string[] {
		return ["settings.scripts.ffScouter.factionList", "settings.external.ffScouter"];
	}
}
