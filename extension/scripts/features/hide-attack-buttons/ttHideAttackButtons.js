"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Hide Attack Buttons",
		"attack",
		() => settings.pages.attack.hideAttackButtons.length,
		null,
		addObserver,
		removeObserver,
		{
			storage: ["settings.pages.attack.hideAttackButtons"],
		},
		null
	);

	let observer;
	async function addObserver() {
		const defenderDiv = await requireElement("#defender");
		removeObserver();

		if (!observer) observer = new MutationObserver((mutations) => {
			mutations.forEach(mutation => {
				if (mutation.addedNodes?.length && [...mutation.addedNodes]?.some(node => node.matches("[class*='defender__']"))) {
					removeObserver();

					defenderDiv.findAll("button").forEach(button => {
						if (settings.pages.attack.hideAttackButtons.includes(button.textContent.trim())) button.classList.add("hidden");
					});
				}
			})
		});
		observer.observe(defenderDiv, { childList: true, subtree: true });
	}

	async function removeObserver() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
		document.findAll("#defender [class*='defender__'] button.hidden").forEach(x => x.classList.remove("hidden"));
	}
})();
