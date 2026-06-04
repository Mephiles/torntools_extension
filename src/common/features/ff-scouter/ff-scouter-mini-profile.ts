import { settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";
import { buildScoutInformation, type ScouterResult, type ScouterService, scouterService } from "@features/ff-scouter/ff-scouter";

let SCOUTER_SERVICE: ScouterService;

function initialiseMiniProfile() {
	addFetchListener((event) => {
		if (!FEATURE_MANAGER.isEnabled(FFScouterMiniProfileFeature)) return;

		const {
			page,
			json,
			fetch: { url },
		} = event.detail;
		if (page !== "page") return;

		const params = new URL(url).searchParams;
		const sid = params.get("sid");
		if (sid !== "UserMiniProfile") return;

		showFF(json);
	});
}

async function showFF(information: any) {
	const userId = information.user.userID;

	SCOUTER_SERVICE.scoutSingle(userId)
		.then((scout) => showResult(scout))
		.catch((reason) => {
			if ("error" in reason) {
				showResult({ player_id: userId, message: reason.error, message_short: reason.error, isError: true });
			} else {
				console.error("TT - Failed to scout ff for the mini profile.", reason);
			}
		});
}

async function showResult(scout: ScouterResult) {
	const { message, className, detailMessage } = buildScoutInformation(scout);

	const element = elementBuilder({ type: "span", class: ["tt-ff-scouter-mini-profile", className], text: message });
	if (detailMessage) {
		element.setAttribute("title", detailMessage);
	}

	const lastActionSection = await requireElement("#profile-mini-root .profile-container .description .last-action");
	lastActionSection.insertAdjacentElement("beforebegin", element);
}

export default class FFScouterMiniProfileFeature extends Feature {
	constructor() {
		super("FF Scouter Mini Profile", "ff-scouter");
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		else if (!settings.external.ffScouter) return "FFScouter not enabled.";

		return true;
	}

	isEnabled(): boolean {
		return settings.scripts.ffScouter.miniProfile;
	}

	async initialise() {
		SCOUTER_SERVICE = scouterService();
		initialiseMiniProfile();
	}

	storageKeys(): string[] {
		return ["settings.scripts.ffScouter.miniProfile", "settings.external.ffScouter"];
	}
}
