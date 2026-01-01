(async () => {
	if (!getPageStatus().access) return;

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
		title.textContent = `${title.textContent.trim().match(/(.*)'s? Profile/i)[1]} [${getUserID()}]`;
		title.setAttribute("title", "Click to copy.");
		title.addEventListener("click", copyID);
	}

	function removeID() {
		const title = document.find("h4#skip-to-content");

		const name = title.textContent.replace(/ \[.*]/g, "");
		title.textContent = `${name}'${name.endsWith("s") ? "" : "s"} Profile`;
		title.removeAttribute("title");
		title.removeEventListener("click", copyID);
	}

	function copyID() {
		toClipboard(document.find("h4#skip-to-content").textContent);
	}

	function getUserID() {
		return parseInt(
			document.find(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").textContent.match(/(?<=\[)\d*(?=])/i)[0]
		);
	}
})();
