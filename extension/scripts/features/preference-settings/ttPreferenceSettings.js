"use strict";

(async () => {
	featureManager.registerFeature("Preference Settings", "preferences", true, null, addContainer, dispose, null, null);

	function addContainer() {
		const { options } = createContainer("TornTools - Settings", { id: "tt-settings-container", onlyHeader: true, class: "mt10" });

		options.appendChild(
			document.newElement({
				type: "a",
				class: "preference-button",
				text: "Settings",
				href: chrome.runtime.getURL("pages/settings/settings.html"),
				attributes: {
					target: "_blank",
				},
			})
		);

		const connectButton = document.newElement({ type: "button", class: "preference-button", text: "Connect" });

		if (api.torn.key) {
			connectButton.setAttribute("disabled", "");
			connectButton.innerText = "Connected!";
		} else {
			connectButton.addEventListener("click", connect);
		}

		options.appendChild(connectButton);

		function connect() {
			const key = document.find("#newapi").getAttribute("value");

			changeAPIKey(key).then(() => {
				connectButton.setAttribute("disabled", "");
				connectButton.innerText = "Connected!";

				connectButton.removeEventListener("click", connect);
			});
		}
	}

	function dispose() {
		removeContainer("TornTools - Settings", { id: "tt-settings-container" });
	}
})();
