"use strict";

(async () => {
	featureManager.registerFeature(
		"Age to Words",
		"profile",
		() => settings.pages.profile.ageToWords,
		null,
		addWords,
		removeWords,
		{
			storage: ["settings.pages.profile.ageToWords"],
		},
		null
	);

	async function addWords() {
		const boxValue = await requireElement(".box-info.age .box-value");

		const ageDiv = document.find(".box-info.age");
		ageDiv.find(".box-name").classList.add("tt-hidden");
		const age = boxValue.textContent.getNumber();

		const now = new Date();
		const signupDate = new Date(now.getTime() - age * TO_MILLIS.DAYS);

		const { years, months, days } = calculateDatePeriod(signupDate, now);

		const parts = [
			years > 0 ? `${years} year${applyPlural(years)}` : "",
			months > 0 ? `${months} month${applyPlural(months)}` : "",
			days > 0 ? `${days} day${applyPlural(days)}` : "",
		];

		ageDiv.find(".block-value").insertAdjacentElement("afterend", document.newElement({ type: "div", text: parts.join(" "), class: "tt-age-text" }));
		ageDiv.find(".block-value").insertAdjacentElement("afterend", document.newElement("br"));
	}

	function removeWords() {
		const ageDiv = document.find(".box-info.age");
		ageDiv.find(".box-name").classList.remove("tt-hidden");
		ageDiv.findAll(".block-value + br").forEach((x) => x.remove());
		document.findAll(".tt-age-text").forEach((x) => x.remove());
	}
})();
