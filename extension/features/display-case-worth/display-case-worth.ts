import "./display-case-worth.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { fetchData, hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { createMessageBox } from "@/utils/common/functions/torn";

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
	const displayCaseUserId = location.hash.split("/").length > 1 ? location.hash.split("/").at(-1) : "";
	if (displayCaseUserId && !Number.isNaN(parseInt(displayCaseUserId)) && parseInt(displayCaseUserId) !== userdata.profile.id) {
		await requireElement(".info-msg-cont .msg");
		// TODO - Migrate to V2 (user/display).
		fetchData("tornv2", { section: "user", id: displayCaseUserId, selections: ["display"], legacySelections: ["display"] })
			.then((result) => {
				let total = 0;

				for (const item of result.display) {
					total += item.market_price * item.quantity;
				}

				document.querySelector(".info-msg-cont .msg").appendChild(
					elementBuilder({
						type: "div",
						class: "tt-display-worth",
						text: "This display cabinet is worth ",
						children: [
							elementBuilder({
								type: "span",
								text: `${formatNumber(total, { currency: true })}.`,
							}),
						],
					}),
				);
			})
			.catch((error) => {
				document.querySelector(".info-msg-cont .msg").appendChild(
					elementBuilder({
						type: "div",
						class: "tt-display-worth",
						text: `TORN API returned error: ${error.toString()}`,
					}),
				);
				console.log("TT - Display Cabinet Worth API Error:", error);
			});
	} else {
		// TODO - Migrate to V2 (user/display).
		fetchData("tornv2", { section: "user", id: userdata.profile.id, selections: ["display"], legacySelections: ["display"] })
			.then(async (result) => {
				let total = 0;

				for (const item of result.display) {
					total += item.market_price * item.quantity;
				}

				document.querySelector(".display-cabinet").insertAdjacentElement(
					"beforebegin",
					createMessageBox(`This display cabinet is worth <span>${formatNumber(total, { currency: true })}</span>.`, {
						class: "tt-display-worth",
						isHTML: true,
					}),
				);
			})
			.catch(async (error) => {
				document
					.querySelector(".display-cabinet")
					.insertAdjacentElement("beforebegin", createMessageBox(`TORN API returned error: ${error.toString()}.`, { class: "tt-display-worth" }));
				console.log("TT - Display Cabinet Worth API Error:", error);
			});
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
