"use strict";

(async () => {
	featureManager.registerFeature(
		"Status Indicator",
		"profile",
		() => settings.pages.profile.statusIndicator,
		null,
		addIndicator,
		removeIndicator,
		{
			storage: ["settings.pages.profile.statusIndicator"],
		},
		async () => {}
	);

	async function addIndicator() {
		await requireElement(".profile-container .row.basic-info > *:first-child");

		const skipToContent = document.find("h4#skip-to-content");
		const onlOrOffIcon = document.find(".profile-container .row.basic-info > *:first-child");
		const onlOrOffIconClone = onlOrOffIcon.cloneNode(true);
		const backgroundPos = getComputedStyle(onlOrOffIcon).backgroundPosition;
		onlOrOffIconClone.style.backgroundPosition = backgroundPos;
		onlOrOffIconClone.classList.add("tt-profile-icon");
		skipToContent.insertAdjacentElement("beforeBegin", onlOrOffIconClone);
	}

	function removeIndicator() {
		const addedIcon = document.find("h4#skip-to-content").parentElement.find(".tt-profile-icon");
		if (addedIcon) addedIcon.remove();
	}

	function getUserID() {
		return document.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").innerText.replace(/\D+/g, "");
	}
})();
