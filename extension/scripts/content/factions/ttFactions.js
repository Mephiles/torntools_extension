(async () => {
	if (getSearchParameters().get("step") === "your") {
		await requireElement(".faction-tabs");

		document.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);

		switch (getSubpage()) {
			case "armoury":
				loadArmory();
				break;
			default:
				break;
		}
	}

	function getSubpage() {
		const hash = window.location.hash.replace("#/", "");
		return !hash || hash.includes("war/") ? "main" : getHashParameters().get("tab") || "";
	}

	function loadArmory() {
		requireElement("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']").then(() => {
			triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: getCurrentSection() });
			new MutationObserver((mutations) => {
				if (
					!mutations
						.filter((mut) => mut.type === "childList" && mut.addedNodes.length)
						.flatMap((mut) => Array.from(mut.addedNodes))
						.some((node) => node.classList && node.classList.contains("item-list"))
				)
					return;

				triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: getCurrentSection() });
			}).observe(document.find(`#faction-armoury-tabs`), { childList: true, subtree: true });
		});

		function getCurrentSection() {
			return document.find("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
		}
	}
})();
