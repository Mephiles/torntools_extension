(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	const feature = featureManager.registerFeature(
		"TT Settings Link",
		"sidebar",
		() => settings.pages.sidebar.settingsLink,
		initialiseLink,
		addLink,
		removeLink,
		{
			storage: ["settings.pages.sidebar.settingsLink"],
		},
		null
	);

	function initialiseLink() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATE_CHANGED].push(() => {
			if (!feature.enabled()) return;

			const setting = document.find(".tt-settings");
			if (!setting) return;

			new MutationObserver((_mutations, observer) => {
				observer.disconnect();
				setting.parentElement.appendChild(setting);
			}).observe(setting.parentElement, { childList: true });
		});
	}

	let addedMessageListener = false;
	async function addLink() {
		await requireSidebar();

		const settingsSpan = elementBuilder({
			type: "span",
			text: "TornTools Settings",
		});
		const ttSettingsDiv = elementBuilder({
			type: "div",
			class: "tt-settings pill",
			children: [settingsSpan],
			attributes: { icon: "" },
		});
		ttSettingsDiv.insertAdjacentElement("afterbegin", ttSvg());
		ttSettingsDiv.addEventListener("click", () => {
			if (document.getElementById("tt-settings-iframe")) return;
			const ttSettingsIframe = elementBuilder({
				type: "iframe",
				id: "tt-settings-iframe",
				attributes: {
					src: chrome.runtime.getURL("pages/settings/settings.html"),
				},
			});
			if (!addedMessageListener) {
				window.addEventListener("message", messageListener);
				addedMessageListener = true;
			}
			const returnToTorn = elementBuilder({
				type: "div",
				class: "tt-back",
				children: [
					elementBuilder({
						type: "div",
						children: [backSvg(), elementBuilder({ type: "span", id: "back", text: "Back to TORN" })],
					}),
				],
			});
			const tornContent = document.find(".content-wrapper[role*='main']");

			tornContent.style.visibility = "hidden";
			tornContent.insertAdjacentElement("afterend", returnToTorn);
			tornContent.insertAdjacentElement("afterend", ttSettingsIframe);
			document.body.classList.add("tt-align-left");
			returnToTorn.addEventListener("click", () => {
				document.getElementById("saveSettingsBar")?.remove();
				returnToTorn.remove();
				ttSettingsIframe.remove();
				tornContent.style.visibility = "";
				document.body.classList.remove("tt-align-left");
			});
		});
		document.find(".areasWrapper [class*='toggle-content__']").appendChild(ttSettingsDiv);
	}

	function messageListener(event: MessageEvent) {
		let saveSettingsBar = document.getElementById("saveSettingsBar");
		if (!saveSettingsBar) {
			saveSettingsBar = elementBuilder({
				type: "div",
				id: "saveSettingsBar",
				class: "tt-hidden",
				children: [
					elementBuilder({
						type: "div",
						children: [
							elementBuilder({ type: "span", text: "You have unsaved changes." }),
							elementBuilder({
								type: "button",
								id: "revertSettings",
								text: "Revert",
								events: {
									click: () => {
										document.getElementById("saveSettingsBar").classList.add("tt-hidden");
										document.find<HTMLIFrameElement>("#tt-settings-iframe").contentWindow.postMessage({ torntools: 1, revert: 1 }, "*");
									},
								},
							}),
							elementBuilder({
								type: "button",
								id: "saveSettings",
								text: "Save",
								events: {
									click: () => {
										document.getElementById("saveSettingsBar").classList.add("tt-hidden");
										document.find<HTMLIFrameElement>("#tt-settings-iframe").contentWindow.postMessage({ torntools: 1, save: 1 }, "*");
									},
								},
							}),
						],
					}),
				],
			});
			document.body.insertAdjacentElement("beforeend", saveSettingsBar);
		}
		if (event.data !== null && typeof event.data === "object" && event.data.torntools) {
			if (event.data.show) saveSettingsBar.classList.remove("tt-hidden");
			else if (event.data.hide) saveSettingsBar.classList.add("tt-hidden");
		}
	}

	function removeLink() {
		findAllElements(".tt-back, .tt-settings, #tt-settings-iframe, #saveSettingsBar").forEach((x) => x.remove());

		const tornContent = document.find(".content-wrapper[role*='main']");
		if (tornContent.style.display === "none") tornContent.style.display = "block";

		document.body.classList.remove("tt-align-left");
	}

	return true;
})();
