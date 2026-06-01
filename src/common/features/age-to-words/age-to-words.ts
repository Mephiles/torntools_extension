import { Feature } from "@features/feature";
import "./age-to-words.css";

import { settings } from "@utils/data/database";
import { elementBuilder, findAllElements } from "@utils/functions/dom";
import { applyPlural, convertToNumber } from "@utils/functions/formatting";
import { requireElement } from "@utils/functions/requires";
import { calculateDatePeriod, TO_MILLIS } from "@utils/functions/utilities";

async function addWords() {
	const boxValue = await requireElement(".box-info.age .box-value");

	const ageDiv = document.querySelector(".box-info.age");
	ageDiv.querySelector(".box-name").classList.add("tt-hidden");
	const age = convertToNumber(boxValue.textContent);

	const now = new Date();
	const signupDate = new Date(now.getTime() - age * TO_MILLIS.DAYS);

	const { years, months, days } = calculateDatePeriod(signupDate, now);

	const parts = [
		years > 0 ? `${years} year${applyPlural(years)}` : "",
		months > 0 ? `${months} month${applyPlural(months)}` : "",
		days > 0 ? `${days} day${applyPlural(days)}` : "",
	];

	ageDiv.querySelector(".block-value").insertAdjacentElement("afterend", elementBuilder({ type: "div", text: parts.join(" "), class: "tt-age-text" }));
	ageDiv.querySelector(".block-value").insertAdjacentElement("afterend", elementBuilder("br"));
}

function removeWords() {
	const ageDiv = document.querySelector(".box-info.age");
	ageDiv.querySelector(".box-name").classList.remove("tt-hidden");
	findAllElements(".block-value + br", ageDiv).forEach((x) => x.remove());
	findAllElements(".tt-age-text").forEach((x) => x.remove());
}

export default class AgeToWordsFeature extends Feature {
	constructor() {
		super("Age to Words", "profile");
	}

	isEnabled() {
		return settings.pages.profile.ageToWords;
	}

	async execute() {
		await addWords();
	}

	cleanup() {
		removeWords();
	}

	storageKeys() {
		return ["settings.pages.profile.ageToWords"];
	}
}
