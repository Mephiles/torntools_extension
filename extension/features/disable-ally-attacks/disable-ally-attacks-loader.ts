import "./disable-ally-attacks.css";
import { ExecutionTiming, FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements, mobile, tablet } from "@/utils/common/functions/dom";
import { addFetchListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, isOwnProfile } from "@/utils/common/functions/torn";

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

async function disableAttackButton(factionID: number | null) {
	if (!factionID) return;
	if (document.querySelector(".tt-disable-ally-attack")) return;

	const selector = mobile || tablet ? "[class*='playerArea__'] [class*='modal__']" : "[class*='players__'] #defender [class*='modal__']";

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

		if (confirm("Are you sure you want to attack this ally?")) {
			(event.target as Element).remove();
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

	async execute() {
		await disableAttackButton(null);
	}

	cleanup() {
		removeWarning();
	}

	storageKeys() {
		return ["settings.pages.profile.disableAllyAttacks", "settings.alliedFactions"];
	}
}
