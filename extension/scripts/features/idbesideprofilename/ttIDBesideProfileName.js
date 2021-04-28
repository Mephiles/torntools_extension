"use strict";

(async () => {
	featureManager.registerFeature(
		"ID beside Profile Name",
		"profile",
		() => settings.pages.profile.idBesideProfileName,
		null,
		addID,
		removeID,
		{
			storage: ["settings.pages.profile.idBesideProfileName"],
		},
		async () => {
			await requireElement(".basic-info .info-table > *:first-child");
		}
	);

	function addID() {
		const skipToContent = document.find("h4#skip-to-content");
		skipToContent.innerHTML = `${skipToContent.innerHTML.replace("'s Profile", "")} [${getUserID()}]`;
	}

	function removeID() {
		const skipToContent = document.find("h4#skip-to-content");
		skipToContent.innerText = skipToContent.innerText.replace(/ \[.*\]/g, "") + "'s Profile";
	}

	function getUserID() {
		return document.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").innerText.replace(/\D+/g, "");
	}
})();
