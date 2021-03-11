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
}
