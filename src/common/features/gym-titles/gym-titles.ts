import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { buildGymTitleHTML, parseGymTitleLabel } from "@features/gym-titles/gym-title-label";
import styles from "./gym-titles.module.css";

const LOCKED_GYM_SELECTOR = "button[class*='gymButton_'][class*='locked_']";
const PROCESSED_CLASS = "tt-gym-title";

let observedRoot: HTMLElement | null = null;
let observer: MutationObserver | null = null;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.GYM_LOAD, applyTitles);
}

async function applyTitles() {
	const gymRoot = await requireElement("#gymroot");
	observeGymRoot(gymRoot);

	for (const gym of findAllElements(`.${PROCESSED_CLASS}`, gymRoot)) {
		if (gym.matches(LOCKED_GYM_SELECTOR)) continue;

		gym.removeAttribute("title");
		gym.classList.remove(PROCESSED_CLASS);
	}

	for (const gym of findAllElements(`${LOCKED_GYM_SELECTOR}:not(.${PROCESSED_CLASS})`, gymRoot)) {
		const label = gym.getAttribute("aria-label");
		const parsed = label ? parseGymTitleLabel(label) : null;
		if (!parsed) continue;

		gym.title = buildGymTitleHTML(parsed, { tooltip: styles.gymTooltip, name: styles.gymName, info: styles.gymInfo });
		gym.classList.add(PROCESSED_CLASS);
	}
}

function observeGymRoot(gymRoot: HTMLElement) {
	if (observedRoot === gymRoot && observer) return;

	observer?.disconnect();
	observedRoot = gymRoot;
	observer = new MutationObserver(() => void applyTitles());
	observer.observe(gymRoot, { childList: true, subtree: true });
}

export default class GymTitlesFeature extends Feature {
	constructor() {
		super("Gym Titles", "gym");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.gym.titles;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await applyTitles();
	}

	override storageKeys() {
		return ["settings.pages.gym.titles"];
	}
}
