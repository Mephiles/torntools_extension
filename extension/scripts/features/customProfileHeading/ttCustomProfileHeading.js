"use strict";

(async () => {
	featureManager.registerFeature(
		"Custom Profile Heading",
		"profile",
		() => settings.pages.profile.customProfileHeading,
		null,
		customHeading,
		removeCustomHeading,
		{
			storage: ["settings.pages.profile.customProfileHeading"],
		},
		async () => {
			await requireElement(".profile-container .row.basic-info > *:first-child");
		}
	);

	function customHeading() {
		const skipToContent = document.find("h4#skip-to-content");
		const onlOrOffIcon = document.find(".profile-container .row.basic-info > *:first-child");
		const onlOrOffIconClone = onlOrOffIcon.cloneNode(true);
		const backgroundPos = getComputedStyle(onlOrOffIcon).backgroundPosition;
		onlOrOffIconClone.style.backgroundPosition = backgroundPos;
		onlOrOffIconClone.classList.add("tt-profile-icon");
		skipToContent.innerHTML = `${skipToContent.innerHTML.replace("'s Profile", "")} [${getUserID()}]`;
		skipToContent.insertAdjacentElement("beforeBegin", onlOrOffIconClone);
	}

	function removeCustomHeading() {
		const skipToContent = document.find("h4#skip-to-content");
		skipToContent.innerText = skipToContent.innerText.replace(/ \[.*\]/g, "");
		skipToContent.parentElement.find(".tt-profile-icon").remove();
	}
	
	function getUserID() {
		return document.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").innerText.replace(/\D+/g, "");
	}
})();
