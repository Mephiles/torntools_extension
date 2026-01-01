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
		const msg = document.find(".msg.right-round");
		if (!msg.find(".tt-msg")) {
			msg.appendChild(
				document.newElement({
					type: "div",
					children: [
						document.newElement({
							type: "span",
							class: "tt-msg",
							text: "Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.",
						}),
					],
				})
			);
		}
		document.findAll(".games-list .tt-hidden").forEach((game) => {
			game.parentElement.classList.remove("tt-hidden-parent");
			game.classList.remove("tt-hidden");
			game.parentElement.find(".tt-hidden").remove();
		});

		for (const gameClass of settings.hideCasinoGames) {
			const game = document.find(`.${gameClass}`);

			game.parentElement.classList.add("tt-hidden-parent");
			game.classList.add("tt-hidden");
			game.insertAdjacentElement(
				"beforebegin",
				document.newElement({
					type: "div",
					class: "tt-hidden",
					children: [document.newElement({ type: "b", text: "• REMOVED •" })],
				})
			);
		}
	}

	async function unhideCasinoGames() {
		await requireElement(".games-list");

		document.find(".msg .tt-msg").remove();
		document.find(".tt-hidden-parent").classList.remove("tt-hidden-parent");
		document.find(".tt-hidden").remove();
		document.findAll(".games-list .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
