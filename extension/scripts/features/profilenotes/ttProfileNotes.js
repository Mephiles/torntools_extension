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
		const textarea = document.newElement({ type: "textarea" });
		if (userID in notes.profile) {
			textarea.value = notes.profile[userID].text || "";
			textarea.style.height = notes.profile[userID].height || "17px";
		} else {
			textarea.value = "";
			textarea.style.height = "17px";
		}
		content.appendChild(textarea);
		textarea.addEventListener("input", (event) => saveNotes(event.target.value, event.target.style.height));

		new MutationObserver(() => saveNotes(textarea.value, textarea.style.height)).observe(textarea, { attributes: true, attributeFilter: ["style"] });

		function saveNotes(text, height) {
			ttStorage.change({ notes: { profile: { [userID]: { text, height } } } });
		}
	}

	function removeNotes() {
		removeContainer("Profile Notes");
	}

	function getUserID() {
		return document.find(".basic-info .user-info-value .bold").innerText.match(/(?<=\[).*(?=\])/g)[0];
	}
})();
