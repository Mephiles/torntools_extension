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
		await requireElement("#chatRoot");
		document.find("#chatRoot").classList.remove("no-zalgo");
	}

	function hideZalgo() {
		const root = document.find("#chatRoot");
		if (!root) return;

		root.classList.add("no-zalgo");
	}
})();
