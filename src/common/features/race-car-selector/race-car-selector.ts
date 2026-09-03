import { TRACKS } from "@common/pages/racing-page.ts";
import type { TrackData } from "@common/pages/racing-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context.ts";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api.ts";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events.ts";
import { findElement } from "@common/utils/functions/find-elements";
import { getPageStatus, getRFC } from "@common/utils/functions/torn";
import { PHFillCaretDown, PHFillCaretRight } from "@common/utils/icons/phosphor-icons.ts";
import { Feature } from "@features/feature";
import styles from "./race-car-selector.module.css";

const CUSTOM_RACES: Record<number, string> = {};

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.RACING__CUSTOM_RACES__LIST, () => {
		const list = findElement(".events-list", true);
		if (!list) return;

		new MutationObserver(() => {
			const activeRow = findElement(".active-row", list, true);
			if (!activeRow) return;

			const trackElement = findElement(".track", activeRow);
			const track = trackElement.childNodes[0].textContent!.trim();

			const joinLinkElement = findElement<HTMLAnchorElement>("a[step-value='chooseRacingCar']", activeRow, true);
			if (joinLinkElement) {
				const joinParams = new URL(joinLinkElement.href).searchParams;
				const id = parseInt(joinParams.get("id")!);

				CUSTOM_RACES[id] = track;
			}

			const passwordForm = findElement(".join-password-form", activeRow, true);
			if (passwordForm) {
				const idInput = findElement("input[name='id']", passwordForm);
				const id = parseInt(idInput.getAttribute("value")!);

				CUSTOM_RACES[id] = track;
			}
		}).observe(list, { subtree: true, attributes: true, attributeFilter: ["class"] });
	});
	addCustomListener(EVENT_CHANNELS.RACING__SELECT_CAR_CUSTOM, async ({ id }) => {
		if (!FEATURE_MANAGER.isEnabled(RaceCarSelectorFeature)) return;

		const trackName = CUSTOM_RACES[id];

		await selectCar(TRACKS.find(({ name }) => name.toLowerCase() === trackName?.toLowerCase()));
	});
	addCustomListener(EVENT_CHANNELS.RACING__SELECT_CAR_CUSTOM_CREATED, async ({ trackId }) => {
		if (!FEATURE_MANAGER.isEnabled(RaceCarSelectorFeature)) return;

		await selectCar(TRACKS.find(({ id }) => id === trackId));
	});
	addCustomListener(EVENT_CHANNELS.RACING__CHANGE_CAR, async () => {
		if (!FEATURE_MANAGER.isEnabled(RaceCarSelectorFeature)) return;

		const trackElement = findElement(".enlisted-btn-wrap", true);
		const trackName = trackElement?.textContent.split("-")?.[0].trim();

		await selectCar(TRACKS.find(({ name }) => name.toLowerCase() === trackName?.toLowerCase()));
	});
}

async function selectCar(track: TrackData | undefined) {
	findElement(`.${styles.preferredCar}`, true)?.remove();

	if (!track) return;

	const carId = settings.pages.racing.trackCars[track.id];
	if (!carId) return;

	const car = userdata.enlistedcars?.find(({ id }) => id === carId);
	if (!car) return;

	let url: string;
	const joinAction = findElement<HTMLAnchorElement>(".btn-action-joinRace", true);
	if (joinAction)
		url = `/page.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=${new URL(joinAction.href).searchParams.get("id")}&carID=${car.id}&rfcv=${getRFC()}`;
	else url = `/page.php?sid=racing&tab=cars&section=changeRacingCar&step=changeRacingCar&id=${car.id}`;

	findElement(".enlist-wrap").insertAdjacentElement(
		"afterbegin",
		elementBuilder({
			type: "a",
			text: "Use your preferred car for this race",
			class: [styles.preferredCar, "btn-action-joinRace"],
			href: url,
		}),
	);
	hideEnlistedCars();
}

function hideEnlistedCars() {
	const wrapper = findElement(".enlist-wrap", true);
	if (!wrapper) return;

	const title = findElement(".title-black:has(+ .enlist:last-child)", wrapper);
	let icon = PHFillCaretRight();

	title.addEventListener("click", () => {
		const newState = wrapper.classList.toggle(styles.shown);

		const newIcon = newState ? PHFillCaretDown() : PHFillCaretRight();
		icon.replaceWith(newIcon);
		icon = newIcon;
	});
	title.appendChild(icon);

	wrapper.classList.add(styles.carSelected);
}

export default class RaceCarSelectorFeature extends Feature {
	constructor() {
		super("Race Car Selector", "racing");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.enlistedcars) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.racing.carSelector;
	}

	override initialise() {
		initialiseListeners();
	}

	override storageKeys() {
		return ["settings.pages.racing.carSelector"];
	}
}
