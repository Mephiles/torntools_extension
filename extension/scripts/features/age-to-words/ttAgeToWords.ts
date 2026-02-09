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
})();
