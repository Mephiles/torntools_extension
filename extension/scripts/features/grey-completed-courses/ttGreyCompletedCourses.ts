(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Grey Completed Courses",
		"education",
		() => settings.pages.education.greyOut,
		null,
		greyOut,
		removeGreying,
		{
			storage: ["settings.pages.education.greyOut"],
		},
		null
	);

	async function greyOut() {
		await requireElement("#education-root [class*='categoryItem__']");

		for (const category of findAllElements("#education-root [class*='categoryItem__']")) {
			if (category.querySelector("[class*='progressCounter__'] [class*='checkIconContainer__']")) category.classList.add("tt-grey");
		}
	}

	function removeGreying() {
		findAllElements(".tt-grey").forEach((x) => x.classList.remove("tt-grey"));
	}
})();
