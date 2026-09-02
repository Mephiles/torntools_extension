import "./status-indicator.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addIndicator() {
	const basicInfo = await requireElement(".profile-container .row.basic-info > *:first-child");

	findElement("#skip-to-content").insertAdjacentElement(
		"beforebegin",
		elementBuilder({
			type: "ul",
			class: "big tt-profile-icon",
			children: [basicInfo.cloneNode(true)],
		}),
	);
}

export default class StatusIndicatorFeature extends Feature {
	constructor() {
		super("Status Indicator", "profile");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.profile.statusIndicator;
	}

	override async execute() {
		await addIndicator();
	}

	override storageKeys() {
		return ["settings.pages.profile.statusIndicator"];
	}
}
