import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder } from "@/utils/common/functions/dom";
import { formatDate, formatTime } from "@/utils/common/functions/formatting";
import { hasAPIData } from "@/utils/common/functions/api";

async function showEducationFinishTime() {
	if (userdata.education_timeleft <= 0) return;

	const msg: Element = await requireElement(".msg .bold");
	const overDate = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();

	msg.insertAdjacentElement(
		"afterend",
		elementBuilder({ type: "b", text: ` (${formatDate(overDate, { showYear: true })} ${formatTime({ milliseconds: overDate })})` })
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
