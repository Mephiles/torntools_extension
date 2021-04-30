"use strict";

(async () => {
	requireElement("input#api_key").then(async () => {
		const apiKeyInput = document.find("input#api_key");
		if (!apiKeyInput.value) {
			await ttStorage.get(["api", "settings"]).then((storage) => {
				if (storage[1].pages.api.autoFillKey) apiKeyInput.value = storage[0].torn.key;
			})
		}
		apiKeyInput.focus();
	})
})();
