"use strict";

(async () => {
	if ((await checkDevice()).mobile) return "Not supported on mobile!";
	if (isFlying() || isAbroad()) return;

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
		CUSTOM_LISTENERS[EVENT_CHANNELS.STATE_CHANGED].push(({}) => {
			if (!feature.enabled()) return;

			const setting = document.find(".tt-settings");
			if (!setting) return;

			new MutationObserver((mutations, observer) => {
				observer.disconnect();
				setting.parentElement.appendChild(setting);
			}).observe(setting.parentElement, { childList: true });
		});
	}

	async function addLink() {
		await requireSidebar();

		const settingsSpan = document.newElement({
			type: "span",
			text: "TornTools Settings",
		});
		const ttSettingsDiv = document.newElement({
			type: "div",
			class: "tt-settings pill",
			children: [settingsSpan],
			attributes: { icon: "" },
		});
		ttSettingsDiv.insertAdjacentElement("afterbegin", ttSvg());
		ttSettingsDiv.addEventListener("click", () => {
			if (document.find(".tt-settings-iframe")) return;
			const ttSettingsIframe = document.newElement({
				type: "iframe",
				class: "tt-settings-iframe",
				attributes: {
					src: chrome.runtime.getURL("pages/settings/settings.html"),
				},
			});
			const returnToTorn = document.newElement({
				type: "div",
				class: "tt-back",
				children: [
					document.newElement({
						type: "div",
						children: [backSvg(), document.newElement({ type: "span", id: "back", text: "Back to TORN" })],
					}),
				],
			});
			const tornContent = document.find(".content-wrapper[role*='main']");

			tornContent.style.display = "none";
			tornContent.insertAdjacentElement("afterend", returnToTorn);
			tornContent.insertAdjacentElement("afterend", ttSettingsIframe);
			document.body.classList.add("tt-align-left");
			returnToTorn.addEventListener("click", () => {
				returnToTorn.remove();
				ttSettingsIframe.remove();
				tornContent.style.display = "block";
				document.body.classList.remove("tt-align-left");
			});
		});
		document.find(".areasWrapper [class*='toggle-content__']").appendChild(ttSettingsDiv);
	}

	function removeLink() {
		const returnToTorn = document.find(".tt-back");
		if (returnToTorn) returnToTorn.remove();

		const ttSettingsIframe = document.find(".tt-settings-iframe");
		if (ttSettingsIframe) ttSettingsIframe.remove();

		const tornContent = document.find(".content-wrapper[role*='main']");
		if (tornContent.style.display === "none") tornContent.style.display = "block";

		document.body.classList.remove("tt-align-left");

		const sidebarLink = document.find(".tt-settings");
		if (sidebarLink) sidebarLink.remove();
	}
})();
