"use strict";

(async () => {
	featureManager.registerFeature(
		"Profile ID",
		"profile",
		() => settings.pages.profile.idBesideProfileName,
		null,
		addID,
		removeID,
		{
			storage: ["settings.pages.profile.idBesideProfileName"],
		},
		null
	);

	async function addID() {
		await requireElement(".basic-info .info-table > *:first-child");

		const title = document.find("h4#skip-to-content");
		title.innerHTML = `${title.innerHTML.trim().match(/(.*)'s? Profile/i)[1]} [${getUserID()}]`;
	}

	function removeID() {
		const title = document.find("h4#skip-to-content");

		const name = title.innerText.replace(/ \[.*]/g, "");
		title.innerText = `${name}'${name.endsWith("s") ? "" : "s"} Profile`;
	}

	function getUserID() {
		return parseInt(
			document
				.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child")
				.innerText.trim()
				.match(/\[([0-9]*)]/i)[1]
		);
	}
})();
