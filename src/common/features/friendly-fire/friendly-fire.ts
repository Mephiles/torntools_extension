import "./friendly-fire.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { isIntNumber } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

async function addWarning() {
	if (findElement(".tt-ally-warning", true)) findElement(".tt-ally-warning").remove();

	await requireElement(".user-info-value [href*='/forums.php']"); // There is always a link to the forums.

	const factionNode = findElement<HTMLAnchorElement>(".user-info-value [href*='/factions.php']", true);
	if (!factionNode) return;

	const factionID = parseInt(new URLSearchParams(factionNode.href).get("ID")!);
	const factionName = factionNode.textContent.trim();

	let warning: string | undefined;
	if (hasAPIData() && factionID === userdata.faction?.id) warning = "This user is in your faction!";
	else if (
		settings.alliedFactions.some((ally) => {
			if (typeof ally === "number" || isIntNumber(ally)) return ally === factionID || ally.toString() === factionName;
			else return ally.trim() === factionName;
		})
	)
		warning = "This user is an ally!";

	if (warning) {
		findElement(".profile-left-wrapper .title-black").appendChild(
			elementBuilder({
				type: "span",
				class: "tt-ally-warning",
				text: warning,
			}),
		);
	}
}

export default class FriendlyFireFeature extends Feature {
	constructor() {
		super("Friendly Fire", "profile");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.profile.showAllyWarning;
	}

	override async execute() {
		await addWarning();
	}

	override storageKeys() {
		return ["settings.pages.profile.showAllyWarning", "settings.allyFactionsIDs"];
	}
}
