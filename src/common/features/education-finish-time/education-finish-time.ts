import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { formatDate, formatTime } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showEducationFinishTime() {
	if (userdata.education_timeleft <= 0) return;

	const msg: Element = await requireElement(".msg .bold");
	const overDate = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();

	msg.insertAdjacentElement(
		"afterend",
		elementBuilder({ type: "b", text: ` (${formatDate(overDate, { showYear: true })} ${formatTime({ milliseconds: overDate })})` }),
	);
}

function removeTime() {
	document.querySelector(".tt-time")?.remove();
}

export default class EducationFinishTimeFeature extends Feature {
	constructor() {
		super("Education Finish Time", "education");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.education.finishTime;
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.education) return "No API access.";
		return true;
	}

	async execute() {
		await showEducationFinishTime();
	}

	cleanup() {
		removeTime();
	}

	storageKeys() {
		return ["settings.pages.education.finishTime"];
	}
}
