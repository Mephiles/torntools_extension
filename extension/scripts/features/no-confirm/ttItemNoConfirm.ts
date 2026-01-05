(async () => {
	featureManager.registerFeature("Item No Confirm", "no confirm", () => settings.scripts.noConfirm.itemEquip, injectAdjustments, null, null, null, null);

	function injectAdjustments() {
		injectXHR();

		executeScript(chrome.runtime.getURL("/scripts/features/no-confirm/ttItemNoConfirm.inject.js"), false);
	}
})();
