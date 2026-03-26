import "./disable-ally-attacks.css";
import { ExecutionTiming, Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, isOwnProfile } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, isElement, mobile, tablet } from "@/utils/common/functions/dom";
import { hasAPIData } from "@/utils/common/functions/api";
import { requireElement } from "@/utils/common/functions/requires";
import { addFetchListener } from "@/utils/common/functions/listeners";

let closedOption = false;
async function startListener() {
	addFetchListener(({ detail: { page, json } }) => {
		if (
			closedOption ||
			!FEATURE_MANAGER.isEnabled(DisableAllyAttacksLoaderFeature) ||
			page !== "loader" ||
			!json ||
			!json.DB ||
			!json.DB.defenderUser ||
			!json.DB.defenderUser.factionID
		)
			return;

		disableAttackButton(parseInt(json.DB.defenderUser.factionID));
	});
}

async function disableAttackButton(factionID: number) {
	if (document.querySelector(".tt-disable-ally-attack")) return;

	const selector = mobile || tablet ? "[class*='playerArea__'] [class*='modal__']" : "[class*='players__'] :has([class*='rose___']) [class*='modal__']";

	if (!((hasAPIData() && userdata.faction?.id === factionID) || settings.alliedFactions.some((ally) => ally === factionID))) {
		return;
	}

	const node = await requireElement(selector);
	const warning = elementBuilder({
		type: "div",
		class: "tt-disable-ally-attack",
		text: "Blocked by TornTools. This player is an ally. Click here if you are sure to attack.",
	});
	warning.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopImmediatePropagation();

		if (isElement(event.target) && confirm("Are you sure you want to attack this ally?")) {
			event.target.remove();
			closedOption = true;
		}
	});
	node.insertAdjacentElement("afterbegin", warning);
}

function removeWarning() {
	findAllElements(".tt-disable-ally-attack").forEach((x) => x.remove());
}

export default class DisableAllyAttacksLoaderFeature extends Feature {
	constructor() {
		super("Disable Ally Attacks", "loader", ExecutionTiming.IMMEDIATELY);
	}

	precondition() {
		return getPageStatus().access && !isOwnProfile();
	}

	isEnabled() {
		return settings.pages.profile.disableAllyAttacks;
	}

	async initialise() {
		await startListener();
	}

	cleanup() {
		removeWarning();
	}

	storageKeys() {
		return ["settings.pages.profile.disableAllyAttacks", "settings.alliedFactions"];
	}
}
