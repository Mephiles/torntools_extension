import { Feature } from "@/features/feature-manager";
import { buildScoutInformation, type ScouterResult, type ScouterService, scouterService } from "@/features/ff-scouter/ff-scouter";
import { appendToBuildProfileTitleBar } from "@/pages/profile-page";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

let SCOUTER_SERVICE: ScouterService;

async function showFF() {
	await requireElement(".basic-info .info-table > *:first-child");

	const id = getUserID();

	SCOUTER_SERVICE.scoutSingle(id)
		.then((scout) => showResult(scout))
		.catch((reason) => {
			if ("error" in reason) {
				showResult({ player_id: id, message: reason.error, message_short: reason.error, isError: true });
			} else {
				console.error("TT - Failed to scout ff for the profile.", reason);
			}
		});
}

function showResult(scout: ScouterResult) {
	const { message, className, detailMessage } = buildScoutInformation(scout);

	const element = elementBuilder({ type: "span", class: ["tt-ff-scouter-profile", className], text: message });
	if (detailMessage) {
		element.setAttribute("title", detailMessage);
		element.textContent = "Failed to scout";
		element.appendChild(elementBuilder({ type: "span", text: message }));
	}

	appendToBuildProfileTitleBar(element);
}

function removeFF() {
	document.querySelector(".tt-ff-scouter-profile")?.remove();
}

function getUserID() {
	return parseInt(
		document.querySelector(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").textContent.match(/(?<=\[)\d*(?=])/i)[0],
	);
}

export default class FfScouterProfileFeature extends Feature {
	constructor() {
		super("FF Scouter Profile", "ff-scouter");
	}

	precondition(): boolean {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.ffScouter) return "FFScouter not enabled.";

		return true;
	}

	isEnabled(): boolean {
		return settings.scripts.ffScouter.profile;
	}

	initialise() {
		SCOUTER_SERVICE = scouterService();
	}

	async execute() {
		await showFF();
	}

	cleanup() {
		removeFF();
	}

	storageKeys(): string[] {
		return ["settings.scripts.ffScouter.profile", "settings.external.ffScouter"];
	}
}
