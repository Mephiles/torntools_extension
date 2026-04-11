import "./grey-completed-courses.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { findAllElements } from "@/utils/common/functions/dom";

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
