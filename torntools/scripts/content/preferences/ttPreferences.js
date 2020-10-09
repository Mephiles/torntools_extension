window.addEventListener("load", () => {
	console.log("TT - Preferences");

	const settings_container = content.newContainer("TornTools - Settings", { header_only: true, all_rounded: true, _class: "m-top10" });

	// Preferences link
	const settingsLink = doc.new({ type: "div", class: "in-title tt-torn-button", text: "Preferences" });
	settings_container.find(".tt-options").appendChild(settingsLink);

	settingsLink.onclick = () => {
		window.open(chrome.runtime.getURL("views/settings/settings.html"));
	};

	// Connect button
	const connectButton = doc.new({ type: "div", class: "in-title tt-torn-button", text: "Connect" });
	settings_container.find(".tt-options").appendChild(connectButton);

	if (api_key) {
		connectButton.classList.add("disabled");
		connectButton.innerText = "Connected!";
	} else {
		connectButton.onclick = () => {
			const apiKeyFieldValue = doc.find("#newapi").getAttribute("value");

			ttStorage.set({ api_key: apiKeyFieldValue }, () => {
				chrome.runtime.sendMessage({ action: "initialize" }, (response) => {
					console.log(response.message);

					if (response.success) {
						connectButton.classList.add("disabled");
						connectButton.innerText = "Connected!";

						connectButton.onclick = () => {};
					}
				});
			});
		};
	}
});
