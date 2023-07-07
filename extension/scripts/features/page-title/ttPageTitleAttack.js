"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Page Title",
		"global",
		() => settings.pages.global.pageTitles,
		undefined,
		setTitle,
		reset,
		{
			storage: ["settings.pages.global.pageTitles"],
		},
		undefined,
	);

	let original = document.title;

	async function setTitle() {
		const name = await requireElement("#defender .user-name");

		if (!original) original = document.title;
		document.title = `${name.textContent} | Attack`;
	}

	function reset() {
		document.title = original;
	}
})();
