import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";
import "./display-case-worth.css";

import { settings, userdata } from "@utils/data/database";
import { fetchData, hasAPIData } from "@utils/functions/api";
import type { UserV1DisplayCaseResponse } from "@utils/functions/api-v1.types";
import { elementBuilder } from "@utils/functions/dom";
import { formatNumber } from "@utils/functions/formatting";
import { addXHRListener } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { createMessageBox } from "@utils/functions/torn";

function xhrListener() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (
			FEATURE_MANAGER.isEnabled(DisplayCaseWorthFeature) &&
			page === "displaycase" &&
			(xhr.requestBody === "step=display" || xhr.requestBody.startsWith("userID="))
		)
			await addWorth();
	});
}

async function addWorth() {
	const hashId = location.hash.split("/").length > 1 ? location.hash.split("/").at(-1) : "";

	let userId: number | null = null;
	if (!hashId || (!Number.isNaN(hashId) && parseInt(hashId) !== userdata.profile.id)) userId = parseInt(hashId);

	let result: UserV1DisplayCaseResponse | undefined;
	try {
		result = await fetchData<UserV1DisplayCaseResponse>("tornv2", {
			section: "user",
			id: userId,
			selections: ["display"],
			legacySelections: ["display"],
		});
	} catch (error) {
		await displayError(!!userId, error);
		console.log("TT - Display Cabinet Worth API Error:", error);
		return;
	}

	const totalValue = result.display.reduce((total, item) => total + item.market_price * item.quantity, 0);

	await displayValue(!userId, totalValue);
}

async function displayValue(isOwn: boolean, value: number) {
	let element: Element;
	if (isOwn) {
		element = createMessageBox(`This display cabinet is worth <span>${formatNumber(value, { currency: true })}</span>.`, {
			class: "tt-display-worth",
			isHTML: true,
		});
	} else {
		element = elementBuilder({
			type: "div",
			class: "tt-display-worth",
			text: "This display cabinet is worth ",
			children: [
				elementBuilder({
					type: "span",
					text: `${formatNumber(value, { currency: true })}.`,
				}),
			],
		});
	}

	await displayElement(isOwn, element);
}

async function displayError(isOwn: boolean, error: any) {
	let element: Element;
	if (isOwn) {
		element = createMessageBox(`TORN API returned error: ${error.toString()}.`, { class: "tt-display-worth" });
	} else {
		element = elementBuilder({
			type: "div",
			class: "tt-display-worth",
			text: `TORN API returned error: ${error.toString()}`,
		});
	}

	await displayElement(isOwn, element);
}

async function displayElement(isOwn: boolean, element: Element) {
	if (isOwn) {
		document.querySelector(".display-cabinet").insertAdjacentElement("beforebegin", element);
	} else {
		await requireElement(".info-msg-cont .ajax-preloader", { invert: true });

		document.querySelector(".info-msg-cont .msg").appendChild(element);
	}
}

function removeWorth() {
	document.querySelector(".tt-display-worth").remove();
}

export default class DisplayCaseWorthFeature extends Feature {
	constructor() {
		super("Display Case Worth", "display case");
	}

	isEnabled() {
		return settings.pages.displayCase.worth;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	initialise() {
		xhrListener();
	}

	async execute() {
		await addWorth();
	}

	cleanup() {
		removeWorth();
	}

	storageKeys() {
		return ["settings.pages.displayCase.worth"];
	}
}
