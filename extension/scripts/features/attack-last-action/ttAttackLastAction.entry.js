"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Attack Last Action",
		"attack",
		() => settings.pages.attack.defenderLastAction,
		addListener,
		showLastAction,
		removeLastAction,
		{
			storage: ["settings.pages.attack.defenderLastAction"],
		},
		null
	);

	let lastAction;
	function addListener() {
		addFetchListener(
			({
				detail: {
					page,
					json,
					fetch: { url },
				},
			}) => {
				if (!feature.enabled()) return;

				try {
					const params = new URL(url).searchParams;

					if (!(page === "loader" && params.get("sid") === "attackData" && params.get("mode") === "json")) return;

					lastAction = parseInt(json.DB.defenderUser.lastaction);
					showLastAction();
				} catch (err) {}
			}
		);
	}

	let executing = false;
	async function showLastAction() {
		if (executing) return;
		executing = true;

		removeLastAction();

		const playerModelEl = await requireElement("[class*='playersModelWrap__']");
		if (lastAction) {
			playerModelEl.insertAdjacentHTML(
				"beforebegin",
				`<div id="tt-defender-last-action">
					Defender Last Action: ${formatTime({ seconds: lastAction }, { type: "ago" })}.
				</div>`
			);
		}

		executing = false;
	}

	function removeLastAction() {
		document.find("#tt-defender-last-action")?.remove();
	}
})();
