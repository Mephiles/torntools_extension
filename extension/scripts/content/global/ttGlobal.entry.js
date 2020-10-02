console.log("Loading TT entry.",);

ttStorage.get().then(async ({ settings }) => {
	// Align left
	document.documentElement.style.setProperty("--torntools-align-left", settings.pages.global.alignLeft ? "20px" : "auto");

	// Upgrade button
	// document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hide_upgrade ? "none" : "block");
	// if (["home"].includes(getCurrentPage())) {
	// 	document.documentElement.style.setProperty("--torntools-hide-upgrade-info", settings.pages.global.hide_upgrade ? "none" : "block");
	// }
	//
	// // Hide quit/leave options
	// document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hide_leave ? "none" : "flex");

	// Hide icons
	// for (let icon of hide_icons) {
	// 	document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, "none");
	// }

	// Hide areas
	// for (let area of hide_areas) {
	// 	document.documentElement.style.setProperty(`--torntools-hide-area-${area.toLowerCase().replace(/ /g, "_")}`, "none");
	// }

	// Hide chats
	// document.documentElement.style.setProperty(`--torntools-hide-chat`, settings.pages.global.hide_chat ? "none" : "block");
	//
	// // Clean Flight page
	// document.documentElement.style.setProperty("--torntools-clean-flight-display", settings.clean_flight ? "none" : "block");
	//
	// // Chat font size
	// document.documentElement.style.setProperty("--torntools-chat-font-size", settings.font_size || "12px");

	// Mobile
	mobile = await mobileChecker();
	if (mobile) console.log("TT - Detected mobile usage.");
	console.log("Using mobile:", mobile);

	// Page status
	pageStatus = await getPageStatus();
	console.log("Page Status:", pageStatus);

	loadingStatus = LOADING_STATUSES.ENTRY;
});

function mobileChecker() {
	return new Promise((resolve) => {
		if (!window.location.host.includes("torn") || getCurrentPage() === "api") {
			resolve(false);
			return;
		}

		if (document.readyState === "complete" || document.readyState === "loaded") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			const browserWidth = window.innerWidth;

			if (browserWidth <= 600) resolve(true);
			else resolve(false);
		}
	});
}

function getPageStatus() {
	return requireCondition(() => {
		const heading = document.find("#skip-to-content, .title___2sbYr, .nonFullScreen .content-title h4");
		if (heading) {
			switch (heading.innerText) {
				case "Please Validate":
					return false;
				case "Error":
					return false;
			}
		}

		const message = document.find("div[role='main'] > .info-msg-cont");
		if (message) {
			if (message.innerText.includes("a page which is blocked when")) return true;
		}

		if (heading || message) return true;
	});
}