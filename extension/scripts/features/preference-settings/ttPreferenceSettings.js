"use strict";

(async () => {
	featureManager.registerFeature("Preference Settings", "preferences", true, null, executeFeature, dispose, null, null);

	async function executeFeature() {
		const searchParams = getSearchParameters();
		if (searchParams.get("torntools") === "connect") connectRedirect();

		showContainer();

		function showContainer() {
			const { options } = createContainer("TornTools - Settings", { id: "tt-settings-container", onlyHeader: true, class: "mt10" });

			options.appendChild(
				document.newElement({
					type: "a",
					class: "preference-button",
					text: "Settings",
					href: chrome.runtime.getURL("pages/settings/settings.html"),
					attributes: { target: "_blank" },
				})
			);

			const connectButton = document.newElement({ type: "a", class: "preference-button", text: "Connect" });
			options.appendChild(connectButton);

			if (api.torn.key) {
				connectButton.setAttribute("disabled", "");
				connectButton.removeAttribute("href");
				connectButton.textContent = "Connected!";
			} else {
				handleKeyView(connectButton);
				[...document.findAll("#prefs-tab-menu .headers > li")].forEach((item) => item.addEventListener("click", () => handleKeyView(connectButton)));
			}
		}

		function isViewingKeys() {
			const tab = getHashParameters().get("tab");

			return tab === "api" || tab === "api?";
		}

		function handleKeyView(connectButton) {
			if (isViewingKeys()) {
				requireElement("[class*='api___']").then(async (apiContainer) => {
					await requireElement("li[class*='keyRow___']", { parent: apiContainer });

					const defaultKey = [...apiContainer.findAll("li[class*='keyRow___']")]
						.find((element) => !element.find("[class*='name___']").textContent)
						?.find("input").value;

					connectButton.textContent = "Connect";
					connectButton.classList.remove("hidden");

					if (defaultKey) {
						// Using onclick to avoid multiple events.
						connectButton.onclick = () => updateKey(defaultKey);
						connectButton.removeAttribute("href");
						connectButton.setAttribute("title", "Connect using the default key.");
					} else {
						connectButton.href = "preferences.php?torntools=connect#tab=api?&step=addNewKey&title=TornTools&type=3";
						connectButton.setAttribute("title", "Connect with a newly generated API key.");
					}
				});
			} else {
				connectButton.classList.add("hidden");
			}
		}

		function updateKey(key) {
			changeAPIKey(key).then(() => {
				connectButton.setAttribute("disabled", "");
				connectButton.textContent = "Connected!";
				connectButton.removeAttribute("href");
			});
		}

		function connectRedirect() {
			requireElement("[id^='key-popup-']").then((input) => updateKey(input.value));
		}
	}

	function dispose() {
		removeContainer("TornTools - Settings", { id: "tt-settings-container" });
	}
})();
