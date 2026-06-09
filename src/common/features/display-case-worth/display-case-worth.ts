import "./display-case-worth.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type { UserV1DisplayCaseResponse } from "@common/utils/functions/api-v1.types";
import { elementBuilder } from "@common/utils/functions/dom";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { createMessageBox, getUserDetails } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

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
	const details = getUserDetails();
	if (!hashId || (!Number.isNaN(hashId) && parseInt(hashId) !== details.id)) userId = parseInt(hashId);

	let result: UserV1DisplayCaseResponse | undefined;
	try {
		result = await fetchData<UserV1DisplayCaseResponse>("tornv2", {
			section: "user",
			id: userId,
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
