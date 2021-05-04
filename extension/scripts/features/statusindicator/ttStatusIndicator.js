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

		const icon = document.find(".profile-container .row.basic-info > *:first-child");
		const clone = icon.cloneNode(true);
		clone.style.backgroundPosition = getComputedStyle(icon).backgroundPosition;
		clone.classList.add("tt-profile-icon");
		document.find("#skip-to-content").insertAdjacentElement("beforebegin", clone);
	}

	function removeIndicator() {
		const addedIcon = document.find("#skip-to-content").parentElement.find(".tt-profile-icon");
		if (addedIcon) addedIcon.remove();
	}
})();
