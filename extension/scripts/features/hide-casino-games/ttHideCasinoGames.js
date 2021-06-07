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
			storage: ["settings.hideCasinoGames"],
		},
		null
	);

	function hideCasinoGames() {
		const msg = document.find(".msg.right-round");
		if (!msg.find(".tt-msg")) {
			msg.appendChild(
				document.newElement({
					type: "div",
					html: "<span class='tt-msg'>Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.</span>",
				})
			);
		}
		document.findAll(".games-list .hidden").forEach((game) => {
			game.parentElement.classList.remove("tt-hidden-parent");
			game.classList.remove("hidden");
			game.parentElement.find(".tt-hidden").remove();
		});

		for (const gameClass of settings.hideCasinoGames) {
			const game = document.find(`.${gameClass}`);

			game.parentElement.classList.add("tt-hidden-parent");
			game.classList.add("hidden");
			game.insertAdjacentHTML("beforebegin", "<div class='tt-hidden'><span><b>•&nbsp;REMOVED&nbsp;•</b></span></div>");
		}
	}

	async function unhideCasinoGames() {
		await requireElement(".games-list");

		document.find(".msg .tt-msg").remove();
		document.find(".tt-hidden-parent").classList.remove("tt-hidden-parent");
		document.find(".tt-hidden").remove();
		document.findAll(".games-list .hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
