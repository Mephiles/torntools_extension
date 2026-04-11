import "./medical-life.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings, userdata } from "@/utils/common/data/database";
import { elementBuilder, isElement } from "@/utils/common/functions/dom";
import { convertToNumber, roundNearest } from "@/utils/common/functions/formatting";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPage } from "@/utils/common/functions/torn";

const page = getPage();

const MEDICAL_ITEMS = {
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
		document.getElementById("faction-armoury").addEventListener("click", async (event) => {
			if (!FEATURE_MANAGER.isEnabled(MedicalLifeFeature)) return;

			if (!isElement(event.target) || !event.target.classList.contains("use")) return;

			const id = convertToNumber(event.target.closest(".item-use-act").querySelector<HTMLElement>(".use-cont").dataset.itemid);
			if (!doesRestoreLife(id)) return;

			await showInformation(id);
		});
	}
}

function doesRestoreLife(id: number) {
	return id in MEDICAL_ITEMS;
}

async function showInformation(id: number) {
	const perks = userdata.education_perks
		.filter((perk) => perk.includes("Medical item effectiveness"))
		.map((perk) => parseInt(perk.match(/\+ (\d+)%/i)[1]))
		.reduce((a, b) => a + b, 0);
	const percentage = (1 + perks / 100) * MEDICAL_ITEMS[id];

	const lifeValues = document.querySelector("[class*='bar__'][class*='life__'] [class*='bar-value___']").textContent.split("/");
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

	if (actionWrap.querySelector(".tt-medical-life")) {
		actionWrap.querySelector(".tt-medical-life").textContent = text;
	} else {
		actionWrap.appendChild(elementBuilder({ type: "strong", class: ["tt-medical-life", page], text }));
	}
}

export default class MedicalLifeFeature extends Feature {
	constructor() {
		super("Medical Life", "items");
	}

	precondition() {
		return page !== "factions" || isInternalFaction;
	}

	isEnabled() {
		return settings.pages.items.medicalLife;
	}

	initialise() {
		addListener();
	}

	storageKeys() {
		return ["settings.pages.items.medicalLife"];
	}
}
