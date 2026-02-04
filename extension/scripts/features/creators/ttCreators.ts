(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature("Creators", "profile", () => true, undefined, showCreators);

	async function showCreators() {
		const id = parseInt(
			(await requireElement(".basic-information .profile-container ul.info-table .user-info-value > *:first-child")).textContent.match(
				/(?<=\[)\d*(?=])/i
			)[0]
		);

		const creator = TEAM.find(({ torn }) => torn === id);
		if (!creator?.core) return;

		const title = Array.isArray(creator.title) ? creator.title[0] : creator.title;

		document.querySelector(".content-wrapper .content-title").insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "div",
				class: "tt-creator",
				children: [ttSvg(), elementBuilder({ type: "span", text: title })],
			})
		);
	}
})();
