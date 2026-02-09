(async () => {
	if (!getPageStatus().access) return;

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
		const msg = document.querySelector(".msg.right-round");
		if (!msg.querySelector(".tt-msg")) {
			msg.appendChild(
				elementBuilder({
					type: "div",
					children: [
						elementBuilder({
							type: "span",
							class: "tt-msg",
							text: "Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.",
						}),
					],
				})
			);
		}
		findAllElements(".games-list .tt-hidden").forEach((game) => {
			game.parentElement.classList.remove("tt-hidden-parent");
			game.classList.remove("tt-hidden");
			game.parentElement.querySelector(".tt-hidden").remove();
		});

		for (const gameClass of settings.hideCasinoGames) {
			const game = document.querySelector(`.${gameClass}`);

			game.parentElement.classList.add("tt-hidden-parent");
			game.classList.add("tt-hidden");
			game.insertAdjacentElement(
				"beforebegin",
				elementBuilder({
					type: "div",
					class: "tt-hidden",
					children: [elementBuilder({ type: "b", text: "• REMOVED •" })],
				})
			);
		}
	}

	async function unhideCasinoGames() {
		await requireElement(".games-list");

		document.querySelector(".msg .tt-msg").remove();
		document.querySelector(".tt-hidden-parent").classList.remove("tt-hidden-parent");
		document.querySelector(".tt-hidden").remove();
		findAllElements(".games-list .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
