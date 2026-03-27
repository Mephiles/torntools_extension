import { buildScoutInformation, scouterService, ScouterService } from "@/features/ff-scouter/ff-scouter";
import { Feature } from "@/features/feature-manager";
import { hasAPIData } from "@/utils/common/functions/api";
import { settings } from "@/utils/common/data/database";
import { getPageStatus } from "@/utils/common/functions/torn";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder } from "@/utils/common/functions/dom";

let SCOUTER_SERVICE: ScouterService;

async function showFF() {
	const id = getUserID();
	if (!id) return;

	const scout = await SCOUTER_SERVICE.scoutSingle(id);
	const { message, className, detailMessage } = buildScoutInformation(scout);

	const element = elementBuilder({
		type: "span",
		class: ["tt-ff-scouter-attack", className],
		text: detailMessage ? `${message}: ${detailMessage}` : message,
	});

	const title: Element = await requireElement("[class*='topSection___']");
	title.insertAdjacentElement("afterend", element);
}

function removeFF() {
	document.querySelector(".tt-ff-scouter-attack")?.remove();
}

function getUserID() {
	const params = new URL(location.href).searchParams;
	const id = params.get("user2ID");
	if (!id) return null;

	return parseInt(id);
}

export default class FFScouterAttackFeature extends Feature {
	constructor() {
		super("FF Scouter Attack", "ff-scouter");
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
		return settings.scripts.ffScouter.attack;
	}

	async initialise() {
		SCOUTER_SERVICE = await scouterService();
	}

	async execute() {
		await showFF();
	}

	cleanup() {
		removeFF();
	}

	storageKeys(): string[] {
		return ["settings.scripts.ffScouter.attack", "settings.external.ffScouter"];
	}
}
