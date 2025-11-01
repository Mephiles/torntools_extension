"use strict";

(async () => {
	let mouseY;

	const feature = featureManager.registerFeature(
		"Mini Profile Last Action",
		"global",
		() => settings.pages.global.miniProfileLastAction,
		initialiseMiniProfile,
		null,
		null,
		{
			storage: ["settings.pages.global.miniProfileLastAction"],
		},
		null
	);

	function initialiseMiniProfile() {
		addFetchListener((event) => {
			if (!feature.enabled()) return;

			const {
				page,
				json,
				fetch: { url },
			} = event.detail;
			if (page !== "page") return;

			const params = new URL(url).searchParams;
			const sid = params.get("sid");
			if (sid !== "UserMiniProfile") return;

			showInformation(json);
		});
		document.addEventListener("mousemove", (event) => {
			mouseY = event.y;
		});
	}

	async function showInformation(information) {
		if (isNaN(information.user.lastAction.seconds)) return;

		const miniProfile = document.find("#profile-mini-root .mini-profile-wrapper");
		const lastAction = formatTime({ seconds: information.user.lastAction.seconds }, { type: "wordTimer", showDays: true });

		const lastActionDescription = await requireElement(".last-action-desc", { parent: miniProfile });

		lastActionDescription.textContent = `Last Action:\n${lastAction}`;
	}
})();
