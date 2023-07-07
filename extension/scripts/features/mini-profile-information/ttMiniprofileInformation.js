"use strict";

(async () => {
	let mouseY;

	const feature = featureManager.registerFeature(
		"Miniprofile Information",
		"global",
		() => settings.pages.global.miniProfileLastAction,
		initialiseMiniprofile,
		null,
		null,
		{
			storage: ["settings.pages.global.miniProfileLastAction"],
		},
		null
	);

	function initialiseMiniprofile() {
		addFetchListener((event) => {
			if (!feature.enabled()) return;

			const { page, json, fetch } = event.detail;
			if (page !== "profiles") return;

			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");
			if (step !== "getMiniProfile") return;

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

		const userProfileWrapper = await requireElement("div[class*='profile-mini-_userProfileWrapper___']", { parent: miniProfile });

		const oldHeight = miniProfile.clientHeight;
		const data = document.newElement({
			type: "div",
			class: "tt-mini-data",
			children: [document.newElement({ type: "strong", text: "Last Action: " }), document.newElement({ type: "span", text: lastAction })],
		});
		userProfileWrapper.appendChild(data);

		const profileBounding = miniProfile.getBoundingClientRect();
		if (profileBounding.top < mouseY) {
			const profileY = parseInt(miniProfile.style.top.replace("px", ""));
			const heightDifference = miniProfile.clientHeight - oldHeight;

			miniProfile.style.top = `${profileY - heightDifference}px`;
		}
	}
})();
