(async () => {
	const SCOUTER_SERVICE = scouterService();

	const feature = featureManager.registerFeature(
		"FF Scouter Mini Profile",
		"ff-scouter",
		() => settings.scripts.ffScouter.miniProfile,
		initialiseMiniProfile,
		null,
		null,
		{
			storage: ["settings.scripts.ffScouter.miniProfile", "settings.external.ffScouter"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.ffScouter) return "FFScouter not enabled.";

			return true;
		}
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

			showFF(json);
		});
	}

	async function showFF(information: any) {
		const userId = information.user.userID;

		SCOUTER_SERVICE.scoutSingle(userId)
			.then((scout) => showResult(scout))
			.catch((reason) => {
				if ("error" in reason) {
					showResult({ player_id: userId, message: reason.error, message_short: reason.error, isError: true });
				} else {
					console.error("TT - Failed to scout ff for the mini profile.", reason);
				}
			});
	}

	async function showResult(scout: ScouterResult) {
		const { message, className, detailMessage } = buildScoutInformation(scout);

		const element = elementBuilder({ type: "span", class: ["tt-ff-scouter-mini-profile", className], text: message });
		if (detailMessage) {
			element.setAttribute("title", detailMessage);
		}

		const lastActionSection = await requireElement("#profile-mini-root .profile-container .description .last-action");
		lastActionSection.insertAdjacentElement("beforebegin", element);
	}
})();
