"use strict";

(async () => {
	requireElement("input#api_key").then(async () => {
		const apiKeyInput = document.find("input#api_key");
		if (!apiKeyInput.value) {
			await ttStorage.get("api").then((api) => {
				if (api.torn.key) apiKeyInput.value = api.torn.key;
			});
		}
		apiKeyInput.focus();
	})
})();
