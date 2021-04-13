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

	async function hideZalgo() {
		await requireElement("#chatRoot");
		document.find("#chatRoot").classList.add("no-zalgo");
	}

	async function showZalgo() {
		await requireElement("#chatRoot");
		document.find("#chatRoot").classList.remove("no-zalgo");
	}
})();
