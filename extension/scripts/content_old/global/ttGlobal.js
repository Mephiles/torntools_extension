"use strict";

let initiatedIconMoving = false;
let mouseX, mouseY;

(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	loadGlobalOnce();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobalOnce() {
	document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay hidden" }));
	setInterval(() => {
		for (let countdown of document.findAll(".countdown.automatic[data-seconds]")) {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.removeAttribute("seconds-down");
				countdown.innerText = "Ready";
				continue;
			}

			countdown.innerText = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			// noinspection JSValidateTypes
			countdown.dataset.seconds = seconds;
		}
	}, 1000);

	if (settings.pages.global.miniProfileLastAction) {
		addFetchListener((event) => {
			if (!event.detail) return;
			const { page, json, fetch } = event.detail;

			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");

			if (page === "profiles" && step === "getUserNameContextMenu") {
				showMiniprofileInformation(json);
			}
		});
		document.addEventListener("mousemove", (event) => {
			mouseX = event.x;
			mouseY = event.y;
		});
	}
}

function showMiniprofileInformation(information) {
	const miniProfile = document.find("#profile-mini-root .mini-profile-wrapper");

	const lastAction = formatTime({ seconds: information.user.lastAction.seconds }, { type: "wordTimer", showDays: true });

	requireElement("div[class*='-profile-mini-_userProfileWrapper']", { parent: miniProfile }).then(() => {
		const oldHeight = miniProfile.clientHeight;
		const data = document.newElement({
			type: "div",
			class: "tt-mini-data",
			children: [document.newElement({ type: "strong", text: "Last Action: " }), document.newElement({ type: "span", text: lastAction })],
		});
		miniProfile.find("div[class*='-profile-mini-_userProfileWrapper']").appendChild(data);

		const profileBounding = miniProfile.getBoundingClientRect();
		if (profileBounding.top < mouseY) {
			const profileY = parseInt(miniProfile.style.top.replace("px", ""));
			const heightDifference = miniProfile.clientHeight - oldHeight;

			miniProfile.style.top = `${profileY - heightDifference}px`;
		}
	});
}
