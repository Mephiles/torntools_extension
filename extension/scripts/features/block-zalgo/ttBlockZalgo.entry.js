"use strict";

(async () => {
	featureManager.registerFeature(
		"Block Zalgo",
		"chat",
		() => settings.pages.chat.blockZalgo,
		null,
		hideZalgo,
		showZalgo,
		{
			storage: ["settings.pages.chat.blockZalgo"],
		},
		null
	);

	async function showZalgo() {
		const chatRoot = await requireElement("#chatRoot");
		chatRoot.classList.remove("no-zalgo");
	}

	function hideZalgo() {
		const root = document.find("#chatRoot");
		if (!root) return;

		root.classList.add("no-zalgo");
	}
})();
