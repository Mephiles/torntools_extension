import "./efficient-rehab.css";
import { Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { elementBuilder, executeScript, findAllElements } from "@/utils/common/functions/dom";
import { applyPlural } from "@/utils/common/functions/formatting";
import { requireCondition, requireElement } from "@/utils/common/functions/requires";
import type { EfficientRehabDetails } from "@/entrypoints/efficient-rehab--inject";

let isInjected = false;
let knownPercentages: any;

function addListener() {
	executeScript(browser.runtime.getURL("/efficient-rehab--inject.js"));
	window.addEventListener("tt-injected--efficient-rehab", () => (isInjected = true));

	addXHRListener(async ({ detail }) => {
		if (!("json" in detail)) return;

		const { page, xhr, json } = detail;

		if (page === "travelagency") {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (step === "tryRehab") {
				removeInformation();
				void showInformation();
			} else if (step === "checkAddiction" && !!json) {
				knownPercentages = json.percentages;
				removeInformation();
				void showInformation();
			}
		}
	});
}

async function showInformation() {
	await requireCondition(() => isInjected);

	const percentages = knownPercentages ?? JSON.parse((await requireElement("#rehub-progress .range-slider-data")).dataset.percentages);

	const maxRehabs = parseInt(Object.keys(percentages).reverse()[0]);
	const { safe } = calculateSafeRehabs();

	const informationElement = elementBuilder({
		type: "div",
		class: "tt-efficient-rehab",
		children: ["For full efficiency, leave at least ", elementBuilder({ type: "span", class: "tt-efficient-rehab--amount", text: safe }), " rehabs. "],
	});
	if (safe >= maxRehabs) {
		informationElement.appendChild(document.createTextNode("This means that you "));
		informationElement.appendChild(elementBuilder({ type: "span", class: "tt-efficient-rehab--amount tt-efficient-rehab--too-much", text: "shouldn't" }));
		informationElement.appendChild(document.createTextNode(" rehab at all."));
	} else {
		informationElement.appendChild(document.createTextNode("This means that you should rehab up to "));
		informationElement.appendChild(elementBuilder({ type: "span", class: "tt-efficient-rehab--amount", text: maxRehabs - safe }));
		informationElement.appendChild(document.createTextNode(` time${applyPlural(maxRehabs - safe)}.`));
	}

	if (settings.pages.travel.efficientRehabSelect) {
		const selectRehabs = Math.max(maxRehabs - safe, 1);
		window.dispatchEvent(new CustomEvent<EfficientRehabDetails>("tt-efficient-rehab", { detail: { ticks: selectRehabs } }));
		adjustSlider(selectRehabs);
	}

	document.querySelector(".rehab-desc").insertAdjacentElement("afterend", informationElement);
}

function calculateSafeRehabs() {
	const rehabsDone = userdata.personalstats.drugs.rehabilitations.amount;

	const costAP = rehabsDone <= 19_232 ? rehabsDone * 12.85 + 2_857.14 : 250_000;
	const rehabAP = parseInt(Math.round((250_000 / costAP) * 100).toString()) / 100;

	return {
		minimum: Math.ceil(20 / rehabAP),
		safe: Math.ceil(19 / rehabAP + 1),
	};
}

function removeInformation() {
	findAllElements(".tt-efficient-rehab").forEach((x) => x.remove());
}

type AvailablePercentages = Record<string, number>;

function adjustSlider(ticks: number) {
	const slider = document.querySelector("#rehub-progress .ui-slider");
	if (!slider) return;

	const availablePercentages: AvailablePercentages = JSON.parse(slider.getAttribute("data-percentages")) || {};
	const width = !availablePercentages[2]
		? slider.clientWidth
		: (slider.clientWidth / (100 - availablePercentages[1])) * (availablePercentages[ticks] - availablePercentages[1]) || 0;

	slider.querySelector<HTMLElement>(".range-slider-track").style.left = `${width}px`;
}

export default class EfficientRehabFeature extends Feature {
	constructor() {
		super("Efficient Rehab", "travel");
	}

	isEnabled() {
		return settings.pages.travel.efficientRehab;
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.personalstats) return "No API access.";

		return true;
	}

	initialise() {
		addListener();
	}

	async execute() {
		await showInformation();
	}

	cleanup() {
		removeInformation();
	}

	storageKeys() {
		return ["settings.pages.travel.efficientRehab", "settings.apiUsage.user.personalstats"];
	}
}
