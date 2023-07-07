"use strict";

(async () => {
	featureManager.registerFeature("Item No Confirm", "no confirm", () => settings.scripts.noConfirm.itemEquip, injectAdjustments, null, null, null, null);

	function injectAdjustments() {
		injectXHR();

		document.head.appendChild(
			document.newElement({
				type: "script",
				attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/features/no-confirm/ttItemNoConfirm.inject.js") },
			}),
		);
	}
})();
