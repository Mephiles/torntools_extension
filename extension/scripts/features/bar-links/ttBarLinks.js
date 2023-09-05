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
		null
	);

	const LINKS = {
		"[class*='bar__'][class*='energy__']": (
			(isAbroad() && document.body.dataset.country === "south-africa")
				? "https://www.torn.com/index.php?page=hunting"
				: "https://www.torn.com/gym.php"),
		"[class*='bar__'][class*='nerve___']": "https://www.torn.com/crimes.php",
	};

	async function addLinks() {
		await requireSidebar();

		for (const selector of Object.keys(LINKS)) {
			const barLink = document.find(selector);
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
		const bar = event.target.closest("a[class*='bar___']");
		if (!bar) return;

		const link = LINKS[Object.keys(LINKS).filter((selector) => bar.matches(selector))[0]];
		if (!link) return;

		let target;
		if (event.button === 1) target = "_blank";
		else target = "_self";

		window.open(link, target);
	}

	function removeLinks() {
		for (const selector of Object.keys(LINKS)) {
			const barName = document.find(selector);
			if (!barName) continue;

			barName.removeEventListener("click", onClick);
			barName.classList.remove("bar-link");
		}
	}
})();
