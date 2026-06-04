import { settings } from "@common/utils/data/database";
import { formatTime } from "@common/utils/functions/formatting";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";

function initialiseMiniProfile() {
	addFetchListener(async (event) => {
		if (!FEATURE_MANAGER.isEnabled(MiniProfileLastActionFeature)) return;

		const {
			page,
			json,
			fetch: { url },
		} = event.detail;
		if (page !== "page") return;

		const params = new URL(url).searchParams;
		const sid = params.get("sid");
		if (sid !== "UserMiniProfile") return;

		await showInformation(json);
	});
}

async function showInformation(information: any) {
	if (Number.isNaN(information.user.lastAction.seconds)) return;

	const miniProfile = document.querySelector("#profile-mini-root .mini-profile-wrapper");
	const lastAction = formatTime({ seconds: information.user.lastAction.seconds }, { type: "wordTimer", showDays: true });

	const lastActionDescription = await requireElement(".last-action-desc", { parent: miniProfile });

	lastActionDescription.textContent = `Last Action:\n${lastAction}`;
}

export default class MiniProfileLastActionFeature extends Feature {
	constructor() {
		super("Mini Profile Last Action", "global");
	}

	isEnabled() {
		return settings.pages.global.miniProfileLastAction;
	}

	initialise() {
		initialiseMiniProfile();
	}

	storageKeys() {
		return ["settings.pages.global.miniProfileLastAction"];
	}
}
