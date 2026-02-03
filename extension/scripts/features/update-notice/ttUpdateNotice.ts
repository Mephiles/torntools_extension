(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Update Notice",
		"sidebar",
		() => settings.updateNotice,
		null,
		showNotice,
		removeNotice,
		{
			storage: ["settings.updateNotice", "version.showNotice"],
		},
		null
	);

	async function showNotice() {
		await requireSidebar();

		if (!version.showNotice) {
			removeNotice();
			return;
		}

		if (document.find("#ttUpdateNotice")) return;

		const currentVersion = chrome.runtime.getManifest().version;

		const parent = document.find("h2=Areas").parentElement.nextElementSibling;
		parent.insertBefore(
			elementBuilder({
				type: "div",
				class: "tt-sidebar-area",
				id: "ttUpdateNotice",
				children: [
					elementBuilder({
						type: "div",
						children: [
							elementBuilder({
								type: "a",
								href: chrome.runtime.getURL("/pages/settings/settings.html") + "?page=changelog",
								attributes: { target: "_blank" },
								children: [elementBuilder({ type: "span", text: `TornTools updated: ${currentVersion}` })],
							}),
						],
					}),
				],
			}),
			parent.firstElementChild
		);
	}

	function removeNotice() {
		const notice = document.find("#ttUpdateNotice");
		if (notice) notice.remove();
	}

	return true;
})();
