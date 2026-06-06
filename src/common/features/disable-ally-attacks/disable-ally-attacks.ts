import "./disable-ally-attacks.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isOwnProfile } from "@common/utils/functions/torn";
import { isIntNumber } from "@common/utils/functions/utilities";
import { crossSvg } from "@common/utils/icons/cross";
import { Feature } from "@features/feature";

async function startObserver() {
	new MutationObserver(() => {
		if (FEATURE_MANAGER.isEnabled(DisableAllyAttacksFeature)) disableAttackButton();
	}).observe(await requireElement(".profile-container"), { childList: true });
}

function listenerFunction(event: MouseEvent) {
	event.preventDefault();
	event.stopImmediatePropagation();
	if (confirm("Are you sure you want to attack this ally?")) {
		window.open(document.querySelector<HTMLAnchorElement>(".profile-buttons .profile-button-attack").href, "_self");
	}
}

async function disableAttackButton() {
	const factionLink = await requireElement<HTMLAnchorElement>(".user-info-value [href*='/factions.php']");

	enableButton();

	const factionID = convertToNumber(new URLSearchParams(factionLink.href).get("ID"));
	const factionName = factionLink.textContent.trim();
	if (
		(hasAPIData() && factionID === userdata.faction?.id) ||
		settings.alliedFactions.some((ally) => {
			if (typeof ally === "number" || isIntNumber(ally)) return ally === factionID || ally.toString() === factionName;
			else return ally.trim() === factionName;
		})
	) {
		const attackButton = document.querySelector(".profile-buttons .profile-button-attack");
		if (attackButton.classList.contains("cross")) return;

		const crossSvgNode = crossSvg();
		crossSvgNode.classList.add("tt-disable-ally");
		attackButton.insertAdjacentElement("beforeend", crossSvgNode);
		crossSvgNode.addEventListener("click", listenerFunction, { capture: true });
	}
}

function enableButton() {
	findAllElements("#profileroot .tt-disable-ally.tt-cross").forEach((x) => x.remove());
}

export default class DisableAllyAttacksFeature extends Feature {
	constructor() {
		super("Disable Ally Attacks Profile", "profile");
	}

	precondition() {
		return getPageStatus().access && !isOwnProfile();
	}

	isEnabled() {
		return settings.pages.profile.disableAllyAttacks;
	}

	async initialise() {
		await startObserver();
	}

	async execute() {
		await disableAttackButton();
	}

	cleanup() {
		enableButton();
	}

	storageKeys() {
		return ["settings.pages.profile.disableAllyAttacks", "settings.alliedFactions"];
	}
}
