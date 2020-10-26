console.log("TT - Loading global entry.");

let mobile = false;
let page_status;

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

ttStorage.get(["settings", "hide_icons", "hide_areas"], async ([settings, hide_icons, hide_areas]) => {
	// Align left
	if (settings.pages.global.align_left) document.documentElement.classList.add("tt-align-left");

	document.documentElement.style.setProperty("--torntools-align-left", settings.pages.global.align_left ? "20px" : "auto");

	if (getSearchParameters().has("popped")) document.documentElement.classList.add("tt-popout");

	// Upgrade button
	document.documentElement.style.setProperty("--torntools-hide-upgrade-button", settings.pages.global.hide_upgrade ? "none" : "block");
	if (["home"].includes(getCurrentPage())) {
		document.documentElement.style.setProperty("--torntools-hide-upgrade-info", settings.pages.global.hide_upgrade ? "none" : "block");
	}

	// Hide quit/leave options
	document.documentElement.style.setProperty("--torntools-hide-leave-button", settings.pages.global.hide_leave ? "none" : "flex");

	// Hide Doctorn
	if (
		settings.force_tt &&
		["home", "city", "travelagency", "war", "items", "crimes", "gym", "bounties", "profile", "faction", "jail"].includes(getCurrentPage())
	) {
		document.documentElement.style.setProperty("--torntools-hide-doctorn", "none");
	}

	// Hide icons
	for (let icon of hide_icons) {
		document.documentElement.style.setProperty(`--torntools-hide-icons-${icon}`, "none");
	}

	// Hide areas
	for (let area of hide_areas) {
		document.documentElement.style.setProperty(`--torntools-hide-area-${area.toLowerCase().replace(/ /g, "_")}`, "none");
	}

	// Hide chats
	document.documentElement.style.setProperty(`--torntools-hide-chat`, settings.pages.global.hide_chat ? "none" : "block");

	// Clean Flight page
	document.documentElement.style.setProperty("--torntools-clean-flight-display", settings.clean_flight ? "none" : "block");

	// Chat font size
	document.documentElement.style.setProperty("--torntools-chat-font-size", settings.font_size || "12px");

	// Mobile
	mobile = await mobileChecker();
	console.log("Using mobile:", mobile);

	// // Hide Gym highlight
	// if (settings.pages.gym.disable_defense &&
	//     settings.pages.gym.disable_dexterity &&
	//     settings.pages.gym.disable_speed &&
	//     settings.pages.gym.disable_strength) {
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight", mobile ? "#3A3A3A" : "#f2f2f2");
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight-active", "#fff");
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight-hover", "#fff");
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight-icon", "url(#sidebar_svg_gradient_regular_desktop)");
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight-icon-active", "url(#sidebar_svg_gradient_regular_desktop_active)");
	// } else {
	//     document.documentElement.style.setProperty("--torntools-disable-gym-highlight", mobile ? "#3A3A3A" : "#f2f2f2");
	// }

	// Page status
	page_status = await getPageStatus();
	console.log("Page Status:", page_status);

	if (database_status === DATABASE_STATUSES.LOADING) {
		database_status = DATABASE_STATUSES.LOADING_ENTRY;
	} else {
		database_status = DATABASE_STATUSES.ENTRY;
	}
});
