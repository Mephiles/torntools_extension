"use strict";

(async () => {
	if ((await checkDevice()).mobile) return "Not supported on mobile!";

	if (isFlying() || isAbroad()) return;

	featureManager.registerFeature(
		"Bar Links",
		"sidebar",
		() => settings.pages.sidebar.barLinks,
		null,
		addLinks,
		removeLinks,
		{
			storage: ["settings.pages.sidebar.barLinks"],
		},
		null
	);

	const LINKS = {
		barEnergy: "https://www.torn.com/gym.php",
		barNerve: "https://www.torn.com/crimes.php",
	};

	async function addLinks() {
		await requireSidebar();

		for (const id of Object.keys(LINKS)) {
			const barName = document.find(`#${id} [class*="bar-name_"]`);
			if (!barName) continue;

			barName.addEventListener("click", onClick);
			barName.classList.add("bar-link");
		}
	}

	function onClick(event) {
		const bar = event.target.closest("a[id][class*='bar___']");
		if (!bar) return;

		const link = LINKS[bar.id];
		if (!link) return;

		window.open(link, "_self");
	}

	function removeLinks() {
		for (const id of Object.keys(LINKS)) {
			const barName = document.find(`#${id} .bar-link`);
			if (!barName) continue;

			barName.removeEventListener("click", onClick);
			barName.classList.remove("bar-link");
		}
	}
})();
