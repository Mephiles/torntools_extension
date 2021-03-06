"use strict";

(async () => {
	featureManager.adjustFeature("Hide Level Upgrade", null, hideUpgrade, showUpgrade);

	async function hideUpgrade() {
		await requireContent();

		for (const info of document.findAll(".info-msg-cont")) {
			if (!info.innerText.includes("Congratulations! You have enough experience to go up to level")) continue;

			info.classList.add("tt-level-upgrade");
		}
	}

	function showUpgrade() {
		for (const info of document.findAll(".tt-level-upgrade")) {
			info.classList.remove("tt-level-upgrade");
		}
	}
})();
