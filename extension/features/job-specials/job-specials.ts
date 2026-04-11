import "./job-specials.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, mobile } from "@/utils/common/functions/dom";
import { applyPlural } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { COMPANY_INFORMATION, getPageStatus } from "@/utils/common/functions/torn";

async function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(async () => {
		if (!settings.pages.joblist.specials) return;

		await showSpecials();
	});
}

async function showSpecials() {
	if (findContainer("Job Specials")) return;
	await requireElement(".content-wrapper .company-details");

	const { content } = createContainer("Job Specials", {
		previousElement: document.querySelector(".company-details-wrap"),
		spacer: true,
	});

	const companyType = document.querySelector(".details-wrap ul.info .m-title .m-show:not(.arrow-left)").textContent.trim();
	const companyInfo = COMPANY_INFORMATION[companyType];

	for (const stars of [1, 3, 5, 7, 10] as const) {
		let name: string, cost: string, effect: string;
		if (stars in companyInfo) {
			name = companyInfo[stars].name;
			cost = companyInfo[stars].cost;
			effect = companyInfo[stars].effect;
		} else {
			name = "No Special";
			cost = "N/A";
			effect = "";
		}

		let costText: string;
		if (cost === "Passive" || cost === "N/A") costText = cost;
		else costText = `${cost} job point${applyPlural(parseInt(cost))}`;

		if (!mobile) {
			content.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-company-info-wrap",
					children: [
						elementBuilder({ type: "div", class: "heading", text: `${name} (${stars}★)` }),
						elementBuilder({ type: "hr", class: "first-hr" }),
						elementBuilder({ type: "div", text: costText }),
						elementBuilder({ type: "hr", class: "second-hr" }),
						elementBuilder({ type: "div", text: effect }),
					],
				}),
			);
		} else {
			content.appendChild(
				elementBuilder({
					type: "tr",
					class: "tt-company-info-wrap",
					children: [
						elementBuilder({
							type: "div",
							class: "heading",
							children: [elementBuilder({ type: "div", text: name }), elementBuilder({ type: "div", text: `(${stars}★)` })],
						}),
						elementBuilder({ type: "div", text: costText }),
						elementBuilder({ type: "div", text: effect }),
					],
				}),
			);
		}
	}
}

function removeSpecials() {
	removeContainer("Job Specials");
}

export default class JobSpecialsFeature extends Feature {
	constructor() {
		super("Job Specials", "joblist");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.joblist.specials;
	}

	async initialise() {
		await addListener();
	}

	async execute() {
		await showSpecials();
	}

	cleanup() {
		removeSpecials();
	}

	storageKeys() {
		return ["settings.pages.joblist.specials"];
	}
}
