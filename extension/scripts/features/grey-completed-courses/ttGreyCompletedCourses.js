"use strict";

(async () => {
	featureManager.registerFeature(
		"Grey Completed Courses",
		"education",
		() => settings.pages.education.greyOut,
		initialiseObserver,
		greyOut,
		removeGreying,
		{
			storage: ["settings.pages.education.greyOut"],
		},
		null
	);

	function initialiseObserver() {
		window.addEventListener("hashchange", greyOut, false);
	}

	async function greyOut() {
		await requireElement(".education .ajax-act");

		if (getHashParameters().get("step") === "main") {
			for (const category of document.findAll(".education .ajax-act")) {
				if (category.find(".progressbar").style.width === "100%") category.classList.add("tt-grey");
			}
		}
	}

	function removeGreying() {
		document.findAll(".tt-grey").forEach((x) => x.classList.remove("tt-grey"));
	}
})();
