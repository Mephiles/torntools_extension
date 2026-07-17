import "./travel-cooldowns.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements, mobile, tabletVertical } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { textToTime } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, hasFinishedEducation, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListeners() {
	const handler = async () => {
		if (!FEATURE_MANAGER.isEnabled(TravelCooldownsFeature)) return;

		await showWarnings();
	};

	if (mobile || tabletVertical) {
		addCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, handler);
		addCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, handler);
	} else {
		addCustomListener(EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE, handler);
	}
}

async function showWarnings() {
	const container = await requireElement(
		mobile || tabletVertical ? "[class*='destinationList___'] .expanded[class*='destination___']" : "[class*='destinationPanel___']",
	);
	if (!container) return;

	const durationText = container.querySelector(
		["[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]", "[class*='confirmPanel___'] p:nth-child(2) [class*='emphasis___']"].join(", "),
	)?.textContent;
	if (!durationText) return;

	const duration = textToTime(durationText) * 2;
	let cooldowns = container.parentElement.querySelector(".tt-cooldowns");
	if (!cooldowns) {
		cooldowns = elementBuilder({
			type: "div",
			class: "tt-cooldowns",
			children: [
				elementBuilder({
					type: "div",
					class: "travel-wrap",
					children: [
						elementBuilder({
							type: "div",
							class: ["cooldown", "energy", getDurationClass(userdata.energy.fulltime)],
							text: "Energy",
						}),
						elementBuilder({ type: "div", class: ["cooldown", "nerve", getDurationClass(userdata.nerve.fulltime)], text: "Nerve" }),
						elementBuilder({ type: "div", class: ["cooldown", "drug", getDurationClass(userdata.cooldowns.drug)], text: "Drug" }),
						elementBuilder({
							type: "div",
							class: ["cooldown", "booster", getDurationClass(userdata.cooldowns.booster)],
							text: "Booster",
						}),
						elementBuilder({
							type: "div",
							class: ["cooldown", "medical", getDurationClass(userdata.cooldowns.medical)],
							text: "Medical",
						}),
					],
				}),
				elementBuilder({ type: "div", class: "patter-right" }),
				elementBuilder({ type: "div", class: "clear" }),
			],
		});

		if (!mobile && !tabletVertical) container.insertAdjacentElement("beforebegin", cooldowns);
		else {
			container.querySelector("[class*='expandable___']").insertAdjacentElement("afterend", cooldowns);
		}

		if (!hasFinishedEducation() || !userdata.education.current)
			cooldowns.insertAdjacentElement(
				"afterend",
				elementBuilder({
					type: "div",
					class: ["cooldown", "education", getDurationClass(userdata.education.current.until - userdata.date / 1000)],
					text: "Your education course will end before you return!",
				}),
			);

		const investmentMessage =
			userdata.money.city_bank && userdata.money.city_bank.until * 1000 <= Date.now()
				? "Your bank will be ready for investment before you return!"
				: "You have no bank investment going on.";
		cooldowns.insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: ["cooldown", "investment", getDurationClass(userdata.money.city_bank ? userdata.money.city_bank.until - userdata.date / 1000 : 0)],
				text: investmentMessage,
			}),
		);
	} else {
		handleClass(cooldowns.querySelector(".energy"), userdata.energy.fulltime);
		handleClass(cooldowns.querySelector(".nerve"), userdata.nerve.fulltime);
		handleClass(cooldowns.querySelector(".drug"), userdata.cooldowns.drug);
		handleClass(cooldowns.querySelector(".booster"), userdata.cooldowns.booster);
		handleClass(cooldowns.querySelector(".medical"), userdata.cooldowns.medical);
		if (!hasFinishedEducation())
			handleClass(
				cooldowns.parentElement.querySelector(".education"),
				userdata.education.current ? userdata.education.current.until - userdata.date / 1000 : 0,
			);
		handleClass(cooldowns.parentElement.querySelector(".investment"), userdata.money.city_bank ? userdata.money.city_bank.until - userdata.date / 1000 : 0);
	}

	function getDurationClass(time: number) {
		return time * 1000 < duration ? "waste" : "";
	}

	function handleClass(element: HTMLElement, time: number) {
		if (!element) return;

		const isWasted = time * 1000 < duration;

		if (isWasted !== element.classList.contains("waste")) element.classList.toggle("waste");
	}
}

function removeWarnings() {
	findAllElements(".tt-cooldowns, .tt-cooldowns ~ .cooldown").forEach((cooldown) => cooldown.remove());
}

export default class TravelCooldownsFeature extends Feature {
	constructor() {
		super("Travel Cooldowns", "travel");
	}

	precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	requirements() {
		if (
			!hasAPIData() ||
			!settings.apiUsage.user.bars ||
			!settings.apiUsage.user.cooldowns ||
			!settings.apiUsage.user.education ||
			!settings.apiUsage.user.money
		)
			return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.travel.cooldownWarnings;
	}

	storageKeys() {
		return ["settings.pages.travel.cooldownWarnings"];
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await showWarnings();
	}

	cleanup() {
		removeWarnings();
	}
}
