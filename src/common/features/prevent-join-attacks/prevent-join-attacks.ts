import { isAttackData } from "@common/pages/attack-loader-page";
import { settings } from "@common/utils/data/database";
import { elementBuilder, getSearchParameters, mobile, tablet } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { ATTACKABLE_NPCS, getPageStatus, isOwnProfile } from "@common/utils/functions/torn";
import { ExecutionTiming, Feature } from "@features/feature";
import styles from "./prevent-join-attacks.module.css";

let confirmed = false;
let inProgress = false;
let userId: number;

function startListener() {
	userId = parseInt(getSearchParameters().get("user2ID")!);
	addFetchListener(({ detail: { page, json, fetch } }) => {
		if (confirmed || page !== "page") return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid")!;

		if (!isAttackData(sid, json) || json.viewStyle !== "nonAttack") return;

		void disableAttackButton();
	});
}

async function disableAttackButton() {
	if (settings.pages.profile.preventJoinAttacksSkipNpcs && ATTACKABLE_NPCS.includes(userId)) return;

	if (findElement(`.${styles.ttPreventJoinAttack}`, true)) return;

	if (inProgress) return;
	inProgress = true;

	const selector =
		mobile || tablet
			? "[class*='playerArea__'] [class*='modal__'][class*='defender___']"
			: "[class*='player___']:has([class*='rose___']) [class*='modal__']";
	const node = await requireElement(selector);

	const button = findElement(".torn-btn", node, true);
	if (!button) return;

	if (button.textContent.trim() !== "Join fight") return;

	const warning = elementBuilder({
		type: "div",
		class: styles.ttPreventJoinAttack,
		text: "Blocked by TornTools. You are about to join an attack. Click here if you are sure to attack.",
	});
	warning.addEventListener("click", (event) => {
		// if (confirm("Are you sure you want to attack this ally?")) {
		confirmed = true;
		(event.currentTarget as Element).remove();
		// }
	});

	node.insertAdjacentElement("afterbegin", warning);
	inProgress = false;
}

export default class PreventJoinAttacksFeature extends Feature {
	constructor() {
		super("Prevent Join Attacks", "attacks", ExecutionTiming.IMMEDIATELY);
	}

	override precondition() {
		return getPageStatus().access && !isOwnProfile();
	}

	override isEnabled() {
		return settings.pages.profile.preventJoinAttacks;
	}

	override initialise() {
		startListener();
	}

	override async execute() {
		await disableAttackButton();
	}

	override storageKeys() {
		return ["settings.pages.profile.preventJoinAttacks"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}
