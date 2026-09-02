import "./age-to-words.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { applyPlural, convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { calculateDatePeriod, TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

async function addWords() {
	const boxValue = await requireElement(".box-info.age .box-value");

	const ageDiv = findElement(".box-info.age");
	findElement(".box-name", ageDiv).classList.add("tt-hidden");
	const age = convertToNumber(boxValue.textContent);

	const now = new Date();
	const signupDate = new Date(now.getTime() - age * TO_MILLIS.DAYS);

	const { years, months, days } = calculateDatePeriod(signupDate, now);

	const parts = [
		years > 0 ? `${years} year${applyPlural(years)}` : "",
		months > 0 ? `${months} month${applyPlural(months)}` : "",
		days > 0 ? `${days} day${applyPlural(days)}` : "",
	];

	findElement(".block-value", ageDiv).insertAdjacentElement("afterend", elementBuilder({ type: "div", text: parts.join(" "), class: "tt-age-text" }));
	findElement(".block-value", ageDiv).insertAdjacentElement("afterend", elementBuilder("br"));
}

export default class AgeToWordsFeature extends Feature {
	constructor() {
		super("Age to Words", "profile");
	}

	override isEnabled() {
		return settings.pages.profile.ageToWords;
	}

	override async execute() {
		await addWords();
	}

	override storageKeys() {
		return ["settings.pages.profile.ageToWords"];
	}
}
