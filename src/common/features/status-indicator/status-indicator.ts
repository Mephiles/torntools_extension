import { Feature } from "@features/feature";
import "./status-indicator.css";

import { settings } from "@utils/data/database";
import { elementBuilder } from "@utils/functions/dom";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus } from "@utils/functions/torn";

async function addIndicator() {
	const basicInfo = await requireElement(".profile-container .row.basic-info > *:first-child");

	document.querySelector("#skip-to-content").insertAdjacentElement(
		"beforebegin",
		elementBuilder({
			type: "ul",
			class: "big tt-profile-icon",
			children: [basicInfo.cloneNode(true)],
		}),
	);
}

function removeIndicator() {
	const addedIcon = document.querySelector("#skip-to-content").parentElement.querySelector(".tt-profile-icon");
	if (addedIcon) addedIcon.remove();
}

export default class StatusIndicatorFeature extends Feature {
	constructor() {
		super("Status Indicator", "profile");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.profile.statusIndicator;
	}

	async execute() {
		await addIndicator();
	}

	cleanup() {
		removeIndicator();
	}

	storageKeys() {
		return ["settings.pages.profile.statusIndicator"];
	}
}
