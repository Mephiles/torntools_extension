import "./grey-completed-courses.css";
import { settings } from "@common/utils/data/database";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function greyOut() {
	await requireElement("#education-root [class*='categoryItem__']");
	await requireElement("#education-root [class*='categoryItem__'] .react-loading-skeleton", { invert: true });

	for (const category of findAllElements("#education-root [class*='categoryItem__']")) {
		if (findElement("[class*='progressCounter__'] [class*='checkIconContainer__']", category, true)) category.classList.add("tt-grey");
	}
}

export default class GreyCompletedCoursesFeature extends Feature {
	constructor() {
		super("Grey Completed Courses", "education");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.education.greyOut;
	}

	override async execute() {
		await greyOut();
	}

	override storageKeys() {
		return ["settings.pages.education.greyOut"];
	}
}
