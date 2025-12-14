"use strict";

(async () => {
	featureManager.adjustFeature("Hide Level Upgrade", null, hideUpgrade, showUpgrade);

	async function hideUpgrade() {
		await requireContent();

		for (const li of document.findAll(".info-msg li")) {
			if (li.textContent.includes("Congratulations! You have enough experience to go up to level")) {
				if (li.parentElement.childElementCount > 1) li.classList.add("tt-level-upgrade");
				else li.closest(".info-msg").classList.add("tt-level-upgrade");
				break;
			}
		}
	}

	function showUpgrade() {
		for (const info of document.findAll(".tt-level-upgrade")) {
			info.classList.remove("tt-level-upgrade");
		}
	}
})();
