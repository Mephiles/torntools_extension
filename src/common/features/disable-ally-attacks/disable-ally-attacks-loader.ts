import "./disable-ally-attacks.css";
import { isAttackData } from "@common/pages/attack-loader-page";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements, mobile, tablet } from "@common/utils/functions/dom";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isOwnProfile } from "@common/utils/functions/torn";
import { ExecutionTiming, FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";

let closedOption = false;

async function startListener() {
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (closedOption || !FEATURE_MANAGER.isEnabled(DisableAllyAttacksLoaderFeature) || page !== "page") return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");

		if (!isAttackData(sid, json)) return;
		if (!json.DB.defenderUser.factionID || json.viewStyle !== "nonAttack") return;

		disableAttackButton(json.DB.defenderUser.factionID);
	});
}

async function disableAttackButton(factionID: number | null) {
	if (!factionID) return;
	if (document.querySelector(".tt-disable-ally-attack")) return;

	const selector =
		mobile || tablet
			? "[class*='playerArea__'] [class*='modal__'][class*='defender___']"
			: "[class*='player___']:has([class*='rose___']) [class*='modal__']";

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
			closedOption = true;
			(event.currentTarget as Element).remove();
		}
	});

	node.insertAdjacentElement("afterbegin", warning);
}

function removeWarning() {
	findAllElements(".tt-disable-ally-attack").forEach((x) => x.remove());
}

export default class DisableAllyAttacksLoaderFeature extends Feature {
	constructor() {
		super("Disable Ally Attacks", "attacks", ExecutionTiming.IMMEDIATELY);
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
