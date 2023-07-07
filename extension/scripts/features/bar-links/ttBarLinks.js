"use strict";

(async () => {
	if ((await checkDevice()).mobile) return "Not supported on mobile!";

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
		null,
	);

	const LINKS = {
		barEnergy: "https://www.torn.com/gym.php",
		barNerve: "https://www.torn.com/crimes.php",
	};

	async function addLinks() {
		await requireSidebar();

		for (const id of Object.keys(LINKS)) {
			const barLink = document.find(`#${id}`);
			if (!barLink) continue;

			barLink.removeAttribute("href");
			barLink.addEventListener("click", onClick);
			barLink.addEventListener("mouseup", (event) => {
				if (event.button !== 1) return; // 1 is middle click

				onClick(event);
			});
			barLink.classList.add("bar-link");
		}
	}

	function onClick(event) {
		const bar = event.target.closest("a[id][class*='bar___']");
		if (!bar) return;

		const link = LINKS[bar.id];
		if (!link) return;

		let target;
		if (event.button === 1) target = "_blank";
		else target = "_self";

		window.open(link, target);
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
