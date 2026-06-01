import { Feature } from "@features/feature";
import "./grey-completed-courses.css";

import { settings } from "@utils/data/database";
import { findAllElements } from "@utils/functions/dom";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus } from "@utils/functions/torn";

async function greyOut() {
	await requireElement("#education-root [class*='categoryItem__']");
	await requireElement("#education-root [class*='categoryItem__'] .react-loading-skeleton", { invert: true });

	for (const category of findAllElements("#education-root [class*='categoryItem__']")) {
		if (category.querySelector("[class*='progressCounter__'] [class*='checkIconContainer__']")) category.classList.add("tt-grey");
	}
}

function removeGreying() {
	findAllElements(".tt-grey").forEach((x) => x.classList.remove("tt-grey"));
}

export default class GreyCompletedCoursesFeature extends Feature {
	constructor() {
		super("Grey Completed Courses", "education");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.education.greyOut;
	}

	async execute() {
		await greyOut();
	}

	cleanup() {
		removeGreying();
	}

	storageKeys() {
		return ["settings.pages.education.greyOut"];
	}
}
