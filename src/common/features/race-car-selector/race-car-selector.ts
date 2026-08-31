import { TRACKS } from "@common/pages/racing-page.ts";
import type { TrackData } from "@common/pages/racing-page.ts";
import { FEATURE_MANAGER } from "@common/utils/context.ts";
import { settings, userdata } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events.ts";
import { getPageStatus, getRFC } from "@common/utils/functions/torn";
import { PHFillCaretDown, PHFillCaretRight } from "@common/utils/icons/phosphor-icons.ts";
import { Feature } from "@features/feature";
import styles from "./race-car-selector.module.css";

const CUSTOM_RACES: Record<number, string> = {};

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.RACING__CUSTOM_RACES__LIST, () => {
		const list = document.querySelector(".events-list");
		if (!list) return;

		new MutationObserver(() => {
			const activeRow = list.querySelector(".active-row");
			if (!activeRow) return;

			const trackElement = activeRow.querySelector(".track");
			const track = trackElement.childNodes[0].textContent.trim();

			const joinLinkElement = activeRow.querySelector<HTMLAnchorElement>("a[step-value='chooseRacingCar']");
			if (joinLinkElement) {
				const joinParams = new URL(joinLinkElement.href).searchParams;
				const id = parseInt(joinParams.get("id"));

				CUSTOM_RACES[id] = track;
			}

			const passwordForm = activeRow.querySelector(".join-password-form");
			if (passwordForm) {
				const idInput = passwordForm.querySelector("input[name='id']");
				const id = parseInt(idInput.getAttribute("value"));

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

		const trackElement = document.querySelector(".enlisted-btn-wrap");
		const trackName = trackElement?.textContent.split("-")?.[0].trim();

		await selectCar(TRACKS.find(({ name }) => name.toLowerCase() === trackName?.toLowerCase()));
	});
}

async function selectCar(track: TrackData | undefined) {
	document.querySelector(`.${styles.preferredCar}`)?.remove();

	if (!track) return;

	const carId = settings.pages.racing.trackCars[track.id];
	if (!carId) return;

	const car = userdata.enlistedcars?.find(({ id }) => id === carId);
	if (!car) return;

	let url: string;
	const joinAction = document.querySelector<HTMLAnchorElement>(".btn-action-joinRace");
	if (joinAction)
		url = `/page.php?sid=racing&tab=customrace&section=getInRace&step=getInRace&id=${new URL(joinAction.href).searchParams.get("id")}&carID=${car.id}&rfcv=${getRFC()}`;
	else url = `/page.php?sid=racing&tab=cars&section=changeRacingCar&step=changeRacingCar&id=${car.id}`;

	document.querySelector(".enlist-wrap").insertAdjacentElement(
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
	const wrapper = document.querySelector(".enlist-wrap");
	if (!wrapper) return;

	const title = wrapper.querySelector<HTMLElement>(".title-black:has(+ .enlist:last-child)");
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

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.racing.carSelector;
	}

	initialise() {
		initialiseListeners();
	}

	storageKeys() {
		return ["settings.pages.racing.carSelector"];
	}
}
