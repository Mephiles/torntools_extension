import "./friendly-fire.css";
import { Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { isIntNumber } from "@/utils/common/functions/utilities";

async function addWarning() {
	if (document.querySelector(".tt-ally-warning")) document.querySelector(".tt-ally-warning").remove();

	const factionNode = await requireElement(".user-info-value [href*='/factions.php']");
	const factionID = parseInt(new URLSearchParams(factionNode.href).get("ID"));
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
		document.querySelector(".profile-left-wrapper .title-black").appendChild(
			elementBuilder({
				type: "span",
				class: "tt-ally-warning",
				text: warning,
			})
		);
	}
}

function removeWarning() {
	findAllElements(".tt-ally-warning").forEach((x) => x.remove());
}

export default class FriendlyFireFeature extends Feature {
	constructor() {
		super("Friendly Fire", "profile");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.profile.showAllyWarning;
	}

	async execute() {
		await addWarning();
	}

	cleanup() {
		removeWarning();
	}

	storageKeys() {
		return ["settings.pages.profile.showAllyWarning", "settings.allyFactionsIDs"];
	}
}
