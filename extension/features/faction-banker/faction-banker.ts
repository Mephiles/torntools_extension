import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { formatNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { isInternalFaction } from "@/pages/factions-page";

let originalText: string | undefined;

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_GIVE_TO_USER].push(() => {
		if (!FEATURE_MANAGER.isEnabled(FactionBankerFeature)) return;

		showBalance();
	});
}

async function showHelper() {
	const controlsPanel = document.querySelector("#faction-controls");
	if (controlsPanel.getAttribute("aria-expanded") !== "true") return;

	const input = await requireElement("#money-user");
	if (input.classList.contains("tt-modified")) return;

	input.classList.add("tt-modified");

	["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.addEventListener(event, showBalance));
	document.querySelector("#money-user-cont").addEventListener("click", showBalance);
}

function showBalance() {
	const input = document.querySelector<HTMLInputElement>("#money-user");
	if (!input) return;

	const label = document.querySelector(".select-wrap .placeholder");
	if (typeof originalText === "undefined" && !label.textContent.includes("balance of")) {
		originalText = label.textContent;
	}

	const user = input.value.match(/(.*) \[(\d*)]/i);
	if (!user) {
		label.textContent = originalText;
		return;
	}

	const name = user[1];
	const balance =
		parseInt(
			document.querySelector(`.depositor .user.name[href='/profiles.php?XID=${user[2]}']`).parentElement.querySelector<HTMLElement>(".amount .money")
				.dataset.value
		) || 0;

	label.textContent = `${name} has a balance of $${formatNumber(balance)}`;
}

function removeHelper() {
	const input = document.querySelector("#money-user.tt-modified");
	if (!input) return;

	["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.removeEventListener(event, showBalance));
	document.querySelector("#money-user-cont").removeEventListener("click", showBalance);
	if (typeof originalText === "string") {
		document.querySelector(".select-wrap .placeholder").textContent = originalText;
	}
}

export default class FactionBankerFeature extends Feature {
	constructor() {
		super("Faction Banker", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.banker;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await showHelper();
	}

	cleanup() {
		removeHelper();
	}

	storageKeys() {
		return ["settings.pages.faction.banker"];
	}
}
