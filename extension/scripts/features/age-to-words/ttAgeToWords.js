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
		const dateCurrent = new Date();
		const utimeTarget = dateCurrent.getTime() + age * 86400 * 1000;
		const dateTarget = new Date(utimeTarget);
		let years = dateTarget.getUTCFullYear() - dateCurrent.getUTCFullYear();
		let months = dateTarget.getUTCMonth() - dateCurrent.getUTCMonth();
		let days = dateTarget.getUTCDate() - dateCurrent.getUTCDate();
		const daysInMonth = [31, dateTarget.getUTCFullYear() % 4 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		let parts;
		while (true) {
			// eslint-disable-line no-constant-condition
			parts = [];
			if (years > 0) parts.push(`${years} year${applyPlural(years)}`);

			if (months < 0) {
				years -= 1;
				months += 12;
				continue;
			}
			if (months > 0) parts.push(`${months} month${applyPlural(months)}`);

			if (days < 0) {
				months -= 1;
				days += daysInMonth[(11 + dateTarget.getUTCMonth()) % 12];
				continue;
			}
			if (days) parts.push(`${days} day${applyPlural(days)}`);
			break;
		}
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
