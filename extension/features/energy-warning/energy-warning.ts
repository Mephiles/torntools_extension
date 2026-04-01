import "./energy-warning.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getItemEnergy, getPage, getPageStatus, getUserEnergy } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { isInternalFaction } from "@/pages/factions-page";

function initialiseListener() {
	document.addEventListener("click", async (event) => {
		if (!FEATURE_MANAGER.isEnabled(EnergyWarningFeature) || !isElement(event.target)) return;

		const factionPage = getPage() === "factions";
		let item: HTMLElement | undefined;
		if (factionPage) item = event.target.closest("li");
		else item = event.target.closest("li[data-category]");

		if (item) await addWarning(item);
	});
}

async function addWarning(item: HTMLElement) {
	findAllElements(".tt-energy-warning", item).forEach((x) => x.remove());

	const message: Element = await requireElement(".confirm-wrap, .use-act", { parent: item });
	if (!message) return;

	const factionPage = getPage() === "factions";
	const received = getItemEnergy(factionPage ? item.querySelector<HTMLElement>(".img-wrap").dataset.itemid : item.dataset.item);
	if (!received) return;

	const [current] = getUserEnergy();
	if (received + current <= 1000) return;

	const warning = elementBuilder({
		type: "div",
		class: "tt-energy-warning",
		text: "Warning! Using this item increases your energy to over 1000!",
	});

	if (factionPage) message.querySelector(".confirm").insertAdjacentElement("afterend", warning);
	else message.querySelector(".act #wai-action-desc").appendChild(warning);

	message.querySelector<HTMLElement>("a.next-act").addEventListener("click", clickListener, { capture: true, once: true });
}

function clickListener(event: MouseEvent) {
	if (!confirm("Are you sure to use this item ? It will get you to more than 1000E.")) {
		event.stopPropagation();
		event.stopImmediatePropagation();
	}
}

function removeWarning() {
	findAllElements(".tt-energy-warning").forEach((x) => x.remove());
	findAllElements("a.next-act").forEach((x) => x.removeEventListener("click", clickListener, { capture: true }));
}

export default class EnergyWarningFeature extends Feature {
	constructor() {
		super("Energy Warning", "items");
	}

	precondition() {
		return getPageStatus().access && (getPage() !== "factions" || isInternalFaction);
	}

	isEnabled() {
		return settings.pages.items.energyWarning;
	}

	initialise() {
		initialiseListener();
	}

	cleanup() {
		removeWarning();
	}

	storageKeys() {
		return ["settings.pages.items.energyWarning"];
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}
}
