"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"FF Scouter Mini Profile",
		"ff-scouter",
		() => settings.scripts.ffScouter.miniProfile,
		initialiseMiniprofile,
		null,
		null,
		{
			storage: ["settings.scripts.ffScouter.miniProfile", "settings.external.tornpal"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.tornpal) return "TornPal not enabled";
		}
	);

	function initialiseMiniprofile() {
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

			showFF(json);
		});
	}

	async function showFF(information) {
		const userId = information.user.userID;

		scoutFF(userId).then((scout) => {
			const { message, className, detailMessage } = buildScoutInformation(scout);

			const element = document.newElement({ type: "span", class: ["tt-ff-scouter-mini-profile", className], text: message });
			if (detailMessage) {
				element.setAttribute("title", detailMessage);
			}

			requireElement("#profile-mini-root .profile-container .description").then((d) => d.appendChild(element));
		});
	}
})();
