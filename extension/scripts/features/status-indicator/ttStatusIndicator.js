"use strict";

(async () => {
	if (!getPageStatus().access) return;

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
		const basicInfo = await requireElement(".profile-container .row.basic-info > *:first-child");

		document.find("#skip-to-content").insertAdjacentElement(
			"beforebegin",
			document.newElement({
				type: "ul",
				class: "big tt-profile-icon",
				children: [basicInfo.cloneNode(true)],
			})
		);
	}

	function removeIndicator() {
		const addedIcon = document.find("#skip-to-content").parentElement.find(".tt-profile-icon");
		if (addedIcon) addedIcon.remove();
	}
})();
