(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Hide Attack Buttons",
		"attack",
		() => settings.pages.attack.hideAttackButtons.length > 0,
		null,
		addObserver,
		removeObserver,
		{
			storage: ["settings.pages.attack.hideAttackButtons"],
		},
		null
	);

	let observer: MutationObserver | undefined;
	async function addObserver() {
		const defenderDiv: Element = await requireElement("#defender");
		removeObserver().catch(console.error);

		if (!observer)
			observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.addedNodes?.length && [...mutation.addedNodes]?.some((node) => isElement(node) && node.matches("[class*='defender__']"))) {
						removeObserver();

						findAllElements("button", defenderDiv).forEach((button) => {
							if (settings.pages.attack.hideAttackButtons.includes(button.textContent.trim())) button.classList.add("tt-hidden");
						});
					}
				});
			});
		observer.observe(defenderDiv, { childList: true, subtree: true });
	}

	async function removeObserver() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
		findAllElements("#defender [class*='defender__'] button.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
