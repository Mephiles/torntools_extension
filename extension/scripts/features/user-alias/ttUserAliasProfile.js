"use strict";

(async () => {
	featureManager.registerFeature(
		"User Alias - Profile",
		"profile",
		() => Object.keys(settings.userAlias).length,
		null,
		addAlias,
		removeAlias,
		{
			storage: ["settings.userAlias"],
		},
		null,
	);

	async function addAlias() {
		removeAlias();

		const nameLi = await requireElement(".profile-container.basic-info .info-table > :first-child");
		const userID = nameLi.find(".user-info-value .bold").textContent.split("[")[1].getNumber();
		if (!settings.userAlias[userID]) return;

		const profileImg = document.find(".user.name");
		const aliasSpan = document.newElement({ type: "span", class: "tt-user-alias", text: settings.userAlias[userID].alias });
		profileImg.insertAdjacentElement("afterend", aliasSpan);

		const cloneLi = nameLi.cloneNode(true);
		cloneLi.classList.add("tt-alias");
		cloneLi.find(".user-information-section .bold").textContent = "Alias";
		cloneLi.find(".user-info-value .bold").textContent = settings.userAlias[userID].alias;
		nameLi.insertAdjacentElement("afterend", cloneLi);
	}

	function removeAlias() {
		document.findAll(".tt-alias, .tt-user-alias").forEach((x) => x.remove());
	}
})();
