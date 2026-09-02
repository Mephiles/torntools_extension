import "./medical-life.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { elementBuilder, isElement } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { convertToNumber, roundNearest } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPage } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const page = getPage();

const MEDICAL_ITEMS: Record<number, number> = {
	66: 15,
	67: 10,
	68: 5,
	732: 30,
	733: 30,
	734: 30,
	735: 30,
	736: 30,
	737: 30,
	738: 30,
	739: 30,
};

function addListener() {
	if (page === "item") {
		addXHRListener(async ({ detail: { page, xhr } }) => {
			if (!FEATURE_MANAGER.isEnabled(MedicalLifeFeature)) return;

			if (page !== "item") return;

			const params = new URLSearchParams(xhr.requestBody);
			if (params.get("action") !== "use") return;

			const id = convertToNumber(params.get("id"));
			if (!doesRestoreLife(id)) return;

			await showInformation(id);
		});
	} else if (page === "factions") {
		findElement("#faction-armoury").addEventListener("click", async (event) => {
			if (!FEATURE_MANAGER.isEnabled(MedicalLifeFeature)) return;

			if (!isElement(event.target) || !event.target.classList.contains("use")) return;

			const useElement = event.target.closest(".item-use-act");
			if (!useElement) return;

			const id = convertToNumber(findElement(".use-cont", useElement).dataset.itemid);
			if (!doesRestoreLife(id)) return;

			await showInformation(id);
		});
	}
}

function doesRestoreLife(id: number) {
	return id in MEDICAL_ITEMS;
}

async function showInformation(id: number) {
	const perks = userdata.perks.education
		.filter((perk) => perk.toLowerCase().includes("medical item effectiveness"))
		.map((perk) => parseInt(perk.match(/\+ (\d+)%/i)[1]))
		.reduce((a, b) => a + b, 0);
	const percentage = (1 + perks / 100) * MEDICAL_ITEMS[id];

	const lifeValues = findElement(
		"[class*='bar__'][class*='life__'] [class*='bar-value___'], [class*='bar__'][class*='life__'] [class*='barValue___']",
	).textContent.split("/");
	const currentLife = parseInt(lifeValues[0]);
	const maximumLife = parseInt(lifeValues[1]);

	const replenish = Math.max(Math.min(maximumLife * (percentage / 100), maximumLife - currentLife), 0);
	const newLife = currentLife + replenish;

	let actionWrap: Element;
	if (page === "item") {
		actionWrap = await requireElement(".use-action[style*='display: block;'] #wai-action-desc, .use-action:not([style]) #wai-action-desc");
	} else if (page === "factions") {
		actionWrap = await requireElement(`.action-cont[data-itemid='${id}'] .confirm`);
	}

	const text = `Your life total will be ${roundNearest(newLife, 1)}/${roundNearest(maximumLife, 1)}.`;

	if (findElement(".tt-medical-life", actionWrap, true)) {
		findElement(".tt-medical-life", actionWrap).textContent = text;
	} else {
		actionWrap.appendChild(elementBuilder({ type: "strong", class: ["tt-medical-life", page], text }));
	}
}

export default class MedicalLifeFeature extends Feature {
	constructor() {
		super("Medical Life", "items");
	}

	override precondition() {
		return page !== "factions" || isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.items.medicalLife;
	}

	override initialise() {
		addListener();
	}

	override storageKeys() {
		return ["settings.pages.items.medicalLife"];
	}
}
