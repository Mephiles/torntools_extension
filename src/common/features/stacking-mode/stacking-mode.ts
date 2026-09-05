import "./stacking-mode.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPage, isOwnProfile } from "@common/utils/functions/torn";
import { PHX } from "@common/utils/icons/phosphor-icons.ts";
import { Feature } from "@features/feature";

let currentPage: string;

function registerListeners() {
	if (currentPage === "hospital") {
		addCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, disableReviving);
	}

	addFetchListener(async (event) => {
		if (!FEATURE_MANAGER.isEnabled(StackingModeFeature)) return;

		const { page, fetch } = event.detail;
		if (page !== "page") return;

		const sid = new URL(fetch.url).searchParams.get("sid");
		if (sid !== "UserMiniProfile") return;

		const miniProfile = await requireElement("#profile-mini-root .mini-profile-wrapper");
		const attackButton = await requireElement(".profile-button-attack", { parent: miniProfile });
		attackButton.classList.add("tt-mouse-block");
		attackButton.appendChild(stackBlockSvg("stack-profile-block"));

		if (findElement(".profile-container", miniProfile).classList.contains("hospital")) {
			const reviveButton = await requireElement(".profile-button-revive", { parent: miniProfile });
			reviveButton.classList.add("tt-mouse-block");
			reviveButton.appendChild(stackBlockSvg("stack-profile-block"));
		}
	});
}

let hiddenDivs: Element[] = [];
async function disableUsage() {
	// Disable hunting link in sidebar, when abroad
	if (currentPage === "home" && document.body.dataset.country === "south-africa") {
		const huntingSidebar = await requireElement("#nav-hunting");
		hiddenDivs.push(huntingSidebar);
		huntingSidebar.classList.add("tt-hidden");
	}

	if (currentPage === "gym") {
		await disableSection("#gymroot");
	} else if (currentPage === "hunting") {
		await disableSection(".hunt");
	} else if (currentPage === "attack") {
		await disableSection("[class*='coreWrap__']");
	} else if (currentPage === "dump") {
		await disableSection(".dump-main-page");
	} else if (currentPage === "profiles") {
		await requireElement("#profileroot .profile-button-personalStats");

		findAllElements(".profile-button-attack, .profile-button-revive")
			.filter((button) => !button.classList.contains("cross"))
			.forEach((button) => {
				button.classList.add("tt-mouse-block");
				button.appendChild(stackBlockSvg("stack-profile-block"));
			});
	} else if (currentPage === "hospital") {
		await disableReviving();
	} else if (currentPage === "abroad-people") {
		await disableAttacking();
	}

	function createBlock() {
		return elementBuilder({
			type: "div",
			class: "tt-stack-block",
			children: [elementBuilder({ type: "span", text: "TornTools - You've enabled stacking mode." })],
		});
	}

	async function disableSection(selector: string) {
		const section = await requireElement(selector);
		hiddenDivs.push(section);
		section.classList.add("tt-hidden");
		section.insertAdjacentElement("beforebegin", createBlock());
	}

	async function disableAttacking() {
		await requireElement(".users-list > li .attack");
		findAllElements(".users-list > li .attack").forEach((btn) => {
			btn.classList.add("tt-mouse-block");
			btn.appendChild(stackBlockSvg("tt-attack-block"));
		});
	}
}

async function disableReviving() {
	await requireElement(".user-info-list-wrap > li .user.name");
	findAllElements("a.revive:not(.reviveNotAvailable)").forEach((button) => {
		button.classList.add("tt-mouse-block");
		findElement(".revive-icon", button).appendChild(stackBlockSvg("tt-revive-block"));
	});
}

function stackBlockSvg(customClass?: string) {
	const svg = PHX();
	svg.classList.add("tt-stacking");
	if (customClass) svg.classList.add(customClass);
	return svg;
}

export default class StackingModeFeature extends Feature {
	constructor() {
		super("Stacking Mode", "global");
	}

	override precondition() {
		return getPage() !== "profiles" || !isOwnProfile();
	}

	override isEnabled(): boolean {
		return settings.pages.global.stackingMode;
	}

	override storageKeys(): string[] {
		return ["settings.pages.global.stackingMode"];
	}

	override initialise() {
		currentPage = getPage();
		registerListeners();
	}

	override async execute() {
		await disableUsage();
	}
}
