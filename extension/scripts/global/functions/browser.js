"use strict";

function usingFirefox() {
	return navigator.userAgent.includes("Firefox");
}

function hasSilentSupport() {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}

function hasInteractionSupport() {
	if (navigator.userAgentData) {
		return navigator.userAgentData.brands.some(({ brand }) => brand === "Chromium");
	} else return !usingFirefox();
}
