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
			await requireElement(".profile-information-wrapper .box-value");
		}
	);

	function addNotes() {
		const userID = getUserID();
		const { content } = createContainer("Profile Notes", {
			nextElement: document.find(".profile-wrapper.medals-wrapper"),
		});
		const textBox = document.newElement({ type: "textarea" });
		if (notes.profile[userID].text) textBox.value = notes.profile[userID].text;
		textBox.style.height = notes.profile[userID] && notes.profile[userID].height ? notes.profile[userID].height : "17px";
		content.appendChild(textBox);
		textBox.addEventListener("input", (event) =>
			ttStorage.change({
				notes: {
					profile: {
						[userID]: {
							text: event.target.value,
							height: event.target.style.height,
						},
					},
				},
			})
		);
		new MutationObserver(() => {
			ttStorage.change({
				notes: {
					profile: {
						[userID]: {
							text: findContainer("Profile Notes").find("textarea").value,
							height: event.target.style.height,
						},
					},
				},
			});
		}).observe(textBox, { attributes: true, attributeFilter: ["style"] });
	}

	function removeNotes() {
		removeContainer("Profile Notes");
	}

	function getUserID() {
		return document.find(".basic-info .user-info-value .bold").innerText.match(/(?<=\[).*(?=\])/g)[0];
	}
})();
