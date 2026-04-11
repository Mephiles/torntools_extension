import "./easter-eggs.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { isEventActive, TORN_EVENTS } from "@/utils/common/functions/torn";

const EGG_SELECTOR = "#easter-egg-hunt-root [class*='eggContainer__']";

function initialiseDetector() {
	const container = document.querySelector("#mainContainer");

	if (container) {
		new MutationObserver(async (mutations, observer) => {
			for (const node of mutations.flatMap((mutation) => Array.from(mutation.addedNodes))) {
				if (!isElement(node)) continue;

				if (node.matches(EGG_SELECTOR) || node.querySelector(EGG_SELECTOR)) {
					await highlightEgg(node.matches(EGG_SELECTOR) ? node : node.querySelector(EGG_SELECTOR));
					observer.disconnect();
					break;
				}
			}
		}).observe(container, { childList: true });
	}
}

async function enableDetector() {
	document.body.classList.add("tt-easter-highlight");

	await Promise.all(findAllElements(EGG_SELECTOR).map(highlightEgg));
}

async function highlightEgg(egg: Element) {
	if (settings.pages.competitions.easterEggsAlert) {
		alert("TornTools detected an easter egg on this page.");
	}

	const locationText = calculateLocation(await requireElement(`${EGG_SELECTOR} img`));

	document.querySelector(".tt-overlay").classList.remove("tt-hidden");
	document.querySelector<HTMLElement>(".tt-overlay").style.zIndex = "999";

	const popup = elementBuilder({
		type: "div",
		id: "tt-easter-popup",
		class: "tt-overlay-item",
		events: { click: removePopup },
		children: [
			elementBuilder({ type: "div", text: "Detected an easter egg!" }),
			elementBuilder({ type: "div", text: `It's located near the ${locationText} of your screen.` }),
			elementBuilder({
				type: "div",
				text: "NOTE: Clicking on invisible eggs is a bad idea. It will decrease your spawn rates going forward. We try to detect and ignore them, occasionally one might still be highlighted.",
			}),
			elementBuilder({ type: "button", class: "tt-button-link", text: "Close" }),
		],
	});

	document.body.appendChild(popup);

	window.addEventListener("beforeunload", (event) => {
		if (egg.isConnected) {
			event.preventDefault();
			event.returnValue = "Egg present.";
		}
	});

	function removePopup() {
		document.querySelector(".tt-overlay").classList.add("tt-hidden");
		document.querySelector<HTMLElement>(".tt-overlay").style = "";
		popup.remove();
	}
}

function calculateLocation(element: Element) {
	const { left, top, width, height } = element.getBoundingClientRect();

	const centerX = left + width / 2;
	const centerY = top + height / 2;

	const innerHeight = window.innerHeight;
	const innerWidth = window.innerWidth;

	const relativeHeight = centerY / innerHeight;
	const relativeWidth = centerX / innerWidth;

	let verticalText: string, horizontalText: string;

	if (relativeHeight < 0.25) verticalText = "top";
	else if (relativeHeight > 0.75) verticalText = "bottom";
	else verticalText = "center";

	if (relativeWidth < 0.3) horizontalText = "left";
	else if (relativeWidth > 0.7) horizontalText = "right";
	else horizontalText = "center";

	let text: string;
	if (verticalText === horizontalText) text = verticalText;
	else text = `${verticalText} ${horizontalText}`;

	if (relativeWidth > 1 || relativeWidth < 0 || relativeHeight > 1 || relativeHeight < 0) text += " (offscreen)";

	return text;
}

export default class EasterEggsFeature extends Feature {
	constructor() {
		super("Easter Eggs", "event");
	}

	precondition() {
		return isEventActive(TORN_EVENTS.EASTER_EGG_HUNT, true);
	}

	isEnabled() {
		return settings.pages.competitions.easterEggs;
	}

	initialise() {
		initialiseDetector();
	}

	async execute() {
		await enableDetector();
	}

	cleanup() {
		document.body.classList.remove("tt-easter-highlight");
		const popup = document.querySelector("#tt-easter-popup");
		if (popup) popup.remove();
	}

	storageKeys() {
		return ["settings.pages.competitions.easterEggs"];
	}
}
