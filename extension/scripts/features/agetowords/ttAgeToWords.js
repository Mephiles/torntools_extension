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
		null,
	);

	async function addWords() {
		document.findAll(".box-name.t-gray-9.bold")[2].remove();
		const newAge = document.newElement({ type: "div", class: "box-name t-gray-9 bold" });
		const age = parseInt([...document.findAll(".box-info.age .digit")].map((x) => x.innerText).join(""));
		let dateCurrent = new Date();
		let utimeTarget = dateCurrent.getTime() + age * 86400 * 1000;
		let dateTarget = new Date(utimeTarget);
		let diffYear = parseInt(dateTarget.getUTCFullYear() - dateCurrent.getUTCFullYear());
		let diffMonth = parseInt(dateTarget.getUTCMonth() - dateCurrent.getUTCMonth());
		let diffDay = parseInt(dateTarget.getUTCDate() - dateCurrent.getUTCDate());
		let daysInMonth = [31, dateTarget.getUTCFullYear() % 4 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		let dateString = "";
		while (true) {
			dateString = "";
			dateString += diffYear > 0 ? diffYear + " years " : "";

			if (diffMonth < 0) {
				diffYear -= 1;
				diffMonth += 12;
				continue;
			}
			dateString += diffMonth > 0 ? diffMonth + " months " : "";

			if (diffDay < 0) {
				diffMonth -= 1;
				diffDay += daysInMonth[(11 + dateTarget.getUTCMonth()) % 12];
				continue;
			}
			dateString += diffDay > 0 ? diffDay + " days" : "";
			break;
		}
		newAge.innerText = dateString;
		document.find(".box-info.age").find(".block-value").insertAdjacentElement("afterEnd", newAge);
		newAge.insertAdjacentHTML("beforeBegin", "<br>");
	}

	function removeWords() {
		document.find(".tt-bazaar-text").remove();
	}
})();
