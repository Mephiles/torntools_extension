"use strict";

(async () => {
	featureManager.registerFeature(
		"Hide Casino Games",
		"casino",
		() => !!settings.hideCasinoGames.length,
		null,
		hideCasinoGames,
		unhideCasinoGames,
		{
			storage: ["settings.pages.sidebar.collapseAreas"],
		},
		async () => {
			if (await checkMobile()) return "Not supported on mobile!";

			await requireSidebar();

			if (document.find("#sidebarroot .tablet")) return "Already collapsible.";
		}
	);

	function hideCasinoGames() {
		document.find(".msg.right-round").appendChild(
			document.newElement({
				type: "div",
				html: "<span class='tt-msg'>Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.</span>",
			})
		);
		for (const gameClass of settings.hideCasinoGames) {
			document.find(`.${gameClass}`).parentElement.classList.add("tt-hidden-parent");
			document.find(`.${gameClass}`).insertAdjacentHTML(
				"beforebegin",
				"<div class='tt-hidden'><span><b>•&nbsp;REMOVED&nbsp;•</b></span></div>"
			);
			document.find(`.${gameClass}`).classList.add("hidden");
		}
	}

	function unhideCasinoGames() {
		document.find(".msg .tt-msg").remove();
		document.find(".tt-hidden-parent").classList.remove("tt-hidden-parent");
		document.find(".tt-hidden").remove();
		document.findAll(".games-list .hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
