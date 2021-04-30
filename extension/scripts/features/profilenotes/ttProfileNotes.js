"use strict";

(async () => {
	featureManager.registerFeature(
		"Profile Notes",
		"profile",
		() => settings.pages.profile.notes,
		null,
		addNotes,
		removeNotes,
		{
			storage: ["settings.pages.profile.notes"],
		},
		async () => {
			await requireElement(".profile-wrapper.m-top10:not(.medals-wrapper)");
		}
	);

	function addNotes() {
		const { content } = createContainer("Profile Notes", {
			nextElement: document.find(".profile-wrapper.m-top10:not(.medals-wrapper)"),
		});
		const textBox = document.nextElement({ type: "textarea" });
		content.appendChild(textBox);
		textBox.addEventListener("input", (event) => = event.target.value);
	}

	function removeNotes() {
		
	}
})();
